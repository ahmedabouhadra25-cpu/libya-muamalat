import type { Branch } from "@/types/branch";

const LPA_BRANCHES_SOURCE_URL = "https://lpa.gov.ly/en/branches";

/**
 * الفروع الظاهرة فعليًا في صفحة الفروع الرسمية لمصلحة الجوازات
 * (raw HTML تمت مراجعته يدويًا بتاريخ 2026-09-23). لم تُضَف أي فروع أخرى
 * غير موجودة في المصدر، ولم يُخترع أي عنوان أو رقم هاتف غير مذكور هناك.
 */
export const branches: Branch[] = [
  {
    id: "lpa-abu-salim",
    authorityId: "passport-authority",
    name: "جوازات ابوسليم",
    city: "طرابلس",
    area: "ابوسليم",
    address: "جوازات بوسليم, طريق أبوسليم, أبوسليم, حي الانتصار, أبو سليم, طرابلس, ليبيا",
    phone: null,
    sourceUrl: LPA_BRANCHES_SOURCE_URL,
    isActive: true,
    lastVerifiedAt: "2026-09-23",
  },
  {
    id: "lpa-al-sarraj",
    authorityId: "passport-authority",
    name: "جوازات السراج",
    city: "طرابلس",
    area: "السراج",
    address: "جوازات السراج, الطريق الدائري الثاني, حي الوحدة, حي القادسية, طرابلس, الجفارة, ليبيا",
    phone: null,
    sourceUrl: LPA_BRANCHES_SOURCE_URL,
    isActive: true,
    lastVerifiedAt: "2026-09-23",
  },
  {
    id: "lpa-al-naft",
    authorityId: "passport-authority",
    name: "جوازات النفط",
    city: "طرابلس",
    area: "شارع الزاوية",
    address: "مكتب جوازات النفط, شارع الجمهورية, سيدي خليفة, باب عكارة, طرابلس, ليبيا",
    phone: null,
    sourceUrl: LPA_BRANCHES_SOURCE_URL,
    isActive: true,
    lastVerifiedAt: "2026-09-23",
  },
  {
    id: "lpa-ain-zara",
    authorityId: "passport-authority",
    name: "جوازات عين زارة",
    city: "طرابلس",
    area: "عين زارة",
    address: "مكتب جوازات عين زارة, طريق عين زارة, حي العين, الكحيلي, طرابلس, ليبيا",
    phone: null,
    sourceUrl: LPA_BRANCHES_SOURCE_URL,
    isActive: true,
    lastVerifiedAt: "2026-09-23",
  },
  {
    id: "lpa-hq-tripoli",
    authorityId: "passport-authority",
    name: "الإدارة العامة — طرابلس",
    city: "طرابلس",
    area: "صلاح الدين",
    address: "طرابلس — صلاح الدين، بجانب كلية ضباط الشرطة",
    phone: "+218 21 194 6279",
    sourceUrl: LPA_BRANCHES_SOURCE_URL,
    isActive: true,
    lastVerifiedAt: "2026-09-23",
  },
];
