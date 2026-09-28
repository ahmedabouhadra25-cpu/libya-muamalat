import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/Logo";

/**
 * روابط حقيقية فقط (مسارات موجودة فعليًا في المشروع، أو مرساة لقسم حقيقي في
 * الصفحة الرئيسية) — لا صفحات وهمية. لا يوجد رابط لـ"المصادر" لأنه لا توجد
 * صفحة مستقلة لها حاليًا؛ المصادر تُعرَض داخل كل معاملة على حدة.
 */
const FOOTER_LINKS = [
  { href: "/#about", label: "عن المنصة" },
  { href: "/disclaimer", label: "إخلاء المسؤولية" },
  { href: "/transactions", label: "المعاملات" },
  { href: "/branches", label: "الفروع" },
];

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0a2540] text-slate-300">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 text-center sm:grid-cols-2 sm:text-right lg:grid-cols-3">
          {/* هوية المنصة — منصة رقمية مستقلة (يجب أن تبقى الهوية الرئيسية) */}
          <div className="flex flex-col items-center sm:items-start">
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-slate-400">
              منصة رقمية مستقلة لتسهيل الوصول إلى معلومات الخدمات والمعاملات الحكومية.
            </p>
          </div>

          {/* روابط */}
          <div>
            <h2 className="text-sm font-bold text-white">روابط</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="rounded-md text-slate-300 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a2540]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* تنبيه (نص موجود مسبقًا، أُعيد ترتيبه فقط) */}
          <div>
            <h2 className="text-sm font-bold text-white">تنبيه</h2>
            <p className="mt-3 text-sm text-slate-400">
              المعلومات المعروضة تحتاج إلى التحقق من المصادر الرسمية عند توفرها.
            </p>
          </div>
        </div>

        {/*
         * هوية الجهة المطوّرة والمشغّلة — ثانوية بصريًا وأصغر من هوية المنصة
         * أعلاه عمدًا (شعار "خدمات ليبيا" يبقى الهوية الرئيسية). الشعار خلفيته
         * سوداء في الملف الأصلي؛ mix-blend-mode:screen يُذيب الأسود بصريًا مع
         * خلفية الـFooter الداكنة دون تعديل ملف الصورة نفسه.
         */}
        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-slate-400">
          <p>تطوير وتشغيل المنصة</p>
          <div className="mt-2 flex items-center justify-center">
            <Image
              src="/smart-home-logo.png"
              alt="شعار البيت الذكي لتقنية المعلومات"
              width={1280}
              height={434}
              className="h-9 w-auto object-contain [mix-blend-mode:screen] sm:h-10"
            />
          </div>
          <p className="mt-2">لتقنية المعلومات · للأتمتة والأنظمة الذكية</p>
        </div>
      </div>
    </footer>
  );
}
