import type { OfficialSource } from "@/types/source";
import {
  AUTHORITY_LEVEL_LABELS,
  SOURCE_TYPE_LABELS,
  getSourceKindLabel,
} from "@/lib/source-priority";

interface SourceCardProps {
  source: OfficialSource;
  /** رابط الصفحة الرسمية المحددة التي استُقيت منها المعلومة (مثل صفحة FAQ)، إن وُجد. */
  pageUrl?: string | null;
  /** ما الذي يثبته هذا المصدر تحديدًا ضمن المعاملة، عند استخدام أكثر من مصدر. */
  role?: string | null;
}

export function SourceCard({ source, pageUrl, role }: SourceCardProps) {
  const kindLabel = getSourceKindLabel(source);
  const isSecondary = source.authorityLevel >= 3;
  const effectiveUrl = pageUrl || source.url;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      {role && (
        <p className="mb-2 inline-block rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
          يغطي: {role}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-zinc-900">{source.name}</h3>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${
            isSecondary
              ? "bg-zinc-100 text-zinc-600 ring-zinc-300"
              : "bg-teal-50 text-teal-800 ring-teal-200"
          }`}
        >
          {kindLabel}
        </span>
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-semibold text-zinc-500">نوع المصدر</dt>
          <dd className="mt-1 text-zinc-800">{SOURCE_TYPE_LABELS[source.sourceType]}</dd>
        </div>
        <div>
          <dt className="font-semibold text-zinc-500">مستوى الموثوقية</dt>
          <dd className="mt-1 text-zinc-800">
            {AUTHORITY_LEVEL_LABELS[source.authorityLevel]}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-zinc-500">آخر تحقق</dt>
          <dd className="mt-1 text-zinc-800">{source.lastCheckedAt ?? "لم يتم التحقق بعد"}</dd>
        </div>
      </dl>

      {source.description && (
        <p className="mt-4 text-sm text-zinc-600">{source.description}</p>
      )}

      {isSecondary && (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          هذا مصدر ثانوي مساعد للبحث، ولا يُعتمد عليه وحده كمرجع نهائي عند توفر
          مصدر رسمي.
        </p>
      )}

      <div className="mt-4">
        <a
          href={effectiveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-md text-sm font-medium text-teal-700 hover:text-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
        >
          زيارة المصدر ↗
        </a>
        <p className="mt-1 break-all text-xs text-zinc-500">{effectiveUrl}</p>
      </div>
    </div>
  );
}
