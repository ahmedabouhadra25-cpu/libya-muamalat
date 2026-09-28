import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BranchCard } from "@/components/BranchCard";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SearchBox } from "@/components/SearchBox";
import { authorities } from "@/lib/authorities";
import { branches } from "@/lib/branches";

export const metadata: Metadata = {
  title: "الفروع والجهات — مساعد معاملات ليبيا",
  description: "ابحث عن فروع الجهات الحكومية وتصفحها حسب الجهة أو المدينة.",
};

function normalize(text: string) {
  return text.trim().toLowerCase();
}

const cities = Array.from(new Set(branches.map((branch) => branch.city)));

function buildHref(
  q: string,
  authorityId: string | null,
  city: string | null
) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (authorityId) params.set("authority", authorityId);
  if (city) params.set("city", city);
  const query = params.toString();
  return query ? `/branches?${query}` : "/branches";
}

export default async function BranchesPage(props: PageProps<"/branches">) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === "string" ? searchParams.q : "";
  const authorityId =
    typeof searchParams.authority === "string" ? searchParams.authority : "";
  const city = typeof searchParams.city === "string" ? searchParams.city : "";

  const needle = normalize(q);
  const filtered = branches.filter((branch) => {
    if (authorityId && branch.authorityId !== authorityId) return false;
    if (city && branch.city !== city) return false;
    if (!needle) return true;
    const haystack = normalize(
      [branch.name, branch.city, branch.area ?? "", branch.address ?? ""].join(" ")
    );
    return haystack.includes(needle);
  });

  return (
    <>
      <Header />

      <main className="flex-1 px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <Breadcrumbs
            items={[{ label: "الرئيسية", href: "/" }, { label: "الفروع" }]}
          />

          <div className="mt-6 text-center sm:text-right">
            <h1 className="text-3xl font-bold text-zinc-900">الفروع والجهات</h1>
            <p className="mt-2 text-zinc-600">
              ابحث عن فرع أو تصفح الفروع حسب الجهة أو المدينة.
            </p>
          </div>

          <div className="mt-8">
            <SearchBox
              action="/branches"
              defaultValue={q}
              placeholder="مثلاً: جوازات ابوسليم"
            />
          </div>

          <div
            role="group"
            aria-label="تصفية حسب الجهة"
            className="mt-6 flex flex-wrap justify-center gap-2 sm:justify-start"
          >
            <Link
              href={buildHref(q, null, city || null)}
              aria-current={!authorityId ? "true" : undefined}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ring-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 ${
                !authorityId
                  ? "bg-teal-700 text-white ring-teal-700"
                  : "bg-white text-zinc-700 ring-zinc-300 hover:bg-zinc-50"
              }`}
            >
              كل الجهات
            </Link>
            {authorities.map((authority) => (
              <Link
                key={authority.id}
                href={buildHref(q, authority.id, city || null)}
                aria-current={authorityId === authority.id ? "true" : undefined}
                className={`rounded-full px-4 py-1.5 text-sm font-medium ring-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 ${
                  authorityId === authority.id
                    ? "bg-teal-700 text-white ring-teal-700"
                    : "bg-white text-zinc-700 ring-zinc-300 hover:bg-zinc-50"
                }`}
              >
                {authority.name}
              </Link>
            ))}
          </div>

          <div
            role="group"
            aria-label="تصفية حسب المدينة"
            className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start"
          >
            <Link
              href={buildHref(q, authorityId || null, null)}
              aria-current={!city ? "true" : undefined}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ring-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 ${
                !city
                  ? "bg-zinc-800 text-white ring-zinc-800"
                  : "bg-white text-zinc-700 ring-zinc-300 hover:bg-zinc-50"
              }`}
            >
              كل المدن
            </Link>
            {cities.map((c) => (
              <Link
                key={c}
                href={buildHref(q, authorityId || null, c)}
                aria-current={city === c ? "true" : undefined}
                className={`rounded-full px-4 py-1.5 text-sm font-medium ring-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 ${
                  city === c
                    ? "bg-zinc-800 text-white ring-zinc-800"
                    : "bg-white text-zinc-700 ring-zinc-300 hover:bg-zinc-50"
                }`}
              >
                {c}
              </Link>
            ))}
          </div>

          <p className="mt-6 text-sm text-zinc-500">
            ({filtered.length} من {branches.length} فرعًا موثقًا من المصادر الرسمية)
          </p>

          {filtered.length > 0 ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((branch) => (
                <BranchCard key={branch.id} branch={branch} />
              ))}
            </div>
          ) : (
            <p className="mt-8 rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-center text-zinc-500">
              لا توجد نتائج مطابقة لبحثك.
            </p>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
