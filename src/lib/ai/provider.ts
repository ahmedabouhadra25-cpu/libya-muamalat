import { buildCandidateIndex } from "@/lib/ai/candidates";
import { buildTransactionContext } from "@/lib/ai/context";
import { validateGroundedAnswer } from "@/lib/ai/guardrails";
import { findStrongDeterministicMatch } from "@/lib/ai/intent-matching";
import type {
  AiProvider,
  GenerateAnswerInput,
  GroundedAnswer,
  IntentResult,
  TransactionContext,
} from "@/lib/ai/types";

/**
 * طبقة الـabstraction الوحيدة للتعامل مع أي AI provider. هذا الملف لا يعرف
 * أي تفصيل عن OpenAI/Anthropic/Gemini — فقط عقد AiProvider من
 * src/lib/ai/types.ts (لا يُكرَّر هنا كـtype جديد). اختيار الـprovider
 * الفعلي (Mock حاليًا) هو مسؤولية src/lib/ai/providers/index.ts فقط.
 *
 * الـprovider (أي تطبيق حالي أو مستقبلي) لا صلاحية له بنيويًا على
 * verificationStatus أو بيانات المعاملة/المصادر/الفروع الأصلية: هو يستقبل
 * نسخة معزولة من TransactionContext (انظر generateValidatedAnswer أدناه)
 * ويُعيد GroundedAnswer فقط — نوع لا يحتوي بنيويًا أي حقل verificationStatus
 * أو sourceLinks (انظر types.ts). الـguardrails طبقة مستقلة تُطبَّق هنا
 * دائمًا بعد استدعاء المزوّد، وليست جزءًا من تطبيق المزوّد نفسه.
 */

export type { AiProvider };

/**
 * يستدعي provider.generateGroundedAnswer ثم يُمرّر الناتج فورًا عبر
 * validateGroundedAnswer قبل إعادته. لا مكان آخر في التطبيق يجب أن يستخدم
 * ناتج المزوّد الخام مباشرة دون المرور من هنا.
 *
 * يُمرَّر إلى المزوّد نسخة معزولة (structuredClone) من context، لا المرجع
 * الأصلي — فحتى لو حاول تطبيق مزوّد ما (خطأً أو عمدًا) تعديل context الذي
 * استلمه، لن يؤثر ذلك على context الأصلي الذي يملكه المستدعي، والتحقق
 * النهائي في validateGroundedAnswer يتم دائمًا مقابل context الأصلي الحقيقي.
 */
export async function generateValidatedAnswer(
  provider: AiProvider,
  input: GenerateAnswerInput
): Promise<GroundedAnswer> {
  const isolatedContext = structuredClone(input.context);
  const rawAnswer = await provider.generateGroundedAnswer({
    question: input.question,
    context: isolatedContext,
  });
  return validateGroundedAnswer(rawAnswer, input.context);
}

/**
 * نتيجة التدفق الكامل. ليست تكرارًا لأي نوع موجود — تجمع فقط مخرجات كل
 * مرحلة لتمييز الحالات الثلاث الممكنة (احتياج توضيح، معاملة غير موجودة،
 * إجابة نهائية) عند استهلاكها لاحقًا من واجهة أو Route Handler مستقبلي —
 * لم يُنشأ أي منهما في هذه الخطوة.
 */
export type PipelineOutcome =
  | { kind: "needs_clarification"; intent: IntentResult }
  | { kind: "not_found"; intent: IntentResult }
  | {
      kind: "answered";
      intent: IntentResult;
      context: TransactionContext;
      answer: GroundedAnswer;
    };

/**
 * التدفق المفاهيمي الكامل (Hybrid Intent: deterministic-first → AI fallback):
 * findStrongDeterministicMatch() أولًا (بلا أي استدعاء شبكة/AI) — إن وُجد
 * تطابق قوي وواضح (عبارة مركّبة محددة أو عنوان كامل، لا كلمة عامة بمفردها)
 * يُستخدَم مباشرة دون استدعاء provider.interpretIntent() إطلاقًا. فقط عند
 * غياب تطابق حتمي قوي (بما فيها كل الحالات الغامضة أو المعتمدة على كلمة
 * عامة وحدها) يُستدعى provider.interpretIntent() (Mock أو OpenAI بحسب
 * AI_PROVIDER) كـfallback. بعدها: استرجاع حتمي بالكود للسياق (context.ts،
 * بلا AI) → provider.generateGroundedAnswer() → validateGroundedAnswer()
 * (عبر generateValidatedAnswer) → نتيجة نهائية. هذا يقلّل استدعاءات AI فعليًا
 * مع الحفاظ على نفس درجة الأمان (IntentResult نفسه، نفس قيود slug/clarification).
 */
export async function answerQuestion(
  provider: AiProvider,
  question: string
): Promise<PipelineOutcome> {
  const candidateIndex = buildCandidateIndex();
  const intent =
    findStrongDeterministicMatch(question, candidateIndex) ??
    (await provider.interpretIntent({ question, candidateIndex }));

  if (intent.needsClarification || intent.slug === null) {
    return { kind: "needs_clarification", intent };
  }

  const context = buildTransactionContext(intent.slug);
  if (context === null) {
    return { kind: "not_found", intent };
  }

  const answer = await generateValidatedAnswer(provider, { question, context });
  return { kind: "answered", intent, context, answer };
}
