export type VerificationStatus =
  | "demo"
  | "verified"
  | "needs_review"
  | "outdated"
  | "conflict";

export interface TransactionStep {
  title: string;
  description?: string | null;
}

export interface RequiredDocument {
  name: string;
  notes?: string | null;
}

export interface TransactionFees {
  amount?: string | null;
  notes?: string | null;
}

export interface TransactionSourceRef {
  /** يشير إلى OfficialSource.id في src/lib/sources.ts. */
  sourceId: string;
  /** رابط الصفحة الرسمية المحددة التي يغطيها هذا المصدر تحديدًا. */
  url: string;
  /** ما الذي يثبته هذا المصدر تحديدًا، مثل "الإجراء والجهة" أو "المستندات والرسوم". */
  role: string;
}

export interface Transaction {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  category: string;
  keywords: string[];
  authority?: string | null;
  /** المدينة/المنطقة التي تخصها تفاصيل هذه المعاملة حاليًا (مثل "طرابلس")، عند وجود نطاق محدد. غير إلزامي. */
  serviceArea?: string | null;
  steps: TransactionStep[];
  requiredDocuments: RequiredDocument[];
  fees?: TransactionFees | null;
  duration?: string | null;
  conditions: string[];
  warnings: string[];
  /** يشير إلى OfficialSource.id في src/lib/sources.ts — المصدر الذي أخذنا منه المعلومة. غير إلزامي. */
  sourceId?: string | null;
  /** يشير إلى Authority.id في src/lib/authorities.ts — الجهة الحكومية المسؤولة عن المعاملة. غير إلزامي. */
  authorityId?: string | null;
  /** رابط الصفحة الرسمية المحددة التي استُقيت منها معلومات هذه المعاملة (مثل صفحة FAQ)، بدل الاكتفاء بالرابط العام للمصدر. */
  sourceUrl?: string | null;
  /**
   * مصادر متعددة عند الحاجة، كل مصدر بدوره المحدد (مثل: الإجراء والجهة مقابل
   * المستندات والرسوم). عند وجود هذا الحقل تُفضَّله الواجهة على sourceId/sourceUrl
   * أعلاه لعرض المصادر، لكن الحقلين القديمين يبقيان دون حذف لتوافق المعاملات
   * التي لا تزال تعتمد على مصدر واحد فقط.
   */
  sources?: TransactionSourceRef[];
  lastVerifiedAt?: string | null;
  verificationStatus: VerificationStatus;
}
