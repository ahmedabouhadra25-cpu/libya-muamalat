import type { IntentResult, TransactionSummary } from "@/lib/ai/types";

/**
 * تمريرة حتمية أولى (deterministic-first) تُستدعى قبل أي AI provider. تُعيد
 * IntentResult جاهزًا فقط عند وجود تطابق "قوي وواضح" لا لبس فيه، وإلا تُعيد
 * null ليقرر المستدعي (provider.ts) استدعاء provider.interpretIntent() كـ
 * fallback. هذا الملف مستقل تمامًا عن أي provider بعينه (لا يعرف شيئًا عن
 * OpenAI أو Mock) — فقط مطابقة نصية خالصة على candidateIndex، بلا أي تعديل
 * على mock.ts أو openai.ts أو candidates.ts نفسها.
 *
 * قاعدة السلامة الجوهرية (1): مطابقة كلمة مفردة عامة (بلا مسافة داخلها، مثل
 * "جواز"، "بطاقة"، "شهادة"، "شركة"، "اسم") لا تُعتبر أبدًا "قوية" بمفردها،
 * حتى لو كانت الفائزة الوحيدة بلا تعادل — فقط تطابق العنوان الرسمي الكامل
 * أو عبارة مركّبة (keyword/alias تحتوي مسافة) يُحتسَب كدليل "قوي" يكفي
 * لحسم القرار دون استدعاء أي AI provider.
 *
 * قاعدة السلامة الجوهرية (2): وجود مسافة داخل keyword ليس كافيًا بمفرده
 * لإثبات أنه "قوي" — بعض العبارات المركّبة عامة جدًا رغم احتوائها مسافة
 * (مثال مؤكَّد: "جواز سفر" لا تعني أكثر من "الجواز" نفسه، ولا تُميّز بين
 * تجديده وفقدانه). هذه العبارات مُستثناة صريحًا عبر
 * TOO_GENERIC_COMPOUND_PHRASES ولا تُحتسَب أبدًا، حتى لو كانت الوحيدة
 * المطابقة.
 *
 * قاعدة السلامة الجوهرية (3): أي إشارة صريحة داخل السؤال إلى التردد بين
 * أكثر من معاملة (أو / او / ولا / هل / مش متأكد / مش عارف) تُلغي أي حسم
 * حتمي فورًا، بصرف النظر عن نقاط أي مرشّح.
 */

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

/**
 * عبارات مركّبة (تحتوي مسافة) لكنها عامة جدًا ولا تُميِّز بين معاملتين قد
 * تتشاركان الموضوع نفسه (هنا: تجديد الجواز مقابل فقدانه) — لا تُحتسَب أبدًا
 * كدليل "قوي"، حتى بلا وجود أي منافس فعلي.
 */
const TOO_GENERIC_COMPOUND_PHRASES = new Set(["جواز سفر"]);

const AMBIGUITY_MARKER_WORDS = new Set(["أو", "او", "ولا", "هل"]);
const AMBIGUITY_MARKER_PHRASES = ["مش متأكد", "مش عارف"];

/** يفصل السؤال إلى كلمات (بأي فاصل غير حرف/رقم) لفحص تطابق كلمة كاملة فقط،
 * لا substring عشوائي — يمنع هذا مثلًا أن تُطابِق "أو" داخل "أوراق"/"أول". */
function containsAmbiguityMarker(question: string): boolean {
  const normalized = normalize(question);
  if (AMBIGUITY_MARKER_PHRASES.some((phrase) => normalized.includes(phrase))) {
    return true;
  }
  const words = normalized.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  return words.some((word) => AMBIGUITY_MARKER_WORDS.has(word));
}

/**
 * نقاط "القوة" لمرشّح واحد: فقط من تطابق العنوان الكامل أو عبارات مركّبة
 * (keywords/aliases تحتوي مسافة) غير مُستثناة كـ"عامة جدًا". يتجاهل تمامًا
 * أي تطابق كلمة مفردة — هذا ما يمنع "جواز"/"بطاقة"/"شهادة"/"شركة" بمفردها
 * من حسم أي قرار، ويمنع "جواز سفر" تحديدًا من حسمه أيضًا رغم احتوائها مسافة.
 */
function computeStrongScore(question: string, candidate: TransactionSummary): number {
  const needle = normalize(question);
  let score = 0;

  const normalizedTitle = normalize(candidate.title);
  if (normalizedTitle && needle.includes(normalizedTitle)) {
    score += 3;
  }

  for (const keyword of candidate.keywords) {
    const normalizedKeyword = normalize(keyword);
    const isCompoundPhrase = normalizedKeyword.includes(" ");
    const isTooGeneric = TOO_GENERIC_COMPOUND_PHRASES.has(normalizedKeyword);
    if (isCompoundPhrase && !isTooGeneric && needle.includes(normalizedKeyword)) {
      score += 2;
    }
  }

  return score;
}

const CONFIDENT_MATCH_CONFIDENCE = 0.95;

/**
 * تُعيد IntentResult جاهزًا فقط عند وجود مرشّح واحد فريد بأعلى نقاط قوة أكبر
 * من صفر (بلا تعادل بينه وبين مرشّح آخر)، وبلا أي إشارة تردد صريحة في
 * السؤال نفسه. أي غموض، أو تعادل، أو اعتماد فقط على كلمة/عبارة عامة، أو
 * إشارة تردد صريحة، أو غياب أي تطابق قوي إطلاقًا → تُعيد null، فيتحول
 * القرار لـprovider.interpretIntent() (Mock أو OpenAI بحسب الإعداد الحالي).
 */
export function findStrongDeterministicMatch(
  question: string,
  candidateIndex: TransactionSummary[]
): IntentResult | null {
  if (containsAmbiguityMarker(question)) return null;

  const scored = candidateIndex
    .map((candidate) => ({ candidate, score: computeStrongScore(question, candidate) }))
    .filter((entry) => entry.score > 0);

  if (scored.length === 0) return null;

  const maxScore = Math.max(...scored.map((entry) => entry.score));
  const topMatches = scored.filter((entry) => entry.score === maxScore);

  if (topMatches.length !== 1) return null;

  const [best] = topMatches;
  return {
    slug: best.candidate.slug,
    candidates: [],
    needsClarification: false,
    confidence: CONFIDENT_MATCH_CONFIDENCE,
    reason: `تطابق حتمي قوي وواضح مع "${best.candidate.title}" (عبارة محددة، لا كلمة عامة بمفردها) — لم يُستدعَ أي AI provider.`,
  };
}
