"use client";

import Link from "next/link";
import { useId, useState } from "react";

interface NavLink {
  href: string;
  label: string;
}

/**
 * قائمة تنقل للموبايل فقط — مكوّن عميل صغير مسؤول حصريًا عن فتح/إغلاق
 * القائمة (useState + aria-expanded حقيقي)، بلا أي منطق آخر. لا يستدعي أي
 * API ولا يحتاج أي بيانات إضافية.
 */
export function MobileNav({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "إغلاق قائمة التنقل" : "فتح قائمة التنقل"}
        className="flex h-10 w-10 items-center justify-center rounded-md text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
      >
        {open ? (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {open && (
        <div
          id={panelId}
          className="absolute inset-x-0 top-full border-t border-white/10 bg-[#0a2540] px-4 py-4 shadow-lg"
        >
          <nav aria-label="التنقل الرئيسي (موبايل)" className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2.5 text-base font-medium text-slate-100 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <form action="/transactions" method="GET" role="search" className="mt-4">
            <label htmlFor="mobile-search" className="sr-only">
              ابحث عن معاملة
            </label>
            <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5">
              <svg aria-hidden="true" className="h-4 w-4 shrink-0 text-zinc-400" viewBox="0 0 20 20" fill="none">
                <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.8" />
                <path d="M17 17l-4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <input
                id="mobile-search"
                name="q"
                type="search"
                placeholder="ابحث عن معاملة..."
                className="w-full bg-transparent text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none"
              />
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
