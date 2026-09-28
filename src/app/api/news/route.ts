import { NextResponse } from "next/server";
import { getLibyaNews } from "@/lib/news/fetchLibyaNews";
import { getExchangeRates } from "@/lib/news/exchangeRates";
import { NEWS_MIN_ITEMS_TO_SHOW } from "@/lib/news/config";

/**
 * GET /api/news — نقطة معزولة تمامًا عن /api/ask وطبقة AI بالكامل: لا
 * تستورد ولا تُستورَد من src/lib/ai/* بأي شكل. الغرض الوحيد: تمرير أخبار
 * مُنظَّفة (نص خالص، روابط مُتحقَّق منها) وأسعار صرف (إن توفّرت) من الكاش
 * الخادمي إلى شريط الأخبار في الواجهة، دون أن يتصل المتصفح مباشرة بأي مصدر
 * خارجي (لا مشاكل CORS، ولا كشف رابط المصدر أو تفاصيله للعميل بلا داعٍ).
 */
export const runtime = "nodejs";

export async function GET() {
  const items = getLibyaNews();
  const exchangeRates = await getExchangeRates();

  if (items.length < NEWS_MIN_ITEMS_TO_SHOW) {
    return NextResponse.json({ items: [], exchangeRates: [] }, { status: 200 });
  }

  return NextResponse.json({ items, exchangeRates }, { status: 200 });
}
