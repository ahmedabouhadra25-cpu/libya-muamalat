import OpenAI from "openai";
import type {
  AiProvider,
  FieldStatus,
  GenerateAnswerInput,
  GroundedAnswer,
  GroundedField,
  IntentCandidate,
  IntentResult,
  InterpretIntentInput,
} from "@/lib/ai/types";

/**
 * تطبيق حقيقي لـAiProvider باستخدام OpenAI الرسمي (SDK: "openai", Responses
 * API). هذا الملف server-side فقط — يجب ألا يُستورد من أي مكوّن عميل
 * ("use client") أو أي كود يُحزَم للمتصفح: OPENAI_API_KEY بلا بادئة
 * NEXT_PUBLIC_ فلن يصل أصلًا إلى browser bundle (ضمان Next.js نفسه)، وهذا
 * الملف لا يُستورد حاليًا من أي مكان (لا UI ولا Route Handler في هذه الخطوة).
 *
 * الاختيار: gpt-6-luna — موصوف في وثائق OpenAI الرسمية الحالية بأنه الأنسب
 * لـ"cost-sensitive, high-volume workloads" (تصنيف نية + توليد إجابة قصيرة
 * مُقيَّدة بسياق محدد)، بخلاف gpt-6-astra (تعقيد/برمجة) أو gpt-6-sol (توازن
 * أعلى تكلفة). لا حاجة لأقوى موديل لمهمتين محدودتين ومحكومتين ببنية صارمة.
 *
 * لا يُنشأ عميل OpenAI عند تحميل هذا الملف (لا new OpenAI() على مستوى
 * الموديول) — فقط عند استدعاء interpretIntent/generateGroundedAnswer فعليًا،
 * حتى لا يتعطل build أو حتى استيراد الملف عند غياب OPENAI_API_KEY.
 */

const MODEL = "gpt-6-luna";

/**
 * أقصى وقت انتظار لطلب واحد قبل اعتباره فاشلًا (ميلي ثانية). موجودة هنا كي
 * يفشل استدعاء OpenAI بسرعة عند تعليقه بدل انتظار المهلة الافتراضية
 * الطويلة للـSDK — الفشل السريع هو ما يُتيح للـresilient provider
 * (providers/index.ts) الانتقال لـMock فورًا دون تعليق طلب المستخدم.
 */
const OPENAI_TIMEOUT_MS = 8000;

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY غير مُعرَّف في متغيرات البيئة. لا يمكن استخدام openai provider بدونه (لن يُكشف أي جزء من المفتاح في هذه الرسالة)."
    );
  }
  // maxRetries: 0 — أي فشل (429/quota/شبكة/مهلة) يجب أن يصل فورًا إلى
  // resilient provider في providers/index.ts لينتقل لـMock مباشرة، بدل أن
  // يستهلك SDK إعادة محاولات تلقائية ضد حصة OpenAI نفسها أولًا.
  return new OpenAI({ apiKey, timeout: OPENAI_TIMEOUT_MS, maxRetries: 0 });
}

const ALLOWED_FIELD_STATUSES: readonly FieldStatus[] = [
  "confirmed",
  "not_documented",
  "not_applicable",
];

// ---------- interpretIntent ----------

function buildIntentSchema(knownSlugs: string[]) {
  return {
    type: "object",
    properties: {
      slug: { type: ["string", "null"], enum: [...knownSlugs, null] },
      candidates: {
        type: "array",
        items: {
          type: "object",
          properties: {
            slug: { type: "string", enum: knownSlugs },
            reason: { type: "string" },
          },
          required: ["slug", "reason"],
          additionalProperties: false,
        },
      },
      needsClarification: { type: "boolean" },
      confidence: { type: "number" },
      reason: { type: "string" },
    },
    required: ["slug", "candidates", "needsClarification", "confidence", "reason"],
    additionalProperties: false,
  } as const;
}

const INTENT_SYSTEM_PROMPT = [
  "أنت طبقة تصنيف فقط ضمن مشروع معاملات حكومية في طرابلس، ليبيا.",
  "لديك فقط قائمة مرشحين مختصرة (slug/title/keywords/category) — بلا أي رسوم أو مستندات أو خطوات أو فروع أو مصادر.",
  "مهمتك الوحيدة: تحديد أي معاملة (slug) من هذه القائمة يقصدها سؤال المستخدم، أو الإفادة بعدم وجود تطابق كافٍ.",
  "slug يجب أن يكون null أو أحد الـslugs الموجودة حرفيًا في القائمة المرسلة إليك فقط. لا تخترع slug جديدًا مهما بدا منطقيًا.",
  "لا تحاول الإجابة عن محتوى المعاملة نفسها هنا (لا رسوم، لا مستندات، لا خطوات) — هذه فقط خطوة تصنيف.",
].join("\n");

/**
 * يفحص ناتج JSON من المزوّد ويحوّله إلى IntentResult صالح دائمًا. أي slug
 * غير موجود ضمن knownSlugs (حتى لو مرّ خطأً عبر enum المخطط) يتحول حتميًا
 * إلى slug: null وneedsClarification: true — لا يُسمح لأي slug مخترَع
 * بالمرور مهما كان شكل استجابة المزوّد.
 */
function parseIntentJson(rawText: string, knownSlugs: string[]): IntentResult {
  const fallback: IntentResult = {
    slug: null,
    candidates: [],
    needsClarification: true,
    confidence: 0,
    reason: "تعذّر فهم استجابة المزوّد أو كانت غير صالحة.",
  };

  let data: unknown;
  try {
    data = JSON.parse(rawText);
  } catch {
    return fallback;
  }
  if (typeof data !== "object" || data === null) return fallback;

  const obj = data as Record<string, unknown>;
  const slugsSet = new Set(knownSlugs);

  const rawSlug = typeof obj.slug === "string" ? obj.slug : null;
  const slugIsKnown = rawSlug !== null && slugsSet.has(rawSlug);
  const slug = slugIsKnown ? rawSlug : null;
  const rejectedUnknownSlug = rawSlug !== null && !slugIsKnown;

  const rawCandidates = Array.isArray(obj.candidates) ? obj.candidates : [];
  const candidates: IntentCandidate[] = rawCandidates
    .filter((c): c is Record<string, unknown> => typeof c === "object" && c !== null)
    .map((c) => ({
      slug: typeof c.slug === "string" ? c.slug : "",
      reason: typeof c.reason === "string" ? c.reason : "",
    }))
    .filter((c) => slugsSet.has(c.slug));

  if (rejectedUnknownSlug) {
    return {
      slug: null,
      candidates,
      needsClarification: true,
      confidence: 0,
      reason: `أعاد المزوّد slug غير موجود ضمن المرشحين المتاحين ("${rawSlug}")؛ تم رفضه واعتبار الأمر يحتاج توضيحًا.`,
    };
  }

  const needsClarification =
    typeof obj.needsClarification === "boolean" ? obj.needsClarification : true;
  const confidence =
    typeof obj.confidence === "number" && Number.isFinite(obj.confidence)
      ? Math.min(1, Math.max(0, obj.confidence))
      : 0;
  const reason = typeof obj.reason === "string" ? obj.reason : "";

  return { slug, candidates, needsClarification, confidence, reason };
}

async function interpretIntent(input: InterpretIntentInput): Promise<IntentResult> {
  const client = getClient();
  const knownSlugs = input.candidateIndex.map((c) => c.slug);

  const response = await client.responses.create({
    model: MODEL,
    input: [
      { role: "system", content: INTENT_SYSTEM_PROMPT },
      {
        role: "user",
        content: JSON.stringify({
          question: input.question,
          candidateIndex: input.candidateIndex,
        }),
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "intent_result",
        schema: buildIntentSchema(knownSlugs),
        strict: true,
      },
    },
  });

  return parseIntentJson(response.output_text, knownSlugs);
}

// ---------- generateGroundedAnswer ----------

const GROUNDED_ANSWER_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    fields: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: { type: "string" },
          value: { type: ["string", "null"] },
          status: {
            type: "string",
            enum: ["confirmed", "not_documented", "not_applicable"],
          },
        },
        required: ["label", "value", "status"],
        additionalProperties: false,
      },
    },
    refused: { type: "boolean" },
    refusalReason: { type: ["string", "null"] },
  },
  required: ["summary", "fields", "refused", "refusalReason"],
  additionalProperties: false,
} as const;

const GROUNDED_ANSWER_SYSTEM_PROMPT = [
  'أنت مساعد لمشروع معاملات حكومية في طرابلس، ليبيا. مصدر الحقائق الوحيد المسموح به هو JSON الذي سيُرسَل إليك تحت "context" في رسالة المستخدم — لا تستخدم أي معرفة عامة عن ليبيا أو عن هذه المعاملة من خارج هذا الـJSON إطلاقًا.',
  "ممنوع تمامًا:",
  "- إضافة أي رسوم غير موجودة حرفيًا في context.",
  "- إضافة أي مدة غير موجودة حرفيًا في context.",
  "- إضافة أي مستندات غير موجودة حرفيًا في context.",
  "- إضافة أي فروع غير موجودة حرفيًا في context.",
  "- اختراع أي شروط لم تُذكر في context.",
  "- اختراع أي رابط (URL) من عندك.",
  "- رفع مستوى التحقق أو الادعاء بأن معلومة ما مؤكدة رسميًا أكثر مما يقوله context فعليًا.",
  'إذا كانت معلومة معينة غير موجودة في context: استخدم value: null وstatus: "not_documented" لذلك الحقل، ولا تحاول تعويضها بأي تخمين.',
  "أعد فقط JSON مطابقًا تمامًا للمخطط المطلوب، ولا شيء غيره.",
].join("\n");

function parseGroundedAnswerJson(rawText: string): GroundedAnswer {
  const fallback: GroundedAnswer = {
    summary: "",
    fields: [],
    refused: true,
    refusalReason: "تعذّر فهم استجابة المزوّد أو كانت غير صالحة.",
  };

  let data: unknown;
  try {
    data = JSON.parse(rawText);
  } catch {
    return fallback;
  }
  if (typeof data !== "object" || data === null) return fallback;

  const obj = data as Record<string, unknown>;

  const summary = typeof obj.summary === "string" ? obj.summary : "";

  const rawFields = Array.isArray(obj.fields) ? obj.fields : [];
  const fields: GroundedField[] = rawFields
    .filter((f): f is Record<string, unknown> => typeof f === "object" && f !== null)
    .map((f) => {
      const label = typeof f.label === "string" ? f.label : "";
      const value = typeof f.value === "string" ? f.value : null;
      const status = ALLOWED_FIELD_STATUSES.includes(f.status as FieldStatus)
        ? (f.status as FieldStatus)
        : "not_documented";
      return { label, value, status };
    });

  const refused = typeof obj.refused === "boolean" ? obj.refused : false;
  const refusalReason = typeof obj.refusalReason === "string" ? obj.refusalReason : undefined;

  const answer: GroundedAnswer = { summary, fields, refused };
  if (refusalReason !== undefined) answer.refusalReason = refusalReason;
  return answer;
}

async function generateGroundedAnswer(input: GenerateAnswerInput): Promise<GroundedAnswer> {
  const client = getClient();

  const response = await client.responses.create({
    model: MODEL,
    input: [
      { role: "system", content: GROUNDED_ANSWER_SYSTEM_PROMPT },
      {
        role: "user",
        content: JSON.stringify({
          question: input.question,
          context: input.context,
        }),
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "grounded_answer",
        schema: GROUNDED_ANSWER_SCHEMA,
        strict: true,
      },
    },
  });

  // ملاحظة معمارية مهمة: هذا فقط تحقق شكلي (types) من ناتج المزوّد. هذا
  // الناتج ليس دليلًا على صحة المعلومات — validateGroundedAnswer في
  // guardrails.ts يبقى إلزاميًا ويُطبَّق دائمًا بعد هذه الدالة (عبر
  // generateValidatedAnswer في provider.ts)، لا داخل هذا الملف.
  return parseGroundedAnswerJson(response.output_text);
}

export const openaiProvider: AiProvider = {
  name: "openai",
  interpretIntent,
  generateGroundedAnswer,
};
