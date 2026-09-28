import {
  NEWS_FETCH_TIMEOUT_MS,
  NEWS_MAX_ITEMS,
  NEWS_REFRESH_INTERVAL_MS,
  NEWS_SOURCES,
} from "@/lib/news/config";
import type { NewsCategory, NewsItem } from "@/lib/news/types";

/**
 * جلب وتحليل ودمج الأخبار من عدة مصادر ليبية — server-side فقط، معزول
 * تمامًا عن بقية المشروع (لا يستورد ولا يُستورَد من src/lib/ai/* أو أي بيانات
 * معاملات). لا مكتبة XML جديدة: تحليل نصي محافظ بـregex فقط، مع تنظيف صريح
 * (إزالة أي وسم HTML، فكّ الكيانات المعروفة فقط، والتحقق من صلاحية كل رابط)
 * — لا innerHTML، ولا تنفيذ لأي محتوى قادم من مصدر خارجي بأي شكل.
 *
 * قائمة "رولينج" مستمرة (حتى NEWS_MAX_ITEMS): تُدمَج الأخبار الجديدة فيها،
 * تُستبعَد التكرارات (بمعرّف source+link، أو source+title+publishedAtMs عند
 * غياب رابط صالح)، والأقدم يخرج تلقائيًا عند تجاوز الحد. عدم وصول أخبار
 * جديدة في محاولة تحديث لا يُفرِّغ القائمة أبدًا — تبقى كما هي.
 */

let rollingItems: NewsItem[] = [];
let backgroundStarted = false;
let refreshInFlightPromise: Promise<void> | null = null;

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

function sanitizeText(raw: string): string {
  const withoutCdata = raw.replace(/^\s*<!\[CDATA\[/, "").replace(/\]\]>\s*$/, "");
  const withoutTags = withoutCdata.replace(/<[^>]*>/g, "");
  return decodeEntities(withoutTags).trim();
}

function extractTag(itemXml: string, tag: string): string | null {
  const match = itemXml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i"));
  return match ? match[1] : null;
}

function extractAllTags(itemXml: string, tag: string): string[] {
  const matches = itemXml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "gi")) ?? [];
  return matches.map((m) => sanitizeText(extractTag(m, tag) ?? ""));
}

/** يقبل فقط روابط http/https مطلقة — يرفض أي شيء آخر (مثل javascript:) صراحةً. */
function sanitizeLink(raw: string): string | null {
  const trimmed = decodeEntities(raw).trim();
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function formatPublishedLabel(date: Date | null): string | null {
  if (!date) return null;
  try {
    return new Intl.DateTimeFormat("ar-LY", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  } catch {
    return null;
  }
}

const ECONOMIC_KEYWORDS = [
  "اقتصاد",
  "مصرف",
  "دينار",
  "استثمار",
  "تجارة",
  "بنك",
  "مالي",
  "موازنة",
  "عملة",
  "سعر الصرف",
  "بورصة",
  "economy",
  "economic",
  "bank",
  "dinar",
  "investment",
  "trade",
];

const OIL_KEYWORDS = ["نفط", "طاقة", "غاز", "برميل", "حقل", "مصفاة", "الوطنية للنفط", "أوبك", "oil", "energy", "electricity"];

const TRIPOLI_KEYWORDS = ["طرابلس", "tripoli"];

function classifyCategory(title: string, rssCategories: string[]): NewsCategory {
  const haystack = [title, ...rssCategories].join(" ").toLowerCase();
  if (OIL_KEYWORDS.some((k) => haystack.includes(k))) return "oil";
  if (ECONOMIC_KEYWORDS.some((k) => haystack.includes(k))) return "economic";
  return "general";
}

function detectTripoli(title: string, rssCategories: string[]): boolean {
  const haystack = [title, ...rssCategories].join(" ").toLowerCase();
  return TRIPOLI_KEYWORDS.some((k) => haystack.includes(k));
}

function makeItemId(sourceName: string, link: string | null, title: string, publishedAtMs: number | null): string {
  if (link) return `${sourceName}::${link}`;
  return `${sourceName}::${title}::${publishedAtMs ?? ""}`;
}

function parseItemsFromFeed(xml: string, sourceName: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemMatches = xml.match(/<item(?:\s[^>]*)?>[\s\S]*?<\/item>/gi) ?? [];

  for (const itemXml of itemMatches) {
    const rawTitle = extractTag(itemXml, "title");
    const rawLink = extractTag(itemXml, "link");
    const rawPubDate = extractTag(itemXml, "pubDate");
    const rssCategories = extractAllTags(itemXml, "category");

    if (!rawTitle) continue;

    const title = sanitizeText(rawTitle);
    const link = rawLink ? sanitizeLink(rawLink) : null;
    if (!title || !link) continue;

    const parsedDate = rawPubDate ? new Date(rawPubDate) : null;
    const publishedAtMs = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.getTime() : null;

    items.push({
      id: makeItemId(sourceName, link, title, publishedAtMs),
      title,
      source: sourceName,
      link,
      category: classifyCategory(title, rssCategories),
      isBreaking: false,
      isTripoli: detectTripoli(title, rssCategories),
      publishedLabel: formatPublishedLabel(publishedAtMs ? new Date(publishedAtMs) : null),
      publishedAtMs,
    });
  }

  return items;
}

async function fetchOneSource(source: { name: string; feedUrl: string }): Promise<NewsItem[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), NEWS_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(source.feedUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LibyaMuamalatNewsTicker/1.0)" },
    });
    if (!response.ok) throw new Error(`استجابة غير صالحة من ${source.name}: ${response.status}`);
    const xml = await response.text();
    return parseItemsFromFeed(xml, source.name);
  } finally {
    clearTimeout(timeout);
  }
}

/** يدمج أخبارًا جديدة داخل القائمة الرولينج: يستبعد التكرار، يرتّب بالأحدث أولًا، يقصّ للحد الأقصى. */
function mergeIntoRolling(newItems: NewsItem[]): void {
  if (newItems.length === 0) return;

  const existingIds = new Set(rollingItems.map((item) => item.id));
  const merged = [...rollingItems];

  for (const item of newItems) {
    if (existingIds.has(item.id)) continue;
    existingIds.add(item.id);
    merged.push(item);
  }

  merged.sort((a, b) => (b.publishedAtMs ?? 0) - (a.publishedAtMs ?? 0));
  const trimmed = merged.slice(0, NEWS_MAX_ITEMS);

  rollingItems = trimmed.map((item, index) => ({ ...item, isBreaking: index === 0 }));
}

/**
 * دورة تحديث واحدة: كل مصدر فاشل لا يُسقط الباقي (Promise.allSettled)، ولا
 * تتزاحم دورتان في نفس اللحظة لهذه النسخة — أي استدعاء يصل أثناء دورة قائمة
 * يحصل على نفس الـPromise الجارية بدل بدء دورة جديدة، حتى تنتظر كل الطلبات
 * المتزامنة (مثل طلبين وصلا معًا على نسخة Serverless بلا أخبار في الذاكرة)
 * نتيجة الدورة الحقيقية نفسها بدل أن يُرجع أحدهما نتيجة فارغة قبل اكتمالها.
 */
function runRefreshCycle(): Promise<void> {
  if (refreshInFlightPromise) return refreshInFlightPromise;

  refreshInFlightPromise = (async () => {
    try {
      const results = await Promise.allSettled(NEWS_SOURCES.map((source) => fetchOneSource(source)));
      const newItems = results.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
      mergeIntoRolling(newItems);
    } catch {
      // أي خطأ غير متوقَّع في الدورة بأكملها يُبتلَع صامتًا — لا يؤثر على المنصة ولا على الكاش الحالي.
    } finally {
      refreshInFlightPromise = null;
    }
  })();

  return refreshInFlightPromise;
}

/**
 * يبدأ جالب الأخبار الخلفي (Background Fetcher) مرة واحدة فقط لكل تشغيل
 * للخادم — استدعاء متكرر آمن (idempotent). دورات التحديث الدورية بعدها
 * (setInterval) تعمل بمعزل تام عن أي طلب مستخدم فور توفر أخبار في الذاكرة؛
 * فقط أول طلب على ذاكرة فارغة تمامًا ينتظر دورة واحدة فعليًا — انظر getLibyaNews.
 */
export function ensureNewsBackgroundStarted(): void {
  if (backgroundStarted) return;
  backgroundStarted = true;

  void runRefreshCycle();
  setInterval(() => {
    void runRefreshCycle();
  }, NEWS_REFRESH_INTERVAL_MS);
}

/**
 * تُعيد القائمة الرولينج الحالية. إن كانت الذاكرة تحتوي أخبارًا فعلًا (النسخة
 * "دافئة" ولو من دورة خلفية سابقة) تُعاد فورًا بلا أي انتظار شبكي، كما كانت
 * دائمًا. فقط حين تكون الذاكرة فارغة تمامًا (أول طلب على نسخة جديدة، أو نسخة
 * Serverless معزولة لم تُنهِ أي دورة خلفية بعد — هذا هو سبب ظهور القائمة
 * فارغة على النشر الحقيقي كما وُثِّق في التشخيص) تنتظر دورة تحديث حقيقية
 * واحدة (بنفس مهلة NEWS_FETCH_TIMEOUT_MS الحالية) قبل الإعادة، بدل إرجاع
 * مصفوفة فارغة فورًا. لا تُخترَع أي بيانات: إذا فشلت كل المصادر في هذه
 * الدورة أيضًا، تبقى النتيجة فارغة بصدق (يُترجمها route.ts إلى حالة "غير
 * متاحة" واضحة، لا محاولة تمويه).
 */
export async function getLibyaNews(): Promise<NewsItem[]> {
  ensureNewsBackgroundStarted();
  if (rollingItems.length === 0) {
    await runRefreshCycle();
  }
  return rollingItems;
}
