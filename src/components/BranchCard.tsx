import Link from "next/link";
import type { Branch } from "@/types/branch";
import { BranchStatusBadge } from "@/components/BranchStatusBadge";

export function BranchCard({ branch }: { branch: Branch }) {
  return (
    <Link
      href={`/branches/${branch.id}`}
      className="flex h-full flex-col gap-2 rounded-2xl border border-zinc-200 bg-white p-5 text-right shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-zinc-900">{branch.name}</h3>
        <BranchStatusBadge lastVerifiedAt={branch.lastVerifiedAt} />
      </div>
      <p className="text-sm text-teal-700">
        {branch.city}
        {branch.area ? ` — ${branch.area}` : ""}
      </p>
      {branch.address && <p className="text-sm text-zinc-600">{branch.address}</p>}
      {branch.phone && <p className="text-sm text-zinc-600" dir="ltr">{branch.phone}</p>}
    </Link>
  );
}
