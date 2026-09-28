import type { FormVerificationStatus } from "@/types/form";
import { authorities } from "@/lib/authorities";
import { officialForms } from "@/lib/forms";

const FORM_STATUS_CONFIG: Record<FormVerificationStatus, { label: string; className: string }> = {
  verified: {
    label: "موثّق ومتاح",
    className: "bg-teal-50 text-teal-800 ring-teal-200",
  },
  needs_review: {
    label: "تحتاج مراجعة",
    className: "bg-orange-50 text-orange-800 ring-orange-200",
  },
  unavailable: {
    label: "غير متاح حاليًا",
    className: "bg-zinc-100 text-zinc-600 ring-zinc-300",
  },
};

function FormStatusBadge({ status }: { status: FormVerificationStatus }) {
  const config = FORM_STATUS_CONFIG[status];

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ${config.className}`}
    >
      {config.label}
    </span>
  );
}

// إذا لم توجد أي نماذج مرتبطة بالمعاملة (الحالة الحالية دائمًا)، يُعيد هذا
// المكوّن null فلا يُضاف أي DOM أو مسافة أو رسالة "لا يوجد نموذج" للمستخدم.
export function OfficialForms({ transactionSlug }: { transactionSlug: string }) {
  const forms = officialForms.filter((form) =>
    form.transactionSlugs.includes(transactionSlug)
  );

  if (forms.length === 0) return null;

  return (
    <section className="mt-10 border-t border-zinc-200 pt-6">
      <h2 className="text-lg font-bold text-zinc-900">📄 النماذج الرسمية</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {forms.map((form) => {
          const authority = authorities.find((a) => a.id === form.authorityId);

          return (
            <div
              key={form.id}
              className="flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-zinc-900">{form.name}</h3>
                <FormStatusBadge status={form.verificationStatus} />
              </div>
              {authority && <p className="text-sm text-teal-700">{authority.name}</p>}
              {form.description && (
                <p className="text-sm text-zinc-600">{form.description}</p>
              )}
              <p className="text-xs text-zinc-500">
                آخر تحقق: {form.lastVerifiedAt ?? "لم يتم التحقق بعد"}
              </p>
              <div className="mt-2 flex flex-wrap gap-4">
                <a
                  href={form.sourcePageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md text-sm font-medium text-teal-700 hover:text-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
                >
                  فتح المصدر الرسمي ↗
                </a>
                {form.downloadUrl && (
                  <a
                    href={form.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-md text-sm font-medium text-teal-700 hover:text-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
                  >
                    تحميل النموذج PDF ↓
                  </a>
                )}
              </div>
              {form.notes && <p className="text-xs text-zinc-500">{form.notes}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
