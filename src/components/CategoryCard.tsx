import Link from "next/link";
import type { Category } from "@/types/category";

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      href={`/transactions?category=${category.id}`}
      className="block w-full rounded-2xl border border-zinc-200 bg-white p-4 text-right shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
    >
      <span className="block font-semibold text-zinc-900">{category.name}</span>
    </Link>
  );
}
