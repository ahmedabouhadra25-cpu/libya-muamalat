import Link from "next/link";
import { Logo } from "@/components/Logo";
import { MobileNav } from "@/components/MobileNav";

const NAV_LINKS = [
  { href: "/", label: "الرئيسية" },
  { href: "/transactions", label: "المعاملات" },
  { href: "/branches", label: "الفروع" },
  { href: "/#how-it-works", label: "كيف يعمل؟" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-20 bg-[#0a2540] shadow-md">
      <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Logo />

        <nav
          aria-label="التنقل الرئيسي"
          className="hidden items-center gap-6 text-sm font-medium text-slate-100 lg:flex"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-1 py-1 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a2540]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <form
          action="/transactions"
          method="GET"
          role="search"
          className="hidden max-w-xs flex-1 lg:flex"
        >
          <label htmlFor="header-search" className="sr-only">
            ابحث عن معاملة
          </label>
          <div className="flex w-full items-center gap-2 rounded-full bg-white/95 px-4 py-2 transition focus-within:ring-2 focus-within:ring-sky-400">
            <svg aria-hidden="true" className="h-4 w-4 shrink-0 text-zinc-400" viewBox="0 0 20 20" fill="none">
              <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.8" />
              <path d="M17 17l-4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input
              id="header-search"
              name="q"
              type="search"
              placeholder="ابحث عن معاملة..."
              className="w-full bg-transparent text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none"
            />
          </div>
        </form>

        <button
          type="button"
          className="hidden shrink-0 rounded-full border border-white/20 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 lg:inline-block"
        >
          دخول
        </button>

        <MobileNav links={NAV_LINKS} />
      </div>
    </header>
  );
}
