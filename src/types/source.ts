export type SourceType =
  | "official_gazette"
  | "ministry"
  | "government_authority"
  | "regulator"
  | "government_portal"
  | "legal_archive"
  | "other";

/**
 * 1 = مصدر رسمي أصلي
 * 2 = بوابة حكومية رسمية
 * 3 = أرشيف / مصدر قانوني ثانوي موثوق
 * 4 = مصدر اكتشاف فقط
 */
export type AuthorityLevel = 1 | 2 | 3 | 4;

export interface OfficialSource {
  id: string;
  name: string;
  url: string;
  sourceType: SourceType;
  /** اسم الجهة الحكومية الرسمية المسؤولة عن هذا المصدر، أو null إن لم يكن المصدر جهة حكومية بذاته. */
  authorityName: string | null;
  authorityLevel: AuthorityLevel;
  description: string;
  isActive: boolean;
  lastCheckedAt: string | null;
}
