export interface Branch {
  id: string;
  /** يشير إلى Authority.id في src/lib/authorities.ts. */
  authorityId: string;
  name: string;
  city: string;
  area?: string | null;
  address?: string | null;
  phone?: string | null;
  /** رابط صفحة المصدر الرسمي التي تحتوي بيانات هذا الفرع. */
  sourceUrl: string;
  isActive: boolean;
  lastVerifiedAt?: string | null;
}
