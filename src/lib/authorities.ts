import type { Authority } from "@/types/authority";

/**
 * الجهات الحكومية المرتبطة بالمعاملات. كل جهة تشير إلى مصدرها الرسمي في
 * src/lib/sources.ts عبر sourceId.
 */
export const authorities: Authority[] = [
  {
    id: "passport-authority",
    name: "مصلحة الجوازات والجنسية وشؤون الأجانب",
    parentAuthority: "وزارة الداخلية",
    authorityType: "government_authority",
    sourceId: "passport-authority-ly",
    website: "https://lpa.gov.ly/",
    description:
      "الجهة الحكومية التابعة لوزارة الداخلية المختصة بالجوازات والجنسية وشؤون الأجانب.",
  },
  {
    id: "commercial-registry-authority",
    name: "مصلحة السجل التجاري",
    // الموقع الرسمي يذكر "مصلحة السجل التجاري - وزارة الاقتصاد" فقط (بدون "والتجارة").
    parentAuthority: "وزارة الاقتصاد",
    authorityType: "government_authority",
    sourceId: "commercial-registry-ly",
    website: "https://www.cca.gov.ly/ar",
    description:
      "الجهة الرسمية التابعة لوزارة الاقتصاد المختصة بتنظيم وقيد السجل التجاري والنشاط التجاري في ليبيا.",
  },
  {
    id: "civil-status-department",
    name: "مصلحة الأحوال المدنية",
    // لا يوجد موقع رسمي مركزي واحد لهذه المصلحة (تحقّقنا بالبحث)؛ الخدمة
    // تُنفَّذ عمليًا عبر مكاتب الأحوال المدنية/السجل المدني التابعة للبلديات.
    // الأساس القانوني: القانون رقم 44 لسنة 1971 بشأن نظام كتيب العائلة، الذي
    // يشير إلى "مكتب السجل المدني" كجهة الإصدار (المادة 9، عبر وزارة العدل).
    parentAuthority: null,
    authorityType: "government_authority",
    sourceId: "csc-ly",
    website: "https://csc.gov.ly/",
    description:
      "الجهة المسؤولة عن سجلات الأحوال المدنية وكتيبات العائلة، وتُنفَّذ خدماتها عمليًا عبر مكاتب الأحوال المدنية/السجل المدني التابعة لكل بلدية.",
  },
];
