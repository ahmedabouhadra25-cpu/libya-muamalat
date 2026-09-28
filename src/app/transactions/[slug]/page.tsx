import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BranchCard } from "@/components/BranchCard";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { LibyanFlag } from "@/components/LibyanFlag";
import { OfficialForms } from "@/components/OfficialForms";
import { SourceCard } from "@/components/SourceCard";
import { VerificationBadge } from "@/components/VerificationBadge";
import { authorities } from "@/lib/authorities";
import { branches } from "@/lib/branches";
import { categories } from "@/lib/categories";
import { demoTransactions } from "@/lib/demo-transactions";
import { allSources } from "@/lib/sources";
import type { VerificationStatus } from "@/types/transaction";

const UNCHECKED_TEXT = "تحتاج إلى التحقق من المصدر الرسمي";
const NOT_SPECIFIED_TEXT = "غير محددة في المصدر المستخدم";

/**
 * شرح كل حالة توثيق — يُعرض بشكل بارز وموحَّد أسفل الـHero لكل الحالات
 * الخمس. النصوص مطابقة لما هو مستخدَم فعليًا في باقي المشروع (لا نص جديد
 * يخص verified/needs_review/demo).
 */
const STATUS_EXPLANATIONS: Record<VerificationStatus, string> = {
  demo: "هذه المعاملة قيد الإعداد والتحقق. لا تعتمد هذه المعلومات لإتمام معاملتك حتى يتم توثيقها من مصدر رسمي.",
  needs_review:
    "تم ربط هذه المعاملة بمصدر رسمي، لكن الموقع الرسمي لا ينشر حاليًا تفاصيل كاملة لخطوات هذه الخدمة أو مستنداتها أو رسومها. راجع الجهة المختصة مباشرة قبل البدء في الإجراء.",
  verified: "تمت مراجعة هذه المعلومات مقابل مصدر رسمي.",
  outdated: "قد تكون هذه المعلومات قديمة ولم تُحدَّث مؤخرًا. تحقق من المصدر الرسمي قبل الاعتماد عليها.",
  conflict:
    "توجد اختلافات بين المصادر الرسمية حول هذه المعلومة. راجع الجهة المختصة مباشرة لحسم الاختلاف قبل البدء في الإجراء.",
};

const STATUS_BANNER_STYLES: Record<VerificationStatus, string> = {
  demo: "border-amber-300 bg-amber-50 text-amber-900",
  needs_review: "border-orange-300 bg-orange-50 text-orange-900",
  verified: "border-green-300 bg-green-50 text-green-900",
  outdated: "border-zinc-300 bg-zinc-50 text-zinc-700",
  conflict: "border-red-300 bg-red-50 text-red-900",
};

const STATUS_ICON_BADGE_STYLES: Record<VerificationStatus, string> = {
  demo: "bg-amber-100 text-amber-700",
  needs_review: "bg-orange-100 text-orange-700",
  verified: "bg-green-100 text-green-700",
  outdated: "bg-zinc-200 text-zinc-600",
  conflict: "bg-red-100 text-red-700",
};

const STATUS_ICONS: Record<VerificationStatus, ReactNode> = {
  verified: (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path d="M4 12.5 9.5 18 20 6.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  needs_review: (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 8v5M12 15.5h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  ),
  demo: (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path d="M9 3h6M10 3v5.5L5.5 17a2 2 0 0 0 1.8 3h9.4a2 2 0 0 0 1.8-3L14 8.5V3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  outdated: (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7v5l3.2 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  conflict: (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
      <path d="M12 3.5 21 19H3L12 3.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 10v4M12 17h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  ),
};

function SectionIcon({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0a2540]/5 text-[#0a2540]">
      {children}
    </span>
  );
}

function SectionCard({
  title,
  icon,
  children,
  spacingClassName = "mt-6",
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  /** يسمح بإزالة الهامش العلوي للبطاقة الأولى في العمود لمحاذاتها مع أعلى الـSidebar. */
  spacingClassName?: string;
}) {
  return (
    <section
      className={`${spacingClassName} rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6`}
    >
      <div className="flex items-center gap-3">
        <SectionIcon>{icon}</SectionIcon>
        <h2 className="text-lg font-bold text-zinc-900">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

const ICONS = {
  authority: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M4 21h16M5 21V10l7-5 7 5v11M9 21v-6h6v6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  steps: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  documents: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M14 3v4h4M9 13h6M9 17h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  conditions: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M9.5 12l2 2 3.5-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  fees: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 8v8M9.5 9.5h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  duration: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 7v5l3.5 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  warnings: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M12 3.5 21 19H3L12 3.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M12 10v4M12 17h.01" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  sources: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path d="M10 13.5a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1 1M14 10.5a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1-1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

export function generateStaticParams() {
  return demoTransactions.map((transaction) => ({ slug: transaction.slug }));
}

export async function generateMetadata(
  props: PageProps<"/transactions/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const transaction = demoTransactions.find((t) => t.slug === slug);

  if (!transaction) return {};

  return {
    title: `${transaction.title} — مساعد معاملات ليبيا`,
    description: transaction.shortDescription,
  };
}

export default async function TransactionDetailPage(
  props: PageProps<"/transactions/[slug]">
) {
  const { slug } = await props.params;
  const transaction = demoTransactions.find((t) => t.slug === slug);

  if (!transaction) notFound();

  const categoryName =
    categories.find((c) => c.id === transaction.category)?.name ?? transaction.category;
  const linkedSource = transaction.sourceId
    ? allSources.find((s) => s.id === transaction.sourceId) ?? null
    : null;
  const sourceRefs = (transaction.sources ?? [])
    .map((ref) => {
      const source = allSources.find((s) => s.id === ref.sourceId);
      return source ? { ...ref, source } : null;
    })
    .filter((ref) => ref !== null);
  const linkedAuthority = transaction.authorityId
    ? authorities.find((a) => a.id === transaction.authorityId) ?? null
    : null;
  const authorityBranches = linkedAuthority
    ? branches.filter((b) => b.authorityId === linkedAuthority.id)
    : [];
  // للمعاملات التجريبية: لم نراجع أي مصدر بعد. للمعاملات المُراجَعة: الحقل الفارغ يعني
  // أن المصدر الرسمي المستخدم فعليًا لا يذكر هذه المعلومة، وليس أننا لم نتحقق منها.
  const fieldMissingText =
    transaction.verificationStatus === "demo" ? UNCHECKED_TEXT : NOT_SPECIFIED_TEXT;
  const feesValue = transaction.fees?.amount ?? transaction.fees?.notes ?? null;
  const durationValue = transaction.duration ?? null;

  return (
    <>
      <Header />

      <main className="flex-1 bg-slate-50">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#0a2540] via-[#123a63] to-[#0d3157] px-4 py-10 sm:py-14">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl"
          />
          <div className="relative mx-auto max-w-6xl">
            <Breadcrumbs
              variant="onDark"
              items={[
                { label: "الرئيسية", href: "/" },
                { label: "المعاملات", href: "/transactions" },
                { label: transaction.title },
              ]}
            />

            <div className="mt-6 flex items-start justify-between gap-6 sm:gap-10">
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-extrabold text-white sm:text-4xl">
                  {transaction.title}
                </h1>
                <p className="mt-2 flex flex-wrap items-center gap-x-2 text-sm font-medium text-sky-200">
                  <span>{categoryName}</span>
                  {transaction.serviceArea && <span>· 📍 {transaction.serviceArea}</span>}
                </p>
                <p className="mt-4 max-w-xl text-slate-200">{transaction.shortDescription}</p>
              </div>

              <LibyanFlag className="hidden w-28 shrink-0 sm:block sm:w-36" />
            </div>
          </div>
        </section>

        {/* بطاقة التحقق — بارزة وواضحة، تجمع الحالة + الوصف + الجهة المسؤولة */}
        <section className="bg-white px-4 py-6 sm:py-8">
          <div className="mx-auto max-w-6xl">
            <div
              role="note"
              className={`flex flex-wrap items-start gap-4 rounded-2xl border p-5 shadow-sm sm:p-6 ${STATUS_BANNER_STYLES[transaction.verificationStatus]}`}
            >
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${STATUS_ICON_BADGE_STYLES[transaction.verificationStatus]}`}
              >
                {STATUS_ICONS[transaction.verificationStatus]}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <VerificationBadge status={transaction.verificationStatus} />
                  <span className="text-xs opacity-70">
                    آخر تحقق: {transaction.lastVerifiedAt ?? "لم يتم التحقق بعد"}
                  </span>
                </div>
                <p className="mt-2 text-sm">{STATUS_EXPLANATIONS[transaction.verificationStatus]}</p>
                <p className="mt-3 flex flex-wrap items-center gap-2 text-sm font-medium">
                  <span className="opacity-80">{ICONS.authority}</span>
                  <span>الجهة المسؤولة: {transaction.authority ?? fieldMissingText}</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* المحتوى: عمودان — Sidebar (يمين على الشاشات الكبيرة) + المحتوى الرئيسي */}
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="grid gap-6 lg:grid-cols-[300px_1fr] lg:gap-8">
            {/* Sidebar */}
            <aside className="order-2 space-y-6 lg:order-1">
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <Link
                  href="/transactions"
                  className="inline-flex items-center gap-1 rounded-md text-sm font-medium text-[#0a2540] hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
                >
                  ← العودة إلى قائمة المعاملات
                </Link>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                <h2 className="flex items-center gap-2 text-sm font-bold text-zinc-500">
                  <SectionIcon>{ICONS.documents}</SectionIcon>
                  معلومات سريعة
                </h2>
                <dl className="mt-4 space-y-4 text-sm">
                  <div>
                    <dt className="text-zinc-500">الجهة المسؤولة</dt>
                    <dd className="mt-1 font-medium text-zinc-900">
                      {transaction.authority ?? fieldMissingText}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-zinc-500">حالة التحقق</dt>
                    <dd>
                      <VerificationBadge status={transaction.verificationStatus} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">الرسوم</dt>
                    <dd className="mt-1 font-medium text-zinc-900">
                      {feesValue ?? fieldMissingText}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-zinc-500">المدة الزمنية</dt>
                    <dd className="mt-1 font-medium text-zinc-900">
                      {durationValue ?? fieldMissingText}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5">
                <h2 className="text-sm font-bold text-[#0a2540]">هل تحتاج إلى مساعدة؟</h2>
                <p className="mt-2 text-sm text-slate-700">
                  إذا احتجت توضيحًا إضافيًا، راجع الجهة المختصة المذكورة في هذه الصفحة
                  مباشرة قبل البدء في الإجراء.
                </p>
              </div>
            </aside>

            {/* المحتوى الرئيسي */}
            <div className="order-1 lg:order-2">
              {/* الجهة المسؤولة */}
              <SectionCard title="الجهة المسؤولة" icon={ICONS.authority} spacingClassName="mt-0">
                <p className="text-zinc-700">{transaction.authority ?? fieldMissingText}</p>

                {linkedAuthority ? (
                  <>
                    <h3 className="mt-6 text-base font-semibold text-zinc-900">الفروع</h3>
                    {authorityBranches.length > 0 ? (
                      <>
                        <p className="mt-1 text-sm text-zinc-500">
                          فروع الجهة المتاحة في المصدر الرسمي. تحقق من الفرع المناسب
                          لحالتك قبل التوجه.
                        </p>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                          {authorityBranches.map((branch) => (
                            <BranchCard key={branch.id} branch={branch} />
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="mt-3 text-sm text-zinc-500">
                        لا تتوفر بيانات فروع موثقة لهذه الجهة بعد.
                      </p>
                    )}
                  </>
                ) : (
                  !transaction.authority && (
                    <p className="mt-3 text-sm text-zinc-500">
                      لم يتم تحديد الجهة المختصة لهذه المعاملة بعد.
                    </p>
                  )
                )}
              </SectionCard>

              {/* الخطوات — Timeline */}
              <SectionCard title="الخطوات" icon={ICONS.steps}>
                {transaction.steps.length > 0 ? (
                  <ol className="space-y-0">
                    {transaction.steps.map((step, index) => {
                      const isLast = index === transaction.steps.length - 1;
                      return (
                        <li key={step.title} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0a2540] text-xs font-bold text-white">
                              {index + 1}
                            </span>
                            {!isLast && (
                              <span
                                aria-hidden="true"
                                className="mt-1 w-0.5 flex-1 bg-sky-200"
                              />
                            )}
                          </div>
                          <div className={`flex-1 ${isLast ? "" : "pb-6"}`}>
                            <p className="font-semibold text-zinc-900">{step.title}</p>
                            {step.description && (
                              <p className="mt-1 text-sm text-zinc-600">{step.description}</p>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                ) : (
                  <p className="text-sm text-zinc-500">{fieldMissingText}</p>
                )}
              </SectionCard>

              {/* المستندات المطلوبة */}
              <SectionCard title="المستندات المطلوبة" icon={ICONS.documents}>
                {transaction.requiredDocuments.length > 0 ? (
                  <ul className="list-inside list-disc space-y-2 text-zinc-700">
                    {transaction.requiredDocuments.map((doc) => (
                      <li key={doc.name}>
                        {doc.name}
                        {doc.notes && (
                          <span className="text-sm text-zinc-500"> — {doc.notes}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-zinc-500">{fieldMissingText}</p>
                )}
              </SectionCard>

              <OfficialForms transactionSlug={transaction.slug} />

              {/* الشروط */}
              <SectionCard title="الشروط" icon={ICONS.conditions}>
                {transaction.conditions.length > 0 ? (
                  <ul className="list-inside list-disc space-y-2 text-zinc-700">
                    {transaction.conditions.map((condition) => (
                      <li key={condition}>{condition}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-zinc-500">{fieldMissingText}</p>
                )}
              </SectionCard>

              {/* الرسوم / المدة / التحذيرات — صف بطاقات */}
              <div
                className={`mt-6 grid gap-4 ${
                  transaction.warnings.length > 0 ? "sm:grid-cols-3" : "sm:grid-cols-2"
                }`}
              >
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <SectionIcon>{ICONS.fees}</SectionIcon>
                    <h2 className="text-base font-bold text-zinc-900">الرسوم</h2>
                  </div>
                  <p className="mt-3 text-zinc-700">{feesValue ?? fieldMissingText}</p>
                  {transaction.fees?.amount && transaction.fees?.notes && (
                    <p className="mt-1 text-sm text-zinc-500">ملاحظة: {transaction.fees.notes}</p>
                  )}
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <SectionIcon>{ICONS.duration}</SectionIcon>
                    <h2 className="text-base font-bold text-zinc-900">المدة الزمنية</h2>
                  </div>
                  <p className="mt-3 text-zinc-700">{durationValue ?? fieldMissingText}</p>
                </div>

                {transaction.warnings.length > 0 && (
                  <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5 shadow-sm">
                    <div className="flex items-center gap-3">
                      <SectionIcon>{ICONS.warnings}</SectionIcon>
                      <h2 className="text-base font-bold text-zinc-900">تنبيهات</h2>
                    </div>
                    <ul className="mt-3 space-y-2">
                      {transaction.warnings.map((warning) => (
                        <li key={warning} className="text-sm text-orange-900">
                          {warning}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* المصادر الرسمية */}
              <SectionCard title="المصادر الرسمية" icon={ICONS.sources}>
                {sourceRefs.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {sourceRefs.map((ref) => (
                      <SourceCard
                        key={ref.sourceId}
                        source={ref.source}
                        pageUrl={ref.url}
                        role={ref.role}
                      />
                    ))}
                  </div>
                ) : linkedSource ? (
                  <SourceCard source={linkedSource} pageUrl={transaction.sourceUrl} />
                ) : (
                  <p className="text-sm text-zinc-500">لم يتم ربط هذه المعاملة بمصدر رسمي بعد.</p>
                )}
              </SectionCard>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
