import { mockAiProvider } from "@/lib/ai/providers/mock";
import { openaiProvider } from "@/lib/ai/providers/openai";
import type { AiProvider } from "@/lib/ai/types";

/**
 * يُغلِّف provider أساسي بـMock كاحتياطي محلي فوري: أي استثناء يرميه
 * primary (429، quota exhausted، rate limit، خطأ شبكة، انتهاء مهلة — أيًّا
 * كان السبب، بلا تمييز، لأن كل هذه الحالات يجب أن تُعامَل بنفس الطريقة)
 * يُبتلَع هنا فورًا، بلا أي إعادة محاولة ضد primary نفسه، وتُستدعى نفس
 * الدالة المقابلة على fallback بدلًا منه مباشرة.
 *
 * لا منطق AI جديد هنا إطلاقًا — فقط تفويض بين تطبيقين موجودين مسبقًا من
 * نوع AiProvider. الناتج في الحالتين يمر لاحقًا عبر نفس المسار الإلزامي
 * الموجود أصلًا في provider.ts (generateValidatedAnswer → guardrails)، دون
 * أي حاجة لتعديل ذلك الملف.
 */
export function createResilientProvider(primary: AiProvider, fallback: AiProvider): AiProvider {
  return {
    name: primary.name,
    async interpretIntent(input) {
      try {
        return await primary.interpretIntent(input);
      } catch {
        return fallback.interpretIntent(input);
      }
    },
    async generateGroundedAnswer(input) {
      try {
        return await primary.generateGroundedAnswer(input);
      } catch {
        return fallback.generateGroundedAnswer(input);
      }
    },
  };
}

/**
 * نقطة الاختيار الوحيدة لـprovider فعلي في التطبيق، عبر متغيّر البيئة
 * AI_PROVIDER (server-side فقط، بلا NEXT_PUBLIC_، فلا يصل أبدًا لحزمة
 * المتصفح). القيم المدعومة حاليًا:
 * - غير مضبوط، أو "mock" → Mock provider (الافتراضي الآمن، بلا شبكة).
 * - "openai" → OpenAI provider مُغلَّف بـcreateResilientProvider مع Mock
 *   كاحتياطي محلي: أي فشل من OpenAI (تعطل، نفاد حصة، rate limit، شبكة،
 *   مهلة) ينتقل تلقائيًا لنفس Mock provider الآمن بدل إرجاع خطأ للمستخدم.
 *   قراءة/فحص OPENAI_API_KEY تحدث فقط عند استدعاء
 *   interpretIntent/generateGroundedAnswer فعليًا، لا هنا وليس عند تحميل
 *   الموديول — فاختيار "openai" لا يمكن أن يُسقط build أو dev حتى لو كان
 *   المفتاح غائبًا.
 * - أي قيمة أخرى → خطأ واضح server-side (لا يكشف أي سر) بدل fallback صامت،
 *   لتفادي إخفاء خطأ ضبط بيئة حقيقي.
 *
 * لاحقًا عند إضافة providers/anthropic.ts أو providers/gemini.ts، هذا هو
 * الملف الوحيد الذي يحتاج تعديلًا لدعم قيمة جديدة؛ بقية التطبيق
 * (provider.ts وما يستدعيه) يتعامل فقط مع AiProvider عبر getAiProvider()،
 * دون معرفة أي تفاصيل عن أي مزوّد بعينه.
 */
export function getAiProvider(): AiProvider {
  const selected = process.env.AI_PROVIDER?.trim().toLowerCase();

  if (!selected || selected === "mock") {
    return mockAiProvider;
  }

  if (selected === "openai") {
    return createResilientProvider(openaiProvider, mockAiProvider);
  }

  throw new Error(
    `AI_PROVIDER غير معروف: "${selected}". القيم المدعومة حاليًا: "mock" أو "openai".`
  );
}
