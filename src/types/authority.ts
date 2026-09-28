export type AuthorityType =
  | "ministry"
  | "government_authority"
  | "regulator"
  | "municipality"
  | "other";

export interface Authority {
  id: string;
  name: string;
  /** اسم الجهة الأعلى (مثل الوزارة التابعة لها)، نص وصفي وليس مرجعًا لسجل آخر. */
  parentAuthority?: string | null;
  authorityType: AuthorityType;
  /** يشير إلى OfficialSource.id في src/lib/sources.ts. */
  sourceId: string;
  website?: string | null;
  description?: string | null;
}
