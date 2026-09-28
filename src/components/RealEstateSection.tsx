import Link from "next/link";
import { getProperties } from "@/lib/realEstate/collector";
import type { PropertyDealType, PropertyFilters, PropertyType } from "@/lib/realEstate/types";
import { PropertyCard } from "@/components/PropertyCard";

const PROPERTY_TYPE_OPTIONS: { id: PropertyType; label: string }[] = [
  { id: "apartment", label: "شقق" },
  { id: "villa", label: "فلل" },
  { id: "house", label: "منازل" },
  { id: "land", label: "أراضي" },
  { id: "shop", label: "محلات" },
  { id: "office", label: "مكاتب" },
  { id: "building", label: "مباني" },
  { id: "investment", label: "عقارات استثمارية" },
];

interface RealEstateSectionProps {
  searchParams: Record<string, string | string[] | undefined>;
}

function str(searchParams: RealEstateSectionProps["searchParams"], key: string): string {
  const value = searchParams[key];
  return typeof value === "string" ? value : "";
}

function num(searchParams: RealEstateSectionProps["searchParams"], key: string): number | undefined {
  const raw = str(searchParams, key);
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

function buildFilters(searchParams: RealEstateSectionProps["searchParams"]): PropertyFilters {
  const dealTypeRaw = str(searchParams, "dealType");
  const propertyTypeRaw = str(searchParams, "propertyType");
  const page = num(searchParams, "page") ?? 1;

  return {
    q: str(searchParams, "q") || undefined,
    dealType: dealTypeRaw === "sale" || dealTypeRaw === "rent" ? (dealTypeRaw as PropertyDealType) : undefined,
    propertyType: PROPERTY_TYPE_OPTIONS.some((o) => o.id === propertyTypeRaw)
      ? (propertyTypeRaw as PropertyType)
      : undefined,
    region: str(searchParams, "region") || undefined,
    priceMin: num(searchParams, "priceMin"),
    priceMax: num(searchParams, "priceMax"),
    areaMin: num(searchParams, "areaMin"),
    areaMax: num(searchParams, "areaMax"),
    bedroomsMin: num(searchParams, "bedroomsMin"),
    bathroomsMin: num(searchParams, "bathroomsMin"),
    page: Math.max(1, Math.floor(page)),
  };
}

function pageHref(searchParams: RealEstateSectionProps["searchParams"], page: number): string {
  const params = new URLSearchParams();
  params.set("category", "real-estate");
  for (const key of [
    "q",
    "dealType",
    "propertyType",
    "region",
    "priceMin",
    "priceMax",
    "areaMin",
    "areaMax",
    "bedroomsMin",
    "bathroomsMin",
  ]) {
    const value = str(searchParams, key);
    if (value) params.set(key, value);
  }
  if (page > 1) params.set("page", String(page));
  return `/transactions?${params.toString()}`;
}

const inputClass =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600";

/**
 * قسم عقارات طرابلس — يُعرَض داخل ملف "عقارات" الموجود (src/app/transactions/page.tsx)
 * فقط عندما category=real-estate. مكوّن خادم (Server Component) بلا JavaScript
 * من جهة العميل: البحث والفلاتر عبر <form method="get"> عادي، متوافق مع
 * نمط بقية المنصة (SearchBox/فلاتر الفئات تعمل بالطريقة نفسها).
 */
export function RealEstateSection({ searchParams }: RealEstateSectionProps) {
  const filters = buildFilters(searchParams);
  const result = getProperties(filters);

  return (
    <div className="mt-6">
      <form method="get" action="/transactions" className="rounded-2xl border border-zinc-200 bg-white p-4">
        <input type="hidden" name="category" value="real-estate" />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input
            type="search"
            name="q"
            defaultValue={filters.q ?? ""}
            placeholder="ابحث عن عقار (العنوان، المنطقة...)"
            className={`${inputClass} lg:col-span-2`}
          />

          <select name="dealType" defaultValue={filters.dealType ?? ""} className={inputClass}>
            <option value="">بيع أو إيجار</option>
            <option value="sale">بيع</option>
            <option value="rent">إيجار</option>
          </select>

          <select name="propertyType" defaultValue={filters.propertyType ?? ""} className={inputClass}>
            <option value="">كل الأنواع</option>
            {PROPERTY_TYPE_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>

          <input
            type="text"
            name="region"
            defaultValue={filters.region ?? ""}
            placeholder="المنطقة (مثال: عين زارة)"
            className={inputClass}
          />

          <input
            type="number"
            name="priceMin"
            defaultValue={filters.priceMin ?? ""}
            placeholder="أقل سعر (د.ل)"
            className={inputClass}
          />
          <input
            type="number"
            name="priceMax"
            defaultValue={filters.priceMax ?? ""}
            placeholder="أعلى سعر (د.ل)"
            className={inputClass}
          />

          <input
            type="number"
            name="areaMin"
            defaultValue={filters.areaMin ?? ""}
            placeholder="أقل مساحة (م²)"
            className={inputClass}
          />
          <input
            type="number"
            name="areaMax"
            defaultValue={filters.areaMax ?? ""}
            placeholder="أعلى مساحة (م²)"
            className={inputClass}
          />

          <input
            type="number"
            name="bedroomsMin"
            defaultValue={filters.bedroomsMin ?? ""}
            placeholder="عدد الغرف (على الأقل)"
            className={inputClass}
          />
          <input
            type="number"
            name="bathroomsMin"
            defaultValue={filters.bathroomsMin ?? ""}
            placeholder="عدد الحمامات (على الأقل)"
            className={inputClass}
          />
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <button
            type="submit"
            className="rounded-lg bg-teal-700 px-5 py-2 text-sm font-medium text-white transition hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
          >
            بحث
          </button>
          {result.lastCollectedLabel && (
            <p className="text-xs text-zinc-500">آخر تحديث تلقائي: {result.lastCollectedLabel}</p>
          )}
        </div>
      </form>

      <p className="mt-6 text-sm text-zinc-600">
        عقارات طرابلس — ({result.total} نتيجة، صفحة {result.page} من {result.totalPages})
      </p>

      {result.items.length > 0 ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      ) : (
        <p className="mt-8 rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-center text-zinc-500">
          لا توجد عقارات مطابقة حاليًا. قد يكون النظام لا يزال يجمع البيانات في الخلفية — حاول مجددًا بعد قليل.
        </p>
      )}

      {result.totalPages > 1 && (
        <nav aria-label="تصفح صفحات العقارات" className="mt-6 flex flex-wrap justify-center gap-2">
          {Array.from({ length: result.totalPages }, (_, i) => i + 1).map((pageNumber) => (
            <Link
              key={pageNumber}
              href={pageHref(searchParams, pageNumber)}
              aria-current={pageNumber === result.page ? "true" : undefined}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 ${
                pageNumber === result.page
                  ? "bg-teal-700 text-white ring-teal-700"
                  : "bg-white text-zinc-700 ring-zinc-300 hover:bg-zinc-50"
              }`}
            >
              {pageNumber}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
