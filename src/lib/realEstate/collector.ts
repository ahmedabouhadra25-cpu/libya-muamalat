import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  PROPERTY_CITY_FILTER,
  PROPERTY_FETCH_TIMEOUT_MS,
  PROPERTY_MAX_DETAIL_ENRICHMENTS_PER_CYCLE,
  PROPERTY_PAGES_PER_SOURCE,
  PROPERTY_PAGE_SIZE,
  PROPERTY_REFRESH_INTERVAL_MS,
  PROPERTY_SOURCES,
} from "@/lib/realEstate/config";
import type {
  PropertyDealType,
  PropertyFilters,
  PropertyListing,
  PropertySearchResult,
  PropertyType,
} from "@/lib/realEstate/types";

/**
 * المُجمِّع الخلفي (Background Collector) لعقارات طرابلس — server-side فقط،
 * معزول تمامًا عن src/lib/news/* وطبقة AI: لا استيراد في أي اتجاه. يعمل
 * دائمًا بمعزل عن أي طلب مستخدم: getProperties() لا تنتظر أي جلب شبكي أبدًا،
 * فقط تقرأ الكاش الحالي في الذاكرة وتُصفّي/تُرقّم صفحاته.
 *
 * التدفق الحقيقي: مصادر العقارات → تحديث دوري في الخلفية (runCollectionCycle)
 * → كاش في الذاكرة + ملف JSON على القرص كطبقة "قاعدة بيانات" خفيفة تحافظ
 * على البيانات بين إعادة تشغيل الخادم → getProperties() تقرأ من هذا الكاش.
 */

const CACHE_FILE_PATH = join(process.cwd(), ".data", "properties-cache.json");

let cache: PropertyListing[] = [];
let lastCollectedAtMs: number | null = null;
let backgroundStarted = false;
let collectionInFlight = false;

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function decodeEntities(text: string): string {
  return text.replace(/&(#\d+|#x[0-9a-fA-F]+|[a-zA-Z]+);/g, (whole, code: string) => {
    if (code.startsWith("#x") || code.startsWith("#X")) {
      const codePoint = Number.parseInt(code.slice(2), 16);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : whole;
    }
    if (code.startsWith("#")) {
      const codePoint = Number.parseInt(code.slice(1), 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : whole;
    }
    return NAMED_ENTITIES[code] ?? whole;
  });
}

function cleanText(raw: string): string {
  return decodeEntities(raw.replace(/<[^>]*>/g, "")).replace(/\s+/g, " ").trim();
}

function sanitizeLink(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function formatUpdatedLabel(ms: number): string | null {
  try {
    return new Intl.DateTimeFormat("ar-LY", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(ms));
  } catch {
    return null;
  }
}

const TYPE_MAP: Record<string, PropertyType> = {
  apartment: "apartment",
  studio: "apartment",
  villa: "villa",
  house: "house",
  land: "land",
  stores: "shop",
  store: "shop",
  office: "office",
  building: "building",
  warehouses: "building",
  "rest houses": "investment",
  chalets: "investment",
};

function classifyType(rawLabel: string): PropertyType {
  const key = rawLabel.trim().toLowerCase();
  return TYPE_MAP[key] ?? "other";
}

/** "Al Nofleen (Tripoli)" -> "Tripoli"، أو null إن تعذّر تحديد المدينة بثقة. */
function extractCity(region: string): string | null {
  const match = region.match(/\(([^)]+)\)\s*$/);
  return match ? match[1].trim() : null;
}

function parsePrice(raw: string): number | null {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return null;
  const value = Number.parseInt(digits, 10);
  return Number.isFinite(value) ? value : null;
}

function parseNumber(raw: string): number | null {
  const value = Number.parseFloat(raw.replace(/,/g, ""));
  return Number.isFinite(value) ? value : null;
}

async function fetchText(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROPERTY_FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LibyaMuamalatPropertyCollector/1.0)" },
    });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

interface ParsedCard {
  externalId: string;
  detailPath: string;
  rawType: string;
  title: string;
  region: string;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  areaSqm: number | null;
}

/** يقسّم صفحة نتائج bahu.ly إلى بطاقات عبر روابط "/offers-details/" كنقاط فصل، ثم يستخرج حقول كل بطاقة من النص الذي يليها. */
function parseListPage(html: string): ParsedCard[] {
  const anchorRe = /<a[^>]*href="(\/[a-z]{2}\/offers-details\/([a-f0-9]+))"[^>]*>/g;
  const anchors: { index: number; detailPath: string; externalId: string }[] = [];
  let match: RegExpExecArray | null;
  while ((match = anchorRe.exec(html))) {
    anchors.push({ index: match.index, detailPath: match[1], externalId: match[2] });
  }

  const cards: ParsedCard[] = [];
  const seenIds = new Set<string>();

  for (let i = 0; i < anchors.length; i++) {
    const { index, detailPath, externalId } = anchors[i];
    if (seenIds.has(externalId)) continue;
    seenIds.add(externalId);

    const end = i + 1 < anchors.length ? anchors[i + 1].index : Math.min(html.length, index + 6000);
    const chunk = html.slice(index, end);

    const typeMatch = chunk.match(/class="text-secondary" style="font-size: 14px;">\s*([^<]+?)\s*</);
    const titleMatch = chunk.match(/class="h5 title-offer ellipsis text-dark">\s*([^<]*?)\s*</);
    const priceMatch = chunk.match(/class="text-dark price">\s*([^<]+?)\s*</);
    const regionMatch = chunk.match(/uil-location-point me-1[^>]*><\/i>\s*([^<]+?)\s*</);
    const bedroomsMatch = chunk.match(/uil-bed-double"><\/i>\s*([\d.]+)/);
    const bathroomsMatch = chunk.match(/uil-bath"><\/i>\s*([\d.]+)/);
    const areaMatch = chunk.match(/uil-expand-arrows-alt"><\/i>\s*([\d.,]+)\s*sqm/);

    if (!titleMatch || !regionMatch || !typeMatch) continue;

    cards.push({
      externalId,
      detailPath,
      rawType: cleanText(typeMatch[1]),
      title: cleanText(titleMatch[1]),
      region: cleanText(regionMatch[1]),
      price: priceMatch ? parsePrice(priceMatch[1]) : null,
      bedrooms: bedroomsMatch ? parseNumber(bedroomsMatch[1]) : null,
      bathrooms: bathroomsMatch ? parseNumber(bathroomsMatch[1]) : null,
      areaSqm: areaMatch ? parseNumber(areaMatch[1]) : null,
    });
  }

  return cards;
}

interface DetailEnrichment {
  imageUrl: string | null;
  description: string | null;
}

/** يجلب صورة ووصف حقيقيين من صفحة الإعلان (og:image + meta description) — لا يخترع أي منهما عند الفشل. */
async function fetchDetailEnrichment(detailUrl: string): Promise<DetailEnrichment> {
  const html = await fetchText(detailUrl);
  if (!html) return { imageUrl: null, description: null };

  const imageMatch = html.match(/property="og:image"\s+content="([^"]+)"/);
  const descriptionMatch = html.match(/name="description"\s+content="([^"]*)"/);

  const imageUrl = imageMatch ? sanitizeLink(decodeEntities(imageMatch[1])) : null;
  const description = descriptionMatch ? cleanText(descriptionMatch[1]) : null;

  return { imageUrl, description: description && description.length > 0 ? description : null };
}

function readCacheFromDisk(): PropertyListing[] {
  try {
    const raw = readFileSync(CACHE_FILE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PropertyListing[]) : [];
  } catch {
    return [];
  }
}

function writeCacheToDisk(items: PropertyListing[]): void {
  try {
    mkdirSync(dirname(CACHE_FILE_PATH), { recursive: true });
    writeFileSync(CACHE_FILE_PATH, JSON.stringify(items), "utf8");
  } catch {
    // فشل الكتابة على القرص لا يوقف شيئًا — الكاش في الذاكرة يبقى المصدر الفعلي أثناء تشغيل الخادم.
  }
}

/** دورة تحديث واحدة: تجلب كل المصادر، تُصفّي طرابلس فقط، تُثرّي الجديد بالصورة/الوصف، ثم تدمج مع الكاش القديم. */
async function runCollectionCycle(): Promise<void> {
  if (collectionInFlight) return;
  collectionInFlight = true;

  try {
    const previousById = new Map(cache.map((item) => [item.id, item]));
    const fetches: Promise<{ dealType: PropertyDealType; source: string; html: string | null }>[] = [];

    for (const src of PROPERTY_SOURCES) {
      for (let page = 1; page <= PROPERTY_PAGES_PER_SOURCE; page++) {
        const pageUrl = page === 1 ? src.listUrl : `${src.listUrl}?page=${page}`;
        fetches.push(
          fetchText(pageUrl).then((html) => ({ dealType: src.dealType, source: src.name, html }))
        );
      }
    }

    const pages = await Promise.allSettled(fetches);
    const now = Date.now();
    const mergedById = new Map<string, PropertyListing>();
    const pendingEnrichment: PropertyListing[] = [];

    for (const result of pages) {
      if (result.status !== "fulfilled" || !result.value.html) continue;
      const { dealType, source, html } = result.value;

      for (const card of parseListPage(html)) {
        const city = extractCity(card.region);
        if (!city || city.toLowerCase() !== PROPERTY_CITY_FILTER.toLowerCase()) continue;

        const id = `${source}::${card.externalId}`;
        if (mergedById.has(id)) continue;

        const previous = previousById.get(id);
        const detailUrl = sanitizeLink(new URL(card.detailPath, "https://bahu.ly").toString());
        if (!detailUrl) continue;

        const listing: PropertyListing = {
          id,
          title: card.title,
          propertyType: classifyType(card.rawType),
          dealType,
          region: card.region,
          city,
          price: card.price,
          areaSqm: card.areaSqm,
          bedrooms: card.bedrooms,
          bathrooms: card.bathrooms,
          imageUrl: previous?.imageUrl ?? null,
          description: previous?.description ?? null,
          source,
          sourceUrl: detailUrl,
          lastSeenAtMs: now,
          lastUpdatedLabel: formatUpdatedLabel(now),
        };

        mergedById.set(id, listing);
        if (!previous || !previous.imageUrl) pendingEnrichment.push(listing);
      }
    }

    const toEnrich = pendingEnrichment.slice(0, PROPERTY_MAX_DETAIL_ENRICHMENTS_PER_CYCLE);
    const enrichmentResults = await Promise.allSettled(
      toEnrich.map(async (listing) => ({ id: listing.id, enrichment: await fetchDetailEnrichment(listing.sourceUrl) }))
    );

    for (const result of enrichmentResults) {
      if (result.status !== "fulfilled") continue;
      const listing = mergedById.get(result.value.id);
      if (!listing) continue;
      listing.imageUrl = result.value.enrichment.imageUrl;
      listing.description = result.value.enrichment.description;
    }

    if (mergedById.size > 0) {
      const merged = [...mergedById.values()];
      cache = merged;
      lastCollectedAtMs = now;
      writeCacheToDisk(merged);
    }
    // لا نتائج على الإطلاق في هذه الدورة (كل المصادر فشلت أو لا اتصال) → نحتفظ بالكاش القديم كما هو، بلا أي فراغ مفاجئ.
  } catch {
    // أي خطأ غير متوقَّع في الدورة بأكملها يُبتلَع صامتًا — لا يؤثر على المنصة ولا على الكاش الحالي.
  } finally {
    collectionInFlight = false;
  }
}

/** يبدأ المُجمِّع الخلفي مرة واحدة فقط لكل عملية تشغيل للخادم — استدعاء متكرر آمن (idempotent). */
export function ensureBackgroundCollectorStarted(): void {
  if (backgroundStarted) return;
  backgroundStarted = true;

  cache = readCacheFromDisk();

  void runCollectionCycle();
  setInterval(() => {
    void runCollectionCycle();
  }, PROPERTY_REFRESH_INTERVAL_MS);
}

function matchesFilters(item: PropertyListing, filters: PropertyFilters): boolean {
  if (filters.dealType && item.dealType !== filters.dealType) return false;
  if (filters.propertyType && item.propertyType !== filters.propertyType) return false;
  if (filters.region && !item.region.toLowerCase().includes(filters.region.toLowerCase())) return false;
  if (filters.priceMin !== undefined && (item.price === null || item.price < filters.priceMin)) return false;
  if (filters.priceMax !== undefined && (item.price === null || item.price > filters.priceMax)) return false;
  if (filters.areaMin !== undefined && (item.areaSqm === null || item.areaSqm < filters.areaMin)) return false;
  if (filters.areaMax !== undefined && (item.areaSqm === null || item.areaSqm > filters.areaMax)) return false;
  if (filters.bedroomsMin !== undefined && (item.bedrooms === null || item.bedrooms < filters.bedroomsMin)) return false;
  if (filters.bathroomsMin !== undefined && (item.bathrooms === null || item.bathrooms < filters.bathroomsMin)) return false;
  if (filters.q) {
    const needle = filters.q.trim().toLowerCase();
    if (needle) {
      const haystack = `${item.title} ${item.region} ${item.description ?? ""}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
  }
  return true;
}

/**
 * تُعيد صفحة من العقارات المطابقة للفلاتر — قراءة فورية من الكاش الحالي في
 * الذاكرة فقط، بلا أي انتظار شبكي مهما كان. تُشغّل المُجمِّع الخلفي إن لم
 * يكن قد بدأ (شبكة أمان إضافية بجانب src/instrumentation.ts).
 */
export function getProperties(filters: PropertyFilters): PropertySearchResult {
  ensureBackgroundCollectorStarted();

  const matched = cache.filter((item) => matchesFilters(item, filters));
  const total = matched.length;
  const totalPages = Math.max(1, Math.ceil(total / PROPERTY_PAGE_SIZE));
  const page = Math.min(Math.max(1, filters.page), totalPages);
  const start = (page - 1) * PROPERTY_PAGE_SIZE;
  const items = matched.slice(start, start + PROPERTY_PAGE_SIZE);

  return {
    items,
    total,
    page,
    pageSize: PROPERTY_PAGE_SIZE,
    totalPages,
    lastCollectedLabel: lastCollectedAtMs ? formatUpdatedLabel(lastCollectedAtMs) : null,
  };
}

/**
 * تُعيد عقارًا واحدًا لصفحة تفاصيله. يقبل المعرّف الكامل (source::externalId)
 * أو externalId فقط (كما يظهر في رابط الصفحة) — لا تنتظر شبكة، تقرأ الكاش الحالي فقط.
 */
export function getPropertyById(id: string): PropertyListing | null {
  ensureBackgroundCollectorStarted();
  return cache.find((item) => item.id === id || item.id.endsWith(`::${id}`)) ?? null;
}
