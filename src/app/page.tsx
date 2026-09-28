import Link from "next/link";
import { AskAssistant } from "@/components/AskAssistant";
import { CategoryCard } from "@/components/CategoryCard";
import { FeatureSection } from "@/components/FeatureSection";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { categories } from "@/lib/categories";

const steps = [
  {
    title: "اكتب معاملتك",
    description: "صف المعاملة اللي تبي تديرها بأسلوبك العادي.",
  },
  {
    title: "نوضحلك الإجراءات",
    description: "نعرض لك الخطوات والمستندات والجهة المختصة.",
  },
  {
    title: "تختار",
    description: "تديرها بنفسك أو تطلب مساعدة من مقدم خدمة مستقل.",
  },
];

export default function Home() {
  return (
    <>
      <Header />

      <main className="flex-1">
        <section className="bg-gradient-to-b from-teal-50 to-white px-4 py-16 text-center sm:py-24">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-3xl font-extrabold text-zinc-900 sm:text-5xl">
              مساعد معاملات ليبيا
            </h1>
            <p className="mt-4 text-lg text-zinc-600">
              اكتب المعاملة بطريقتك، ونساعدك تفهم الخطوات والمستندات والجهة
              المختصة.
            </p>
            <div className="mt-8">
              <AskAssistant />
            </div>
            <p className="mt-4 text-sm text-zinc-500">
              أو{" "}
              <Link
                href="/transactions"
                className="rounded-md font-medium text-teal-700 hover:text-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
              >
                تصفّح كل المعاملات
              </Link>
            </p>
          </div>
        </section>

        <FeatureSection id="categories" title="شن تقدر تدير؟">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </FeatureSection>

        <FeatureSection
          id="how-it-works"
          title="كيف يخدم؟"
          className="bg-zinc-50"
        >
          <ol className="grid gap-6 sm:grid-cols-3">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="rounded-2xl border border-zinc-200 bg-white p-6"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-700 text-sm font-bold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-4 font-semibold text-zinc-900">
                  {step.title}
                </h3>
                <p className="mt-1 text-sm text-zinc-600">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </FeatureSection>

        <FeatureSection title="تبي حد يساعدك في إنجاز المعاملة؟">
          <div className="rounded-2xl border border-dashed border-teal-300 bg-teal-50 p-6 sm:p-8">
            <p className="text-zinc-700">
              لاحقًا، تقدر تطلب مساعدة من مقدمي خدمات مستقلين لمساعدتك في
              متابعة الإجراءات والحضور عند الحاجة.
            </p>
            <span className="mt-4 inline-block rounded-full bg-white px-3 py-1 text-xs font-medium text-teal-700 ring-1 ring-teal-200">
              ميزة قادمة قريبًا
            </span>
          </div>
        </FeatureSection>

        <FeatureSection id="about" title="عن خدمات ليبيا" className="bg-zinc-50">
          <div className="mx-auto max-w-2xl space-y-4 text-center text-zinc-700 sm:text-right">
            <p>
              خدمات ليبيا منصة رقمية مستقلة تهدف إلى تسهيل وصول المواطن إلى
              المعلومات والإجراءات المتعلقة بالخدمات والمعاملات الحكومية، من
              خلال جمع وتنظيم المعلومات المنشورة عبر المصادر والمنصات
              الحكومية المختلفة وتقديمها في مكان واحد بطريقة واضحة وسهلة
              الاستخدام.
            </p>
            <p>
              تهدف المنصة إلى تقليل الوقت والجهد الذي يحتاجه المواطن للبحث
              عن المعلومات، مع المحافظة على الإشارة إلى المصادر الرسمية
              وإتاحة الوصول إليها متى كانت متوفرة.
            </p>
          </div>
        </FeatureSection>
      </main>

      <Footer />
    </>
  );
}
