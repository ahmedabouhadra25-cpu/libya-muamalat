export type NewsCategory = "economic" | "oil" | "general";

/** عنصر خبر واحد جاهز للعرض — نص خالص فقط، لا HTML، لا صور. */
export interface NewsItem {
  /** معرّف فريد: source+link، أو source+title+publishedAtMs عند غياب رابط صالح. */
  id: string;
  title: string;
  source: string;
  link: string;
  category: NewsCategory;
  /** true فقط لأحدث خبر في القائمة الحالية بالكامل (يُحسَب دائمًا، لا يأتي من المصدر). */
  isBreaking: boolean;
  /** true إذا ذُكرت "طرابلس"/"Tripoli" في العنوان — علم إضافي مستقل عن category، لا يستبدله. */
  isTripoli: boolean;
  /** نص تاريخ/وقت جاهز للعرض بالعربية، أو null إن تعذّر تحديده. */
  publishedLabel: string | null;
  /** طابع زمني بالميلي ثانية للفرز والأولوية للأحدث، أو null إن تعذّر تحديده. */
  publishedAtMs: number | null;
}

export type ExchangeRateType = "official" | "parallel";

/**
 * سعر صرف عملة واحد. value يبقى null إن لم يتوفّر مصدر موثوق مُتحقَّق منه —
 * لا يُخترَع رقم بديل أبدًا (انظر src/lib/news/exchangeRates.ts).
 */
export interface ExchangeRate {
  currency: string;
  rateType: ExchangeRateType;
  value: number | null;
  source: string;
  lastUpdatedLabel: string | null;
}
