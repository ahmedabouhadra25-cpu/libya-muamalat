/**
 * اختبارات محلية للـfallback الجديد — بلا أي استدعاء حقيقي لـOpenAI: نُنشئ
 * fake providers هنا فقط (كائنات AiProvider بسيطة)، ونستخدم mockAiProvider
 * وbuildCandidateIndex وbuildTransactionContext وanswerQuestion وguardrails
 * الحقيقيين دون أي تعديل عليهم. يُشغَّل عبر:
 *   node --import ./scripts/register-loader.mjs scripts/test-ai-fallback.mts
 */
import assert from "node:assert/strict";
import { createResilientProvider } from "@/lib/ai/providers/index";
import { mockAiProvider } from "@/lib/ai/providers/mock";
import { answerQuestion, generateValidatedAnswer } from "@/lib/ai/provider";
import { buildCandidateIndex } from "@/lib/ai/candidates";
import { buildTransactionContext } from "@/lib/ai/context";
import type { AiProvider, GroundedAnswer } from "@/lib/ai/types";

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (err) {
    console.log(`❌ ${name}`);
    console.log(`   ${err instanceof Error ? err.message : String(err)}`);
    failed++;
  }
}

// ---------- Fake providers (لا OpenAI حقيقي أبدًا) ----------

const fakeSuccessProvider: AiProvider = {
  name: "fake-success",
  async interpretIntent() {
    return {
      slug: "passport-renewal",
      candidates: [],
      needsClarification: false,
      confidence: 0.99,
      reason: "fake success",
    };
  },
  async generateGroundedAnswer() {
    return { summary: "fake openai answer", fields: [], refused: false };
  },
};

function failingProvider(errorFactory: () => Error): AiProvider {
  return {
    name: "fake-failing",
    async interpretIntent() {
      throw errorFactory();
    },
    async generateGroundedAnswer() {
      throw errorFactory();
    },
  };
}

const err429 = () => Object.assign(new Error("429 Too Many Requests"), { status: 429 });
const errQuota = () =>
  Object.assign(new Error("You exceeded your current quota"), { status: 429, code: "insufficient_quota" });
const errNetwork = () => Object.assign(new Error("fetch failed"), { code: "ECONNRESET" });
const errTimeout = () => Object.assign(new Error("Request timed out"), { name: "APIConnectionTimeoutError" });

// ---------- 1-5: سلوك createResilientProvider ----------

await test("1. OpenAI success → الإجابة تعمل (لا يُستدعى fallback إطلاقًا)", async () => {
  const provider = createResilientProvider(fakeSuccessProvider, failingProvider(() => new Error("should not be called")));
  const intent = await provider.interpretIntent({ question: "x", candidateIndex: [] });
  assert.equal(intent.slug, "passport-renewal");
});

await test("2. OpenAI 429 → local fallback (Mock) يعمل", async () => {
  const candidateIndex = buildCandidateIndex();
  const provider = createResilientProvider(failingProvider(err429), mockAiProvider);
  const intent = await provider.interpretIntent({ question: "نبي نجدد جواز سفري", candidateIndex });
  assert.equal(intent.slug, "passport-renewal");
});

await test("3. OpenAI quota exhausted → local fallback يعمل", async () => {
  const candidateIndex = buildCandidateIndex();
  const provider = createResilientProvider(failingProvider(errQuota), mockAiProvider);
  const intent = await provider.interpretIntent({ question: "نبي نجدد جواز سفري", candidateIndex });
  assert.equal(intent.slug, "passport-renewal");
});

await test("4. OpenAI network error → local fallback يعمل", async () => {
  const candidateIndex = buildCandidateIndex();
  const provider = createResilientProvider(failingProvider(errNetwork), mockAiProvider);
  const intent = await provider.interpretIntent({ question: "نبي نجدد جواز سفري", candidateIndex });
  assert.equal(intent.slug, "passport-renewal");
});

await test("5. OpenAI timeout → local fallback يعمل", async () => {
  const candidateIndex = buildCandidateIndex();
  const provider = createResilientProvider(failingProvider(errTimeout), mockAiProvider);
  const intent = await provider.interpretIntent({ question: "نبي نجدد جواز سفري", candidateIndex });
  assert.equal(intent.slug, "passport-renewal");
});

// ---------- 6-10: سلوك answerQuestion الكامل عبر resilient provider (OpenAI فاشل دائمًا) ----------

const resilientAlwaysFallsBack = createResilientProvider(failingProvider(err429), mockAiProvider);

await test('6. "نبي نجدد جواز سفري" → passport-renewal', async () => {
  const outcome = await answerQuestion(resilientAlwaysFallsBack, "نبي نجدد جواز سفري");
  assert.equal(outcome.kind, "answered");
  if (outcome.kind === "answered") assert.equal(outcome.context.transaction.slug, "passport-renewal");
});

await test('7. "ضاع جوازي" → lost-passport أو توضيح آمن (ليس passport-renewal تلقائيًا)', async () => {
  const outcome = await answerQuestion(resilientAlwaysFallsBack, "ضاع جوازي");
  const safe =
    (outcome.kind === "answered" && outcome.context.transaction.slug === "lost-passport") ||
    outcome.kind === "needs_clarification" ||
    outcome.kind === "not_found";
  assert.ok(
    safe,
    `النتيجة الفعلية: ${outcome.kind}${outcome.kind === "answered" ? ` (${outcome.context.transaction.slug})` : ""}`
  );
});

await test('8. "البطاقة الشخصية" → id-card-issuance أو توضيح آمن', async () => {
  const outcome = await answerQuestion(resilientAlwaysFallsBack, "البطاقة الشخصية");
  const safe =
    (outcome.kind === "answered" && outcome.context.transaction.slug === "id-card-issuance") ||
    outcome.kind === "needs_clarification" ||
    outcome.kind === "not_found";
  assert.ok(
    safe,
    `النتيجة الفعلية: ${outcome.kind}${outcome.kind === "answered" ? ` (${outcome.context.transaction.slug})` : ""}`
  );
});

await test('9. "شركة" (غامض) → توضيح (needs_clarification)', async () => {
  const outcome = await answerQuestion(resilientAlwaysFallsBack, "شركة");
  assert.equal(outcome.kind, "needs_clarification");
});

await test('10. سؤال خارج نطاق المعاملات → لا اختراع، لا تطابق', async () => {
  const outcome = await answerQuestion(resilientAlwaysFallsBack, "ما هو الطقس اليوم في طرابلس؟");
  assert.notEqual(outcome.kind, "answered");
});

// ---------- 11: guardrails تمنع اختراع رسوم/مستندات/مدة ----------

await test("11. guardrails تمنع اختراع رسوم/مستندات/مدة حتى لو حاول provider ذلك", async () => {
  const context = buildTransactionContext("passport-renewal");
  assert.ok(context, "سياق passport-renewal يجب أن يكون موجودًا");

  const maliciousProvider: AiProvider = {
    name: "malicious",
    async interpretIntent() {
      throw new Error("unused");
    },
    async generateGroundedAnswer(): Promise<GroundedAnswer> {
      return {
        summary: "الرسوم 999999 دينار وتستغرق 40 سنة وتحتاج مستند اختُرع الآن",
        fields: [
          { label: "الرسوم", value: "999999 دينار ليبي (مُخترَع)", status: "confirmed" },
          { label: "المدة", value: "40 سنة (مُخترَعة)", status: "confirmed" },
          { label: "المستندات المطلوبة", value: "وثيقة سرية غير موجودة فعليًا", status: "confirmed" },
          { label: "الفرع", value: "فرع وهمي في مدينة مختلقة", status: "confirmed" },
        ],
        refused: false,
      };
    },
  };

  const validated = await generateValidatedAnswer(maliciousProvider, { question: "x", context: context! });

  for (const field of validated.fields) {
    assert.notEqual(field.status, "confirmed", `الحقل "${field.label}" لم تُرفَض قيمته المخترَعة`);
    assert.equal(field.value, null, `الحقل "${field.label}" ما زال يحمل قيمة بعد الفحص`);
  }
  assert.ok(
    !validated.summary.includes("999999") && !validated.summary.includes("40 سنة"),
    "summary ما زال يحتوي رقمًا/ادعاءً مُخترَعًا لم يُستبدَل بملخص آمن"
  );
});

// ---------- 12: verificationStatus لا يمكن لأي provider تغييره ----------

await test("12. verificationStatus مصدره context الحقيقي فقط، لا يتأثر بأي provider", async () => {
  const context = buildTransactionContext("lost-passport");
  assert.ok(context);
  const realStatus = context!.transaction.verificationStatus;
  assert.equal(realStatus, "needs_review");

  const maliciousProvider: AiProvider = {
    name: "malicious",
    async interpretIntent() {
      throw new Error("unused");
    },
    async generateGroundedAnswer() {
      // GroundedAnswer لا يملك بنيويًا حقل verificationStatus أصلًا (types.ts) — أي محاولة لحقنه هنا كخاصية إضافية فقط للتأكيد.
      return { summary: "محاولة تغيير الحالة", fields: [], refused: false, verificationStatus: "verified" } as unknown as GroundedAnswer;
    },
  };

  const outcome = await answerQuestion(
    createResilientProvider(failingProvider(err429), maliciousProvider as AiProvider),
    "فقدان جواز السفر"
  );
  assert.equal(outcome.kind, "answered");
  if (outcome.kind === "answered") {
    assert.equal(outcome.context.transaction.verificationStatus, realStatus);
  }
});

// ---------- ملخص ----------

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
