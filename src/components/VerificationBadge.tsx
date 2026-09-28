import type { VerificationStatus } from "@/types/transaction";

const STATUS_CONFIG: Record<VerificationStatus, { label: string; className: string }> = {
  demo: {
    label: "تجريبية",
    className: "bg-amber-50 text-amber-800 ring-amber-200",
  },
  verified: {
    label: "موثقة",
    className: "bg-green-50 text-green-800 ring-green-200",
  },
  needs_review: {
    label: "تحتاج مراجعة",
    className: "bg-orange-50 text-orange-800 ring-orange-200",
  },
  outdated: {
    label: "قديمة",
    className: "bg-zinc-100 text-zinc-600 ring-zinc-300",
  },
  conflict: {
    label: "يوجد تعارض في المصادر",
    className: "bg-red-50 text-red-800 ring-red-200",
  },
};

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ${config.className}`}
    >
      {config.label}
    </span>
  );
}
