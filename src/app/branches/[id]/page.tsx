import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BranchStatusBadge } from "@/components/BranchStatusBadge";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { authorities } from "@/lib/authorities";
import { branches } from "@/lib/branches";

const NOT_PUBLISHED_TEXT = "غير منشور في المصدر الرسمي المستخدم.";

export function generateStaticParams() {
  return branches.map((branch) => ({ id: branch.id }));
}

export async function generateMetadata(
  props: PageProps<"/branches/[id]">
): Promise<Metadata> {
  const { id } = await props.params;
  const branch = branches.find((b) => b.id === id);

  if (!branch) return {};

  return {
    title: `${branch.name} — مساعد معاملات ليبيا`,
    description: `${branch.city}${branch.area ? ` — ${branch.area}` : ""}`,
  };
}

export default async function BranchDetailPage(props: PageProps<"/branches/[id]">) {
  const { id } = await props.params;
  const branch = branches.find((b) => b.id === id);

  if (!branch) notFound();

  const authority = authorities.find((a) => a.id === branch.authorityId) ?? null;

  return (
    <>
      <Header />

      <main className="flex-1 px-4 py-10">
        <div className="mx-auto max-w-3xl">
          <Breadcrumbs
            items={[
              { label: "الرئيسية", href: "/" },
              { label: "الفروع", href: "/branches" },
              { label: branch.name },
            ]}
          />

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">{branch.name}</h1>
            <BranchStatusBadge lastVerifiedAt={branch.lastVerifiedAt} />
          </div>

          <dl className="mt-8 grid gap-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-semibold text-zinc-500">الجهة</dt>
              <dd className="mt-1 text-zinc-800">
                {authority ? authority.name : NOT_PUBLISHED_TEXT}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-zinc-500">المدينة</dt>
              <dd className="mt-1 text-zinc-800">{branch.city}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-zinc-500">المنطقة</dt>
              <dd className="mt-1 text-zinc-800">{branch.area ?? NOT_PUBLISHED_TEXT}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-zinc-500">العنوان</dt>
              <dd className="mt-1 text-zinc-800">{branch.address ?? NOT_PUBLISHED_TEXT}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-zinc-500">الهاتف</dt>
              <dd className="mt-1 text-zinc-800" dir={branch.phone ? "ltr" : undefined}>
                {branch.phone ?? NOT_PUBLISHED_TEXT}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-zinc-500">آخر تحقق</dt>
              <dd className="mt-1 text-zinc-800">
                {branch.lastVerifiedAt ?? "لم يتم التحقق بعد"}
              </dd>
            </div>
          </dl>

          <section className="mt-10 border-t border-zinc-200 pt-6">
            <h2 className="text-lg font-bold text-zinc-900">المصدر الرسمي</h2>
            <div className="mt-3">
              <a
                href={branch.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md text-sm font-medium text-teal-700 hover:text-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
              >
                زيارة صفحة الفروع الرسمية ↗
              </a>
              <p className="mt-1 break-all text-xs text-zinc-500">{branch.sourceUrl}</p>
            </div>
            <p className="mt-4 text-sm text-zinc-500">
              تحقق من الفرع المناسب لحالتك قبل التوجه.
            </p>
          </section>

          <div className="mt-10">
            <Link
              href="/branches"
              className="rounded-md text-sm font-medium text-teal-700 hover:text-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
            >
              ← العودة إلى الفروع
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
