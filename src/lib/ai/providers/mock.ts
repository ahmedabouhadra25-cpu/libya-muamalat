import type {
  AiProvider,
  FieldStatus,
  GenerateAnswerInput,
  GroundedAnswer,
  GroundedField,
  IntentCandidate,
  IntentResult,
  InterpretIntentInput,
  TransactionSummary,
} from "@/lib/ai/types";

/**
 * تطبيق Mock محلي 100% لـ AiProvider — بلا شبكة، بلا SDK، بلا AI فعلي.
 * كل القرارات هنا حتمية (deterministic) وقابلة للتفسير الكامل.
 */

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

interface ScoredCandidate {
  candidate: TransactionSummary;
  score: number;
}

/** تطابق نصي بسيط بين سؤال المستخدم وعنوان/كلمات مفتاحية/فئة المرشّح. */
function scoreCandidate(question: string, candidate: TransactionSummary): number {
  const needle = normalize(question);
  let score = 0;

  const normalizedTitle = normalize(candidate.title);
  if (normalizedTitle && needle.includes(normalizedTitle)) {
    score += 3;
  }

  for (const keyword of candidate.keywords) {
    const normalizedKeyword = normalize(keyword);
    if (normalizedKeyword && needle.includes(normalizedKeyword)) {
      score += 2;
    }
  }

  const normalizedCategory = normalize(candidate.category);
  if (normalizedCategory && needle.includes(normalizedCategory)) {
    score += 1;
  }

  return score;
}

// أعلى نقاط منطقية تقريبية (تطابق عنوان كامل + كلمة مفتاحية + فئة) — تُستخدم فقط لتطبيع confidence بين 0 و1.
const MAX_EXPECTED_SCORE = 6;

function interpretIntentSync(input: InterpretIntentInput): IntentResult {
  const scored: ScoredCandidate[] = input.candidateIndex.map((candidate) => ({
    candidate,
    score: scoreCandidate(input.question, candidate),
  }));

  const matched = scored.filter((entry) => entry.score > 0);

  if (matched.length === 0) {
    return {
      slug: null,
      candidates: [],
      needsClarification: true,
      confidence: 0,
      reason: "لم يُعثر على أي تطابق بين السؤال وقائمة المعاملات المتاحة.",
    };
  }

  const maxScore = Math.max(...matched.map((entry) => entry.score));
  const topMatches = matched.filter((entry) => entry.score === maxScore);
  const confidence = Math.min(1, maxScore / MAX_EXPECTED_SCORE);

  if (topMatches.length === 1) {
    const [best] = topMatches;
    return {
      slug: best.candidate.slug,
      candidates: [],
      needsClarification: false,
      confidence,
      reason: `تطابق واضح مع "${best.candidate.title}" (نقاط التطابق: ${maxScore}).`,
    };
  }

  const candidates: IntentCandidate[] = topMatches.map((entry) => ({
    slug: entry.candidate.slug,
    reason: `تطابق جزئي مع "${entry.candidate.title}" (نقاط التطابق: ${entry.score}).`,
  }));

  return {
    slug: null,
    candidates,
    needsClarification: true,
    confidence,
    reason: "وُجد أكثر من تطابق محتمل بنفس القوة، يحتاج الأمر توضيحًا من المستخدم.",
  };
}

function toFieldStatus(value: string | null): FieldStatus {
  return value === null || value.length === 0 ? "not_documented" : "confirmed";
}

function generateGroundedAnswerSync(input: GenerateAnswerInput): GroundedAnswer {
  const { transaction } = input.context;

  const fields: GroundedField[] = [];

  const authorityValue = transaction.authority ?? null;
  fields.push({
    label: "الجهة المختصة",
    value: authorityValue,
    status: toFieldStatus(authorityValue),
  });

  const durationValue = transaction.duration ?? null;
  fields.push({
    label: "المدة",
    value: durationValue,
    status: toFieldStatus(durationValue),
  });

  const feesValue = transaction.fees?.amount ?? transaction.fees?.notes ?? null;
  fields.push({
    label: "الرسوم",
    value: feesValue,
    status: toFieldStatus(feesValue),
  });

  const documentsValue =
    transaction.requiredDocuments.length > 0
      ? transaction.requiredDocuments.map((doc) => doc.name).join("، ")
      : null;
  fields.push({
    label: "المستندات المطلوبة",
    value: documentsValue,
    status: toFieldStatus(documentsValue),
  });

  const stepsValue =
    transaction.steps.length > 0
      ? transaction.steps.map((step) => step.title).join(" ← ")
      : null;
  fields.push({
    label: "الخطوات",
    value: stepsValue,
    status: toFieldStatus(stepsValue),
  });

  const conditionsValue =
    transaction.conditions.length > 0 ? transaction.conditions.join("، ") : null;
  fields.push({
    label: "الشروط",
    value: conditionsValue,
    status: toFieldStatus(conditionsValue),
  });

  return {
    summary: `${transaction.title}: ${transaction.shortDescription}`,
    fields,
    refused: false,
  };
}

export const mockAiProvider: AiProvider = {
  name: "mock",
  interpretIntent: (input) => Promise.resolve(interpretIntentSync(input)),
  generateGroundedAnswer: (input) => Promise.resolve(generateGroundedAnswerSync(input)),
};
