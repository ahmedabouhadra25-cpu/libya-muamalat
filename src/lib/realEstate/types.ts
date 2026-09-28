/**
 * أنواع نظام العقارات — معزولة كليًا عن src/lib/news/* وطبقة src/lib/ai/*
 * (لا استيراد في أي اتجاه)، تمامًا كما هي معزولة عن بيانات المعاملات
 * الحكومية (src/lib/demo-transactions.ts).
 */

export type PropertyDealType = "sale" | "rent";

export type PropertyType =
  | "apartment"
  | "villa"
  | "house"
  | "land"
  | "shop"
  | "office"
  | "building"
  | "investment"
  | "other";

export interface PropertyListing {
  /** معرّف فريد: source::externalId (externalId = آخر جزء من رابط الإعلان الأصلي). */
  id: string;
  title: string;
  propertyType: PropertyType;
  dealType: PropertyDealType;
  /** النص الكامل كما ورد من المصدر، مثل "Al Nofleen (Tripoli)". */
  region: string;
  /** المدينة المستخرجة من region — يُستبعَد أي عقار لا تُحدَّد مدينته بثقة كطرابلس. */
  city: string;
  /** بالدينار الليبي — null إن تعذّر تحليل السعر من نص المصدر (لا يُخترَع رقم). */
  price: number | null;
  /** بالمتر المربع — null إن لم تتوفر. */
  areaSqm: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  /** رابط صورة حقيقي من صفحة الإعلان (og:image) — null إن تعذّر جلبه. لا صورة مُختلَقة أبدًا. */
  imageUrl: string | null;
  /** وصف مختصر حقيقي من meta description لصفحة الإعلان — null إن تعذّر جلبه. */
  description: string | null;
  source: string;
  /** رابط صفحة الإعلان الأصلي — "زيارة الإعلان الأصلي" يشير هنا دائمًا. */
  sourceUrl: string;
  /** آخر لحظة أكّد فيها المُجمِّع أن هذا الإعلان لا يزال ظاهرًا في المصدر. */
  lastSeenAtMs: number;
  lastUpdatedLabel: string | null;
}

export interface PropertyFilters {
  q?: string;
  dealType?: PropertyDealType;
  propertyType?: PropertyType;
  region?: string;
  priceMin?: number;
  priceMax?: number;
  areaMin?: number;
  areaMax?: number;
  bedroomsMin?: number;
  bathroomsMin?: number;
  page: number;
}

export interface PropertySearchResult {
  items: PropertyListing[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  /** نص عربي جاهز يوضح آخر مرة نجح فيها تحديث الكاش من المصادر الخارجية. */
  lastCollectedLabel: string | null;
}
