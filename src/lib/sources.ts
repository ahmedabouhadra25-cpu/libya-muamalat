import type { OfficialSource } from "@/types/source";

/**
 * مصادر رسمية مؤكدة الروابط فقط. لم تُضَف أي جهة لم يكن رابطها الرسمي مؤكدًا
 * (مثل هيئة شؤون الحج والعمرة، أو جهة السجل التجاري) تجنبًا لتخمين أي URL.
 */
export const officialSources: OfficialSource[] = [
  {
    id: "gazette-ly",
    name: "الجريدة الرسمية الليبية",
    url: "https://gazette.ly/ar",
    sourceType: "official_gazette",
    authorityName: "الجريدة الرسمية الليبية",
    authorityLevel: 1,
    description:
      "المصدر الأساسي للبحث عن القوانين واللوائح والقرارات المنشورة في الجريدة الرسمية.",
    isActive: true,
    lastCheckedAt: null,
  },
  {
    id: "tax-authority-ly",
    name: "مصلحة الضرائب الليبية",
    url: "https://tax.gov.ly/",
    sourceType: "government_authority",
    authorityName: "مصلحة الضرائب الليبية",
    authorityLevel: 1,
    description:
      "المصدر الرسمي للمعلومات والخدمات والتشريعات المتعلقة بالضرائب.",
    isActive: true,
    lastCheckedAt: null,
  },
  {
    id: "central-bank-ly",
    name: "مصرف ليبيا المركزي",
    url: "https://cbl.gov.ly/",
    sourceType: "regulator",
    authorityName: "مصرف ليبيا المركزي",
    authorityLevel: 1,
    description:
      "المصدر الرسمي للمعلومات والتشريعات والتعليمات المتعلقة باختصاصات مصرف ليبيا المركزي.",
    isActive: true,
    lastCheckedAt: null,
  },
  {
    id: "ministry-of-finance-ly",
    name: "وزارة المالية",
    url: "https://www.mof.gov.ly/",
    sourceType: "ministry",
    authorityName: "وزارة المالية",
    authorityLevel: 1,
    description:
      "المصدر الرسمي لوزارة المالية وما تنشره من تشريعات وقرارات ومعلومات.",
    isActive: true,
    lastCheckedAt: null,
  },
  {
    id: "passport-authority-ly",
    name: "مصلحة الجوازات والجنسية وشؤون الأجانب",
    url: "https://lpa.gov.ly/",
    sourceType: "government_authority",
    authorityName: "مصلحة الجوازات والجنسية وشؤون الأجانب",
    authorityLevel: 1,
    description:
      "الجهة الحكومية التابعة لوزارة الداخلية المختصة بالجوازات والجنسية وشؤون الأجانب.",
    isActive: true,
    lastCheckedAt: "2026-09-23",
  },
  {
    id: "commercial-registry-ly",
    name: "مصلحة السجل التجاري",
    url: "https://www.cca.gov.ly/ar",
    sourceType: "government_authority",
    authorityName: "مصلحة السجل التجاري",
    authorityLevel: 1,
    description:
      "الجهة الرسمية التابعة لوزارة الاقتصاد المختصة بتنظيم وقيد السجل التجاري والنشاط التجاري في ليبيا.",
    isActive: true,
    lastCheckedAt: "2026-09-23",
  },
  {
    id: "csc-ly",
    name: "مركز خدمة المواطن",
    url: "https://csc.gov.ly/",
    sourceType: "government_portal",
    authorityName: "مركز خدمة المواطن",
    authorityLevel: 2,
    description:
      "بوابة حكومية وطنية تنشر إجراءات ومستندات الخدمات الحكومية المختلفة، بما فيها خدمات الأحوال المدنية.",
    isActive: true,
    lastCheckedAt: "2026-09-23",
  },
  {
    id: "tajoura-municipality-ly",
    name: "بلدية تاجوراء",
    url: "https://tajoura.gov.ly/",
    sourceType: "government_authority",
    authorityName: "بلدية تاجوراء",
    authorityLevel: 1,
    description:
      "الموقع الرسمي لبلدية تاجوراء، وينشر صفحات خدمات تفصيلية تشمل إجراءات الأحوال المدنية.",
    isActive: true,
    lastCheckedAt: "2026-09-23",
  },
  {
    id: "zliten-municipality-ly",
    name: "بلدية زليتن",
    url: "https://zliten.gov.ly/",
    sourceType: "government_authority",
    authorityName: "بلدية زليتن",
    authorityLevel: 1,
    description:
      "الموقع الرسمي لبلدية زليتن، وينشر صفحات خدمات تفصيلية تشمل إجراءات الأحوال المدنية.",
    isActive: true,
    lastCheckedAt: "2026-09-23",
  },
  {
    id: "ministry-of-justice-ly",
    name: "وزارة العدل",
    url: "https://aladel.gov.ly/",
    sourceType: "ministry",
    authorityName: "وزارة العدل",
    authorityLevel: 1,
    description:
      "المصدر الرسمي لوزارة العدل، وينشر تشريعات وتوضيحات قانونية بما فيها ما يخص نظام كتيب العائلة.",
    isActive: true,
    lastCheckedAt: "2026-09-23",
  },
  {
    id: "ejraat-ly",
    name: "بوابة ليبيا للإجراءات الإدارية",
    url: "https://ejraat.gov.ly/",
    sourceType: "government_portal",
    authorityName: "بوابة ليبيا للإجراءات الإدارية",
    authorityLevel: 2,
    description:
      "بوابة حكومية رسمية توثّق الإجراءات الإدارية الرسمية والجهات والمكاتب المختصة بها.",
    isActive: true,
    lastCheckedAt: "2026-09-23",
  },
];

/**
 * مصادر ثانوية مساعدة فقط — لا تُعامَل كمصدر رسمي، ولا تُستخدم وحدها كمرجع
 * نهائي عند توفر مصدر رسمي مقابل لها.
 */
export const secondarySources: OfficialSource[] = [
  {
    id: "law-society-ly",
    name: "المجمع القانوني",
    url: "https://lawsociety.ly/",
    sourceType: "legal_archive",
    authorityName: null,
    authorityLevel: 3,
    description:
      "أرشيف قانوني مساعد للبحث، ولا يُستخدم وحده كمرجع نهائي عند توفر المصدر الرسمي.",
    isActive: true,
    lastCheckedAt: null,
  },
];

export const allSources: OfficialSource[] = [...officialSources, ...secondarySources];
