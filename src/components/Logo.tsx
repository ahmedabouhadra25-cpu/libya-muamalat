import Link from "next/link";

/**
 * شعار مستقل للمنصة فقط — تصميم هندسي عام (درع + علامة صحّة) لا يمثّل ولا
 * يقتبس أي شعار حكومي رسمي (لا نسر، لا شارة وزارة/مصلحة/هيئة). نقطتا اللون
 * الأحمر/الأخضر لمسة وطنية خفيفة مستوحاة من العلم فقط، لا أكثر.
 */
export function Logo({ withWordmark = true }: { withWordmark?: boolean }) {
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
    >
      <svg
        viewBox="0 0 40 40"
        className="h-9 w-9 shrink-0"
        role="img"
        aria-label="شعار خدمات ليبيا"
      >
        <defs>
          <linearGradient id="logo-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0f3a63" />
            <stop offset="100%" stopColor="#0a2540" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="10" fill="url(#logo-bg)" />
        <path
          d="M20 8 L29 11.5 V19 C29 25 25 28.5 20 31 C15 28.5 11 25 11 19 V11.5 L20 8 Z"
          fill="white"
          opacity="0.95"
        />
        <path
          d="M15.5 19.5 L18.5 22.5 L24.5 15.5"
          fill="none"
          stroke="#0a2540"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="10" cy="9" r="1.6" fill="#CE1126" />
        <circle cx="30" cy="31" r="1.6" fill="#239E46" />
      </svg>

      {withWordmark && (
        <span className="flex flex-col leading-tight">
          <span className="text-base font-bold text-white sm:text-lg">خدمات ليبيا</span>
          {/* توضيح صريح أن المنصة مستقلة وليست جهة حكومية — مطلوب بصريًا. */}
          <span className="text-[10px] font-medium text-slate-300 sm:text-xs">
            منصة رقمية مستقلة
          </span>
        </span>
      )}
    </Link>
  );
}
