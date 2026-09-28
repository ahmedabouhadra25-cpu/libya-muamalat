import Link from "next/link";
import type { PropertyListing } from "@/lib/realEstate/types";

const TYPE_LABELS: Record<PropertyListing["propertyType"], string> = {
  apartment: "شقة",
  villa: "فيلا",
  house: "منزل",
  land: "أرض",
  shop: "محل",
  office: "مكتب",
  building: "مبنى",
  investment: "عقار استثماري",
  other: "عقار",
};

function formatPrice(price: number | null): string {
  if (price === null) return "السعر غير محدد";
  return `${price.toLocaleString("ar-LY")} د.ل`;
}

/** بطاقة عقار — نفس لغة تصميم TransactionCard (بطاقة بيضاء بحواف مدورة، تأثير رفع عند hover). */
export function PropertyCard({ property }: { property: PropertyListing }) {
  const externalId = property.id.split("::").pop() ?? property.id;

  return (
    <Link
      href={`/transactions/real-estate/${externalId}`}
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white text-right shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
    >
      <div className="aspect-[4/3] w-full bg-zinc-100">
        {property.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={property.imageUrl}
            alt={property.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-zinc-400">
            لا تتوفر صورة
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700">
            {TYPE_LABELS[property.propertyType]}
          </span>
          <span className="text-xs font-medium text-zinc-500">
            {property.dealType === "sale" ? "للبيع" : "للإيجار"}
          </span>
        </div>

        <h3 className="line-clamp-1 font-semibold text-zinc-900">{property.title}</h3>
        <p className="text-sm text-zinc-600">{property.region}</p>
        <p className="font-semibold text-zinc-900">{formatPrice(property.price)}</p>

        <div className="mt-auto flex flex-wrap gap-3 pt-2 text-xs text-zinc-500">
          {property.bedrooms !== null && <span>{property.bedrooms} غرف</span>}
          {property.bathrooms !== null && <span>{property.bathrooms} حمامات</span>}
          {property.areaSqm !== null && <span>{property.areaSqm} م²</span>}
        </div>
      </div>
    </Link>
  );
}
