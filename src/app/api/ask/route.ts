import { NextRequest, NextResponse } from "next/server";
import { getVerificationWarning } from "@/lib/ai/guardrails";
import { answerQuestion, type PipelineOutcome } from "@/lib/ai/provider";
import { getAiProvider } from "@/lib/ai/providers";

/**
 * POST /api/ask — نقطة الدخول الوحيدة للمساعد. server-side فقط (Node
 * runtime، مطلوب لـOpenAI SDK)، ولا تُعرَّف أي طريقة أخرى (GET/PUT/...)
 * عمدًا: Next.js يُعيد 405 تلقائيًا مع Allow header لأي طريقة غير مُصدَّرة
 * من route.js — هذا سلوك Next.js الافتراضي، لا حاجة لتنفيذه يدويًا.
 *
 * التدفق هنا حرفيًا: input validation → getAiProvider() → answerQuestion()
 * (من src/lib/ai/provider.ts) → JSON response. لا يُعاد بناء منطق
 * candidates/context/guardrails هنا؛ answerQuestion هو المسار الوحيد،
 * وبداخله (عبر generateValidatedAnswer) تُطبَّق guardrails دائمًا قبل أي رد.
 */
export const runtime = "nodejs"; // القيمة الافتراضية أصلًا؛ مذكورة صريحًا للوضوح فقط.

const MAX_QUESTION_LENGTH = 1000;
const MAX_BODY_BYTES = 20_000;

type ValidationResult =
  | { ok: true; question: string }
  | { ok: false; message: string };

function isBodyTooLarge(request: NextRequest): boolean {
  const contentLength = request.headers.get("content-length");
  if (!contentLength) return false;
  const size = Number(contentLength);
  return Number.isFinite(size) && size > MAX_BODY_BYTES;
}

/** يقبل فقط { question: string } غير فارغ (بعد trim) وبحد أقصى للطول. */
function validateQuestionInput(body: unknown): ValidationResult {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, message: "الطلب غير صالح: يجب إرسال JSON يحتوي حقل question." };
  }

  const raw = (body as Record<string, unknown>).question;
  if (typeof raw !== "string") {
    return { ok: false, message: "حقل question مطلوب ويجب أن يكون نصًا." };
  }

  const question = raw.trim();
  if (question.length === 0) {
    return { ok: false, message: "لا يمكن أن يكون السؤال فارغًا." };
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    return {
      ok: false,
      message: `السؤال طويل جدًا (الحد الأقصى ${MAX_QUESTION_LENGTH} حرف).`,
    };
  }

  return { ok: true, question };
}

/**
 * يحوّل PipelineOutcome إلى الشكل الوحيد المسموح بالخروج للعميل: لا context
 * خام، لا system prompt، لا استجابة OpenAI الخام — فقط ما يلزم لعرض النتيجة.
 * verificationStatus/verificationWarning يُستمدّان هنا من
 * context.transaction.verificationStatus مباشرة (لا من AI إطلاقًا).
 */
function buildResponseBody(outcome: PipelineOutcome) {
  switch (outcome.kind) {
    case "needs_clarification":
      return {
        status: "needs_clarification" as const,
        message: "السؤال يحتاج توضيحًا: هل تقصد إحدى المعاملات التالية؟",
        candidates: outcome.intent.candidates.map((candidate) => ({
          slug: candidate.slug,
          reason: candidate.reason,
        })),
      };

    case "not_found":
      return {
        status: "not_found" as const,
        message: "ما لقيتش معاملة مطابقة بشكل موثوق.",
      };

    case "answered": {
      const { transaction } = outcome.context;
      return {
        status: "answered" as const,
        transaction: { slug: transaction.slug, title: transaction.title },
        verificationStatus: transaction.verificationStatus,
        verificationWarning: getVerificationWarning(transaction.verificationStatus),
        answer: outcome.answer,
      };
    }
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (isBodyTooLarge(request)) {
    return NextResponse.json(
      { status: "invalid_input", message: "حجم الطلب أكبر من المسموح به." },
      { status: 400 }
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { status: "invalid_input", message: "تعذّر قراءة الطلب: يجب إرسال JSON صالح." },
      { status: 400 }
    );
  }

  const validation = validateQuestionInput(rawBody);
  if (!validation.ok) {
    return NextResponse.json(
      { status: "invalid_input", message: validation.message },
      { status: 400 }
    );
  }

  // نقطة توسعة مستقبلية لـrate limiting فعلي (مثلًا عبر Redis/DB) تُضاف هنا،
  // قبل استدعاء getAiProvider أدناه. لا يوجد حاليًا أي rate limiter، حقيقي
  // أو صوري — هذا تعليق توضيحي فقط، وليس دالة تظاهرية.

  try {
    const provider = getAiProvider();
    const outcome = await answerQuestion(provider, validation.question);
    return NextResponse.json(buildResponseBody(outcome), { status: 200 });
  } catch {
    // لا نُعيد أي تفصيل داخلي (لا رسالة الخطأ الحقيقية، لا stack trace، لا
    // اسم ملف، لا أي إشارة لمفتاح API) — رسالة عربية عامة وآمنة فقط. يغطي
    // هذا: AI_PROVIDER غير معروف، OPENAI_API_KEY غائب وقت الاستخدام، وأي
    // خطأ شبكة/provider آخر.
    return NextResponse.json(
      { status: "server_error", message: "تعذّر معالجة السؤال حاليًا. حاول مرة أخرى لاحقًا." },
      { status: 500 }
    );
  }
}
