import Link from "next/link";
import type { Transaction } from "@/types/transaction";
import { categories } from "@/lib/categories";
import { VerificationBadge } from "@/components/VerificationBadge";

export function TransactionCard({ transaction }: { transaction: Transaction }) {
  const categoryName =
    categories.find((category) => category.id === transaction.category)?.name ??
    transaction.category;

  return (
    <Link
      href={`/transactions/${transaction.slug}`}
      className="flex h-full flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 text-right shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-zinc-900">{transaction.title}</h3>
        <VerificationBadge status={transaction.verificationStatus} />
      </div>
      <p className="text-sm text-teal-700">{categoryName}</p>
      <p className="text-sm text-zinc-600">{transaction.shortDescription}</p>
      {transaction.verificationStatus === "demo" && (
        <p className="text-xs font-medium text-amber-700">
          قيد الإعداد — غير موثقة من مصدر رسمي بعد
        </p>
      )}
    </Link>
  );
}
