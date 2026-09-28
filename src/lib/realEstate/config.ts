/**
 * لوحة إعدادات نظام العقارات — كل ما يمكن تعديله مستقبلًا موجود هنا فقط.
 * معزولة كليًا عن src/lib/news/config.ts (لا قيمة مشتركة، لا استيراد متبادل)
 * كما طُلب صراحةً.
 */

/** كل كم يُحاول المُجمِّع الخلفي (Background Collector) تحديث العقارات من المصادر الخارجية. */
export const PROPERTY_REFRESH_INTERVAL_MS = 15 * 60 * 1000;

/** عدد صفحات نتائج كل مصدر يجلبها المُجمِّع في كل دورة (كل صفحة ≈ 20 إعلانًا خامًا قبل تصفية طرابلس). */
export const PROPERTY_PAGES_PER_SOURCE = 4;

/** أقصى وقت انتظار لطلب صفحة واحدة قبل اعتبارها فاشلة (ميلي ثانية). */
export const PROPERTY_FETCH_TIMEOUT_MS = 8000;

/** أقصى عدد صفحات "تفاصيل إعلان" يُثرّيها المُجمِّع بالصور/الوصف في نفس الدورة (تحكّم في الحمل). */
export const PROPERTY_MAX_DETAIL_ENRICHMENTS_PER_CYCLE = 40;

/** عدد العقارات المعروضة في صفحة ملف "عقارات" الواحدة. */
export const PROPERTY_PAGE_SIZE = 20;

/** المدينة الوحيدة المعروضة حاليًا — عقارات طرابلس فقط، أي مدينة أخرى تُستبعَد أثناء الجمع. */
export const PROPERTY_CITY_FILTER = "Tripoli";

/**
 * مصادر العقارات — تحقّقت من كل رابط هنا مباشرة (curl حقيقي أعاد صفحة HTML
 * مُصيَّرة من الخادم Server-Side Rendered تحتوي بيانات إعلانات حقيقية، بلا
 * أي حاجة لتجاوز Cloudflare أو CAPTCHA — robots.txt الخاص بالمصدر يسمح
 * بفهرسة صفحات الإعلانات صراحةً). لإضافة/إزالة/تغيير أي مصدر، عدّل هذه
 * القائمة فقط.
 */
export const PROPERTY_SOURCES = [
  {
    name: "bahu.ly",
    dealType: "sale" as const,
    listUrl: "https://bahu.ly/en/offers/buy/properties-for-sale",
  },
  {
    name: "bahu.ly",
    dealType: "rent" as const,
    listUrl: "https://bahu.ly/en/offers/rent/properties-for-rent",
  },
  {
    name: "bahu.ly",
    dealType: "rent" as const,
    listUrl: "https://bahu.ly/en/offers/commercial-rent/commercial-for-rent",
  },
] as const;
