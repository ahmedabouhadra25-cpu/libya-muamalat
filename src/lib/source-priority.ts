import type { AuthorityLevel, OfficialSource, SourceType } from "@/types/source";

/**
 * ترتيب أولوية المصادر عند تعدد المراجع لنفس المعلومة — الأدنى رقمًا هو الأعلى موثوقية.
 * قابل لإعادة الاستخدام لاحقًا في نظام AI/RAG لترجيح المصادر.
 */
export const AUTHORITY_LEVEL_LABELS: Record<AuthorityLevel, string> = {
  1: "مصدر رسمي أصلي",
  2: "بوابة حكومية رسمية",
  3: "أرشيف / مصدر قانوني ثانوي موثوق",
  4: "مصدر اكتشاف فقط",
};

export const SOURCE_PRIORITY_ORDER: AuthorityLevel[] = [1, 2, 3, 4];

export const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  official_gazette: "الجريدة الرسمية",
  ministry: "وزارة",
  government_authority: "جهة حكومية رسمية",
  regulator: "جهة تنظيمية / رقابية رسمية",
  government_portal: "بوابة حكومية رسمية",
  legal_archive: "أرشيف قانوني ثانوي",
  other: "مصدر آخر",
};

/** يصف طبيعة المصدر بدقة دون الادعاء بأنه رسمي إلا إذا كان كذلك فعلًا. */
export function getSourceKindLabel(
  source: Pick<OfficialSource, "authorityLevel" | "sourceType">
): string {
  if (source.authorityLevel === 1 || source.authorityLevel === 2) {
    return "مصدر رسمي";
  }
  if (source.sourceType === "legal_archive") {
    return "أرشيف قانوني ثانوي";
  }
  return "مصدر اكتشاف غير رسمي";
}
