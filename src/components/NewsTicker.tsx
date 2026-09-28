"use client";

import { useEffect, useState } from "react";
import { NEWS_TICKER_CLIENT_POLL_MS, NEWS_TICKER_SPEED_SECONDS } from "@/lib/news/config";
import type { ExchangeRate, NewsCategory, NewsItem } from "@/lib/news/types";

const CATEGORY_ICON: Record<NewsCategory, string> = {
  general: "📰",
  economic: "📊",
  oil: "🛢️",
};

function itemIcon(item: NewsItem): string {
  return item.isBreaking ? "🔴" : CATEGORY_ICON[item.category];
}

function formatRateValue(rate: ExchangeRate): string {
  if (rate.value === null) return "—";
  return rate.value.toLocaleString("ar-LY", { maximumFractionDigits: 3 });
}

/**
 * تُقارن قائمتين بمفتاح فريد فقط — تمنع setState (وبالتالي إعادة رسم لا داعي
 * لها تقطع حركة الشريط) حين تكون النتيجة الجديدة المجلوبة مطابقة فعليًا لما
 * هو معروض حاليًا.
 */
function sameByKey<T>(a: T[] | null, b: T[], keyOf: (item: T) => string): boolean {
  if (!a || a.length !== b.length) return false;
  return a.every((item, index) => keyOf(item) === keyOf(b[index]));
}

/**
 * شريط أخبار عاجلة + اقتصادية + نفط وطاقة + (عند توفّرها) أسعار صرف — معزول
 * تمامًا: كل CSS بأسماء بادئة libya-news-ticker-، وكل منطق الجلب في وحدة
 * مستقلة (src/lib/news/*) لا تلمس أي ملف آخر من المنصة. لا JavaScript
 * لتحريك الشريط نفسه (CSS فقط)؛ JS يُستخدَم فقط لجلب/تحديث البيانات دوريًا.
 */
export function NewsTicker() {
  const [items, setItems] = useState<NewsItem[] | null>(null);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/news");
        if (!response.ok) return;
        const data: unknown = await response.json();
        if (cancelled || typeof data !== "object" || data === null) return;

        const parsed = data as { items?: unknown; exchangeRates?: unknown };
        if (Array.isArray(parsed.items)) {
          const nextItems = parsed.items as NewsItem[];
          setItems((prev) => (sameByKey(prev, nextItems, (item) => item.id) ? prev : nextItems));
        }
        if (Array.isArray(parsed.exchangeRates)) {
          const nextRates = parsed.exchangeRates as ExchangeRate[];
          setExchangeRates((prev) =>
            sameByKey(prev, nextRates, (rate) => `${rate.currency}:${rate.rateType}:${rate.value}`)
              ? prev
              : nextRates
          );
        }
      } catch {
        // فشل صامت — يبقى آخر محتوى معروض كما هو، بلا أي خطأ ظاهر للمستخدم.
      }
    }

    load();
    const interval = setInterval(load, NEWS_TICKER_CLIENT_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (!items || items.length === 0) return null;
  const loopedItems = [...items, ...items];
  const loopedRates = exchangeRates.length > 0 ? [...exchangeRates, ...exchangeRates] : [];

  return (
    <div dir="rtl" className="libya-news-ticker flex flex-col bg-[#0a2540] text-white">
      <style>{`
        .libya-news-ticker-viewport { overflow: hidden; position: relative; }
        .libya-news-ticker-track {
          display: flex;
          width: max-content;
          animation: libya-news-ticker-scroll var(--libya-news-ticker-duration, 45s) ease-in-out infinite alternate;
        }
        @keyframes libya-news-ticker-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .libya-news-ticker-viewport:hover .libya-news-ticker-track,
        .libya-news-ticker-viewport:focus-within .libya-news-ticker-track {
          animation-play-state: paused;
        }
        @media (prefers-reduced-motion: reduce) {
          .libya-news-ticker-track { animation-play-state: paused; }
        }
      `}</style>

      <div className="flex items-stretch">
        <span className="flex shrink-0 items-center gap-1 bg-[#CE1126] px-3 py-1.5 text-xs font-bold sm:px-4 sm:text-sm">
          عاجل <span className="hidden sm:inline">| آخر الأخبار الليبية</span>
        </span>
        <div className="libya-news-ticker-viewport min-w-0 flex-1">
          <div
            className="libya-news-ticker-track"
            style={{ "--libya-news-ticker-duration": `${NEWS_TICKER_SPEED_SECONDS}s` } as React.CSSProperties}
          >
            {loopedItems.map((item, index) => (
              <a
                key={`${item.id}-${index}`}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="flex shrink-0 items-center gap-2 whitespace-nowrap px-4 py-1.5 text-xs text-slate-100 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 sm:text-sm"
              >
                <span aria-hidden="true">{itemIcon(item)}</span>
                {item.isTripoli && <span aria-hidden="true">📍</span>}
                <span className="font-semibold text-sky-300">{item.source}</span>
                <span>{item.title}</span>
                {item.publishedLabel && <span className="text-slate-400">· {item.publishedLabel}</span>}
                <span aria-hidden="true" className="text-slate-500">•</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {loopedRates.length > 0 && (
        <div className="flex items-stretch border-t border-white/10">
          <span className="flex shrink-0 items-center gap-1 bg-[#0f172a] px-3 py-1 text-xs font-bold sm:px-4">
            💱 <span className="hidden sm:inline">أسعار الصرف</span>
          </span>
          <div className="libya-news-ticker-viewport min-w-0 flex-1">
            <div
              className="libya-news-ticker-track"
              style={{ "--libya-news-ticker-duration": `${NEWS_TICKER_SPEED_SECONDS}s` } as React.CSSProperties}
            >
              {loopedRates.map((rate, index) => (
                <span
                  key={`${rate.currency}-${rate.rateType}-${index}`}
                  className="flex shrink-0 items-center gap-2 whitespace-nowrap px-4 py-1 text-xs text-slate-100 sm:text-sm"
                >
                  <span className="font-semibold text-emerald-300">{rate.currency}</span>
                  <span className="text-slate-400">{rate.rateType === "official" ? "رسمي" : "موازي"}</span>
                  <span>{formatRateValue(rate)}</span>
                  {rate.lastUpdatedLabel && (
                    <span className="text-slate-500">آخر تحديث: {rate.lastUpdatedLabel}</span>
                  )}
                  <span aria-hidden="true" className="text-slate-600">•</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
