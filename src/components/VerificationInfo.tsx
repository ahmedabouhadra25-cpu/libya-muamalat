import type { VerificationStatus } from "@/types/transaction";
import type { OfficialSource } from "@/types/source";
import { VerificationBadge } from "@/components/VerificationBadge";

interface VerificationInfoProps {
  status: VerificationStatus;
  lastVerifiedAt?: string | null;
  source?: OfficialSource | null;
  /** عند وجود أكثر من مصدر واحد للمعاملة، مرّر أسماءها هنا بدل source. */
  sourceNames?: string[];
}

export function VerificationInfo({
  status,
  lastVerifiedAt,
  source,
  sourceNames,
}: VerificationInfoProps) {
  const usedSourceText =
    sourceNames && sourceNames.length > 0
      ? sourceNames.join(" و")
      : source
        ? source.name
        : "لم يتم ربط هذه المعاملة بمصدر رسمي بعد.";

  return (
    <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5">
      <h2 className="text-sm font-semibold text-zinc-500">حالة المعلومات</h2>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <VerificationBadge status={status} />
        <span className="text-sm text-zinc-600">
          آخر تحقق: {lastVerifiedAt ?? "لم يتم التحقق بعد"}
        </span>
      </div>

      <p className="mt-3 text-sm text-zinc-600">
        {sourceNames && sourceNames.length > 1 ? "المصادر المستخدمة" : "المصدر المستخدم"}:{" "}
        {usedSourceText}
      </p>

      {status === "demo" && (
        <p className="mt-3 text-sm font-medium text-amber-700">
          بيانات تجريبية — لم يتم التحقق منها رسميًا.
        </p>
      )}
    </section>
  );
}
