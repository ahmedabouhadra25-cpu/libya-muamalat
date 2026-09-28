/**
 * علم ليبيا كعنصر بصري وطني زخرفي فقط (مسموح صريحًا) — SVG واحد ثابت
 * (data URI، بلا أي ملف/طلب شبكة خارجي) مقسَّم بصريًا إلى عدة شرائح رفيعة،
 * كل شريحة تتحرك بـCSS transform فقط (rotateY/skewY، نفس keyframes
 * .animate-flag-wave في globals.css) بتأخير زمني متتابع بينها — هذا ما
 * يعطي إحساس "رفرفة قماش" حقيقية بدل دورانٍ واحد صلب، بلا فيديو أو GIF أو
 * مكتبة animation أو صورة خارجية. الحركة تتوقف تلقائيًا مع
 * prefers-reduced-motion (مُعرَّفة في globals.css، لا هنا).
 */

const FLAG_SVG_MARKUP =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600">' +
  '<rect width="900" height="200" fill="#CE1126"/>' +
  '<rect y="200" width="900" height="200" fill="#000000"/>' +
  '<rect y="400" width="900" height="200" fill="#239E46"/>' +
  '<circle cx="430" cy="300" r="88" fill="#ffffff"/>' +
  '<circle cx="462" cy="300" r="76" fill="#000000"/>' +
  '<polygon fill="#ffffff" points="0,-38 11.2,-11.7 39.9,-11.7 16.3,4.5 26,32.6 0,14.5 -26,32.6 -16.3,4.5 -39.9,-11.7 -11.2,-11.7" transform="translate(552,300)"/>' +
  "</svg>";

const FLAG_BACKGROUND_IMAGE = `url("data:image/svg+xml,${encodeURIComponent(FLAG_SVG_MARKUP)}")`;

const SLICE_COUNT = 6;
const SLICES = Array.from({ length: SLICE_COUNT }, (_, i) => i);

export function LibyanFlag({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      {/* عمود العلم — جهة ثابتة فعليًا (يمين)، بصرف النظر عن اتجاه الصفحة. */}
      <div className="absolute right-0 top-0 h-full w-1 rounded-full bg-zinc-300/70" aria-hidden="true" />

      {/*
       * dir="ltr" هنا مقصودة: ترتيب الشرائح يمثّل صورة ثابتة فعليًا (العلم)،
       * لا نصًا، فيجب أن يبقى ترتيبها البصري كما رُسمت بصرف النظر عن اتجاه
       * الصفحة (rtl) — تمامًا كصورة عادية لا تُعكَس.
       */}
      <div
        dir="ltr"
        role="img"
        aria-label="علم ليبيا"
        className="flex overflow-hidden rounded-sm shadow-lg"
        style={{ aspectRatio: "3 / 2", perspective: "700px" }}
      >
        {SLICES.map((i) => (
          <div
            key={i}
            className="animate-flag-wave h-full flex-1"
            style={{
              backgroundImage: FLAG_BACKGROUND_IMAGE,
              backgroundRepeat: "no-repeat",
              backgroundSize: `${SLICE_COUNT * 100}% 100%`,
              backgroundPositionX: `${(i / (SLICE_COUNT - 1)) * 100}%`,
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
