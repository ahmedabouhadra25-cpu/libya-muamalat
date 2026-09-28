import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  /** "onDark" لاستخدامها فوق خلفية داكنة (مثل Hero) — نفس البنية، ألوان فقط. */
  variant?: "default" | "onDark";
}

export function Breadcrumbs({ items, variant = "default" }: BreadcrumbsProps) {
  const isOnDark = variant === "onDark";

  return (
    <nav
      aria-label="مسار التصفح"
      className={`text-sm ${isOnDark ? "text-slate-300" : "text-zinc-500"}`}
    >
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => (
          <li key={item.href ?? item.label} className="flex items-center gap-2">
            {index > 0 && <span aria-hidden="true">←</span>}
            {item.href ? (
              <Link
                href={item.href}
                className={`rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                  isOnDark
                    ? "hover:text-white focus-visible:ring-sky-400 focus-visible:ring-offset-[#0a2540]"
                    : "hover:text-teal-700 focus-visible:ring-teal-600"
                }`}
              >
                {item.label}
              </Link>
            ) : (
              <span
                aria-current="page"
                className={`font-medium ${isOnDark ? "text-white" : "text-zinc-700"}`}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
