"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  NEWS_TICKER_CLIENT_POLL_MS,
  NEWS_TICKER_MAX_DURATION_SECONDS,
  NEWS_TICKER_MIN_DURATION_SECONDS,
  NEWS_TICKER_PIXELS_PER_SECOND,
} from "@/lib/news/config";
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
 * يقيس عرض المحتوى الحقيقي المُصيَّر (نصف عرض المسار المُضاعَف = دورة واحدة
 * كاملة) ويحسب مدة الحركة بحيث تبقى سرعة القراءة (بكسل/ثانية) ثابتة تقريبًا
 * بصرف النظر عن عدد/طول العناوين — بدل مدة ثابتة تجعل الأخبار الطويلة
 * سريعة الحركة وغير مقروءة. يُعاد الحساب عند تغيّر المحتوى أو حجم النافذة.
 */
function useAutoDuration(itemCount: number): [React.RefObject<HTMLDivElement | null>, number] {
  const ref = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState(NEWS_TICKER_MIN_DURATION_SECONDS);

  const recompute = useCallback(() => {
    const track = ref.current;
    if (!track) return;
    const singleSetWidth = track.scrollWidth / 2;
    if (singleSetWidth <= 0) return;
    const seconds = singleSetWidth / NEWS_TICKER_PIXELS_PER_SECOND;
    setDuration(
      Math.min(NEWS_TICKER_MAX_DURATION_SECONDS, Math.max(NEWS_TICKER_MIN_DURATION_SECONDS, seconds))
    );
  }, []);

  useEffect(() => {
    recompute();
    const track = ref.current;
    if (!track || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(recompute);
    observer.observe(track);
    return () => observer.disconnect();
    // itemCount يُدرَج عمدًا لإعادة الحساب عند تغيّر عدد/محتوى العناوين، حتى لو ظل عرض العنصر نفسه غير متغيّر لحظيًا.
  }, [recompute, itemCount]);

  return [ref, duration];
}

/**
 * شريط أخبار متحرك باستمرار (يمين → يسار، RTL حقيقي) بأسلوب شرائط الأخبار
 * التلفزيونية: عناوين حقيقية من src/lib/news/* فقط (لا بيانات وهمية)، حلقة
 * لا نهائية سلسة بلا فراغ أو قفزة عند الرجوع للعنوان الأول، وسرعة تتكيّف مع
 * طول المحتوى الفعلي. معزول تمامًا: كل CSS بأسماء بادئة libya-news-ticker-،
 * وكل منطق الجلب في وحدة مستقلة لا تلمس أي ملف آخر من المنصة. لا JavaScript
 * لتحريك الشريط نفسه (CSS فقط)؛ JS يُستخدَم فقط لجلب البيانات وقياس عرضها.
 */
export function NewsTicker() {
  const [items, setItems] = useState<NewsItem[] | null>(null);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

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
      } finally {
        if (!cancelled) setHasLoadedOnce(true);
      }
    }

    load();
    const interval = setInterval(load, NEWS_TICKER_CLIENT_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const loopedItems = items ? [...items, ...items] : [];
  const loopedRates = exchangeRates.length > 0 ? [...exchangeRates, ...exchangeRates] : [];
  const [newsTrackRef, newsDuration] = useAutoDuration(items?.length ?? 0);
  const [ratesTrackRef, ratesDuration] = useAutoDuration(exchangeRates.length);

  // لا شيء بعد أول محاولة جلب (حالة تحميل أولى قصيرة) — لا نعرض شريطًا فارغًا لحظيًا.
  if (!hasLoadedOnce && !items) return null;

  const hasNews = items !== null && items.length > 0;

  return (
    <div dir="rtl" className="libya-news-ticker flex flex-col bg-[#0a2540] text-white">
      <style>{`
        .libya-news-ticker-viewport { overflow: hidden; position: relative; }
        .libya-news-ticker-track {
          display: flex;
          width: max-content;
          animation: libya-news-ticker-scroll var(--libya-news-ticker-duration, 45s) linear infinite;
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
          أخبار ليبيا <span className="hidden sm:inline">| آخر الأخبار</span>
        </span>

        {hasNews ? (
          <div className="libya-news-ticker-viewport min-w-0 flex-1">
            <div
              ref={newsTrackRef}
              className="libya-news-ticker-track"
              style={{ "--libya-news-ticker-duration": `${newsDuration}s` } as React.CSSProperties}
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
        ) : (
          <div className="flex min-w-0 flex-1 items-center px-4 py-1.5 text-xs text-slate-400 sm:text-sm">
            الأخبار غير متاحة حاليًا
          </div>
        )}
      </div>

      {loopedRates.length > 0 && (
        <div className="flex items-stretch border-t border-white/10">
          <span className="flex shrink-0 items-center gap-1 bg-[#0f172a] px-3 py-1 text-xs font-bold sm:px-4">
            💱 <span className="hidden sm:inline">أسعار الصرف</span>
          </span>
          <div className="libya-news-ticker-viewport min-w-0 flex-1">
            <div
              ref={ratesTrackRef}
              className="libya-news-ticker-track"
              style={{ "--libya-news-ticker-duration": `${ratesDuration}s` } as React.CSSProperties}
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
