export function BranchStatusBadge({ lastVerifiedAt }: { lastVerifiedAt?: string | null }) {
  const verified = Boolean(lastVerifiedAt);

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1 ${
        verified
          ? "bg-teal-50 text-teal-800 ring-teal-200"
          : "bg-zinc-100 text-zinc-600 ring-zinc-300"
      }`}
    >
      {verified ? "تم التحقق من المصدر الرسمي" : "يحتاج مراجعة"}
    </span>
  );
}
