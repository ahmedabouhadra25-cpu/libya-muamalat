import Link from "next/link";
import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "إخلاء المسؤولية — خدمات ليبيا",
  description: "خدمات ليبيا منصة رقمية مستقلة وليست جهة حكومية.",
};

export default function DisclaimerPage() {
  return (
    <>
      <Header />

      <main className="flex-1 bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">إخلاء المسؤولية</h1>

          <div
            role="note"
            className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm font-medium text-amber-900"
          >
            خدمات ليبيا منصة رقمية مستقلة، وليست جهة حكومية أو وزارة أو
            مصلحة أو هيئة رسمية.
          </div>

          <div className="mt-6 space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 leading-relaxed text-zinc-700 shadow-sm sm:p-8">
            <p>
              خدمات ليبيا منصة رقمية مستقلة وليست جهة حكومية، ولا تمثل أي
              وزارة أو مصلحة أو هيئة حكومية، ولا تدّعي إصدار أو اعتماد أي
              معاملة أو مستند رسمي.
            </p>
            <p>
              تقوم المنصة بجمع وتنظيم وعرض المعلومات المنشورة والمتاحة من
              المصادر والمنصات الحكومية بهدف تسهيل الوصول إليها وفهمها. وقد
              تتغير الإجراءات أو المتطلبات أو الرسوم أو المواعيد من قبل
              الجهات المختصة، لذلك يُنصح المستخدم بالرجوع إلى المصدر الرسمي
              المعني قبل اتخاذ أي إجراء أو الاعتماد على المعلومات المنشورة.
            </p>
            <p>
              يتم عرض المصادر الرسمية للمعلومات متى كانت متاحة، وتوضح
              المنصة حالة التحقق من المعلومات بحسب المصادر المتوفرة لديها.
            </p>
          </div>

          <div className="mt-8">
            <Link
              href="/"
              className="rounded-md text-sm font-medium text-teal-700 hover:text-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
            >
              ← العودة إلى الصفحة الرئيسية
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
