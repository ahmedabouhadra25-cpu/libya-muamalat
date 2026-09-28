export type FormFileType = "pdf" | "html" | "other";

/**
 * حالة توثيق النموذج نفسه — مجموعة مستقلة عن VerificationStatus الخاصة
 * بالمعاملات، لأن حالة "وجود ملف يمكن الوصول إليه" مفهوم أضيق ومختلف:
 * - verified: تم فتح الرابط والتأكد أنه ملف رسمي متاح فعليًا.
 * - needs_review: الرابط موجود لكن الملف غير قابل للوصول أو غير مؤكد.
 * - unavailable: تم التحقق من الصفحة الرسمية ولا يوجد بها نموذج حاليًا.
 */
export type FormVerificationStatus = "verified" | "needs_review" | "unavailable";

export interface OfficialForm {
  id: string;
  name: string;
  description?: string | null;
  /** يشير إلى Authority.id في src/lib/authorities.ts. */
  authorityId: string;
  /** المعاملات (Transaction.slug) التي يُستخدم فيها هذا النموذج. */
  transactionSlugs: string[];
  /** الصفحة الرسمية التي وُجد فيها رابط النموذج. */
  sourcePageUrl: string;
  /** رابط تحميل الملف المباشر (PDF غالبًا). null إذا وُجد رابط الصفحة لكن الملف نفسه غير متاح. */
  downloadUrl?: string | null;
  fileType: FormFileType;
  verificationStatus: FormVerificationStatus;
  lastVerifiedAt?: string | null;
  notes?: string | null;
}
