import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getPropertyById } from "@/lib/realEstate/collector";
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
  if (price === null) return "السعر غير معلن";
  return `${price.toLocaleString("ar-LY")} د.ل`;
}

export async function generateMetadata(
  props: PageProps<"/transactions/real-estate/[id]">
): Promise<Metadata> {
  const { id } = await props.params;
  const property = await getPropertyById(id);
  return {
    title: property ? `${property.title} — عقارات طرابلس` : "عقار غير موجود",
    description: property?.description ?? "تفاصيل عقار في طرابلس.",
  };
}

export default async function PropertyDetailPage(
  props: PageProps<"/transactions/real-estate/[id]">
) {
  const { id } = await props.params;
  const property = await getPropertyById(id);

  if (!property) notFound();

  const mapQuery = encodeURIComponent(`${property.region} طرابلس ليبيا`);
  const mapHref = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

  return (
    <>
      <Header />

      <main className="flex-1 px-4 py-10">
        <div className="mx-auto max-w-4xl">
          <Breadcrumbs
            items={[
              { label: "الرئيسية", href: "/" },
              { label: "المعاملات", href: "/transactions" },
              { label: "عقارات", href: "/transactions?category=real-estate" },
              { label: property.title },
            ]}
          />

          <div className="mt-6 aspect-[16/9] w-full overflow-hidden rounded-2xl bg-zinc-100">
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
              <div className="flex h-full w-full items-center justify-center text-zinc-400">
                لا تتوفر صورة
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">{property.title}</h1>
              <p className="mt-1 text-zinc-600">{property.region}</p>
            </div>
            <span className="rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-700">
              {property.dealType === "sale" ? "للبيع" : "للإيجار"}
            </span>
          </div>

          <p className="mt-4 text-2xl font-bold text-zinc-900">{formatPrice(property.price)}</p>

          <dl className="mt-6 grid grid-cols-2 gap-4 rounded-2xl border border-zinc-200 bg-white p-5 sm:grid-cols-4">
            <div>
              <dt className="text-xs text-zinc-500">نوع العقار</dt>
              <dd className="mt-1 font-semibold text-zinc-900">{TYPE_LABELS[property.propertyType]}</dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">المساحة</dt>
              <dd className="mt-1 font-semibold text-zinc-900">
                {property.areaSqm !== null ? `${property.areaSqm} م²` : "غير محددة"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">الغرف</dt>
              <dd className="mt-1 font-semibold text-zinc-900">
                {property.bedrooms !== null ? property.bedrooms : "غير محدد"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">الحمامات</dt>
              <dd className="mt-1 font-semibold text-zinc-900">
                {property.bathrooms !== null ? property.bathrooms : "غير محدد"}
              </dd>
            </div>
          </dl>

          {property.description && (
            <div className="mt-6">
              <h2 className="font-semibold text-zinc-900">الوصف</h2>
              <p className="mt-2 text-zinc-600">{property.description}</p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-zinc-500">
            <span>المصدر: {property.source}</span>
            {property.lastUpdatedLabel && <span>· آخر تحديث: {property.lastUpdatedLabel}</span>}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={property.sourceUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
            >
              زيارة الإعلان الأصلي
            </a>
            <a
              href={mapHref}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
            >
              عرض الموقع على الخريطة
            </a>
            <Link
              href="/transactions?category=real-estate"
              className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
            >
              العودة إلى عقارات طرابلس
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
