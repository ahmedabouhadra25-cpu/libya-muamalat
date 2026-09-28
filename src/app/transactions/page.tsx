import Link from "next/link";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SearchBox } from "@/components/SearchBox";
import { TransactionCard } from "@/components/TransactionCard";
import { RealEstateSection } from "@/components/RealEstateSection";
import { categories } from "@/lib/categories";
import { demoTransactions } from "@/lib/demo-transactions";

export const metadata: Metadata = {
  title: "المعاملات — مساعد معاملات ليبيا",
  description: "ابحث عن معاملتك وتصفح الفئات المتاحة.",
};

function normalize(text: string) {
  return text.trim().toLowerCase();
}

function buildCategoryHref(q: string, categoryId: string | null) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (categoryId) params.set("category", categoryId);
  const query = params.toString();
  return query ? `/transactions?${query}` : "/transactions";
}

export default async function TransactionsPage(props: PageProps<"/transactions">) {
  const searchParams = await props.searchParams;
  const q = typeof searchParams.q === "string" ? searchParams.q : "";
  const category = typeof searchParams.category === "string" ? searchParams.category : "";

  const needle = normalize(q);
  const filtered = demoTransactions.filter((transaction) => {
    if (category && transaction.category !== category) return false;
    if (!needle) return true;
    const haystack = normalize(
      [transaction.title, transaction.shortDescription, ...transaction.keywords].join(" ")
    );
    return haystack.includes(needle);
  });

  return (
    <>
      <Header />

      <main className="flex-1 px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <Breadcrumbs
            items={[{ label: "الرئيسية", href: "/" }, { label: "المعاملات" }]}
          />

          <div className="mt-6 text-center sm:text-right">
            <h1 className="text-3xl font-bold text-zinc-900">المعاملات</h1>
            <p className="mt-2 text-zinc-600">
              ابحث عن معاملتك وتصفح الفئات المتاحة.
            </p>
          </div>

          {category !== "real-estate" && (
            <div className="mt-8">
              <SearchBox defaultValue={q} category={category || undefined} />
            </div>
          )}

          <div
            role="group"
            aria-label="تصفية حسب الفئة"
            className="mt-6 flex flex-wrap justify-center gap-2 sm:justify-start"
          >
            <Link
              href={buildCategoryHref(q, null)}
              aria-current={!category ? "true" : undefined}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ring-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 ${
                !category
                  ? "bg-teal-700 text-white ring-teal-700"
                  : "bg-white text-zinc-700 ring-zinc-300 hover:bg-zinc-50"
              }`}
            >
              الكل
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={buildCategoryHref(q, c.id)}
                aria-current={category === c.id ? "true" : undefined}
                className={`rounded-full px-4 py-1.5 text-sm font-medium ring-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 ${
                  category === c.id
                    ? "bg-teal-700 text-white ring-teal-700"
                    : "bg-white text-zinc-700 ring-zinc-300 hover:bg-zinc-50"
                }`}
              >
                {c.name}
              </Link>
            ))}
          </div>

          {category === "real-estate" ? (
            <RealEstateSection searchParams={searchParams} />
          ) : (
            <>
              <p className="mt-6 text-sm text-zinc-600">
                تختلف حالة التحقق من معاملة لأخرى — راجع الشارة الظاهرة على كل
                بطاقة. ({filtered.length} من {demoTransactions.length})
              </p>

              {filtered.length > 0 ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filtered.map((transaction) => (
                    <TransactionCard key={transaction.id} transaction={transaction} />
                  ))}
                </div>
              ) : (
                <p className="mt-8 rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-center text-zinc-500">
                  لا توجد نتائج مطابقة لبحثك.
                </p>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
