import type { VerificationStatus } from "@/types/transaction";
import type {
  FieldStatus,
  GroundedAnswer,
  GroundedField,
  TransactionContext,
} from "@/lib/ai/types";

/**
 * طبقة تحقق حتمية (Guardrails) — لا AI هنا، فقط دوال خالصة (pure functions).
 * أي GroundedAnswer قادم مستقبلًا من AI يجب أن يمر عبر validateGroundedAnswer
 * قبل أن يُسمح بعرضه. لا تُعدَّل هذه الدوال context أو transaction أو answer
 * الأصليين — تُعاد كائنات جديدة دائمًا.
 */

const ALLOWED_FIELD_STATUSES: readonly FieldStatus[] = [
  "confirmed",
  "not_documented",
  "not_applicable",
];

function sanitizeStatus(status: unknown): FieldStatus {
  return ALLOWED_FIELD_STATUSES.includes(status as FieldStatus)
    ? (status as FieldStatus)
    : "not_documented";
}

function normalizeText(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

/** يزيل علامات الترقيم الشائعة (عربية/إنجليزية) لأغراض مطابقة summary فقط. */
function stripPunctuation(text: string): string {
  return text.replace(/[.,;:!؟،؛«»"'`\-–—_()\[\]{}]/g, " ");
}

/** تطبيع أوسع (مع إزالة الترقيم) يُستخدم فقط لفحص summary، دون التأثير على مطابقة الحقول الحالية. */
function normalizeForSummaryMatch(text: string): string {
  return stripPunctuation(text).trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * يبني قِطع النص المرجعي الخام (غير مُطبَّعة) من كل ما هو موجود فعليًا في
 * TransactionContext — فقط الحقول المؤكَّدة الوجود في الأنواع الحالية
 * (src/types/transaction.ts, source.ts, authority.ts, branch.ts). لا حقول
 * مفترَضة أو مستقبلية.
 */
function buildCanonicalCorpusParts(context: TransactionContext): string[] {
  const { transaction, authority, sources, branches } = context;
  const parts: string[] = [];

  parts.push(transaction.title, transaction.shortDescription);

  for (const step of transaction.steps) {
    parts.push(step.title);
    if (step.description) parts.push(step.description);
  }

  for (const doc of transaction.requiredDocuments) {
    parts.push(doc.name);
    if (doc.notes) parts.push(doc.notes);
  }

  parts.push(...transaction.conditions, ...transaction.warnings);

  if (transaction.fees?.amount) parts.push(transaction.fees.amount);
  if (transaction.fees?.notes) parts.push(transaction.fees.notes);
  if (transaction.duration) parts.push(transaction.duration);
  if (transaction.authority) parts.push(transaction.authority);

  if (authority) {
    parts.push(authority.name);
    if (authority.description) parts.push(authority.description);
    if (authority.parentAuthority) parts.push(authority.parentAuthority);
  }

  for (const branch of branches) {
    parts.push(branch.name, branch.city);
    if (branch.area) parts.push(branch.area);
    if (branch.address) parts.push(branch.address);
  }

  for (const source of sources) {
    parts.push(source.name, source.description);
    if (source.authorityName) parts.push(source.authorityName);
  }

  return parts.filter(Boolean);
}

/** نفس corpus السابق تمامًا (لمطابقة الحقول fields — بلا تغيير في السلوك). */
function buildCanonicalCorpus(context: TransactionContext): string {
  return normalizeText(buildCanonicalCorpusParts(context).join("\n"));
}

/** نسخة corpus مطبَّعة بإزالة الترقيم أيضًا — تُستخدم فقط لفحص summary. */
function buildCanonicalCorpusForSummaryMatch(context: TransactionContext): string {
  return normalizeForSummaryMatch(buildCanonicalCorpusParts(context).join("\n"));
}

const ARABIC_INDIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

function toWesternDigits(text: string): string {
  return text.replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC_DIGITS.indexOf(d)));
}

/** يستخرج كل الأرقام (عربية أو غربية) من نص كسلاسل مُطبَّعة للمقارنة الحرفية فقط. */
function extractNumbers(text: string): string[] {
  const matches = toWesternDigits(text).match(/\d+(?:[.,]\d+)?/g);
  return matches ? matches.map((m) => m.replace(/,/g, "")) : [];
}

function splitSentences(text: string): string[] {
  return text
    .split(/[.!؟\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * كلمات مفتاحية تدل على ادعاء إجرائي/رقمي (رسوم، مدة، مستندات، شروط...).
 * أي جملة في summary تحتوي إحداها يجب أن تكون موجودة حرفيًا (بعد التطبيع) في
 * corpus، وإلا تُعتبر summary غير مؤكَّدة بالكامل. لا NLP، فقط قائمة ثابتة.
 */
const PROCEDURAL_KEYWORDS: readonly string[] = [
  "رسوم",
  "دينار",
  "تكلفة",
  "تكلف",
  "مجان",
  "مدة",
  "يوم",
  "أيام",
  "أسبوع",
  "أسابيع",
  "شهر",
  "أشهر",
  "سنة",
  "سنوات",
  "ساعة",
  "ساعات",
  "خطوة",
  "خطوات",
  "إجراء",
  "إجراءات",
  "مستند",
  "مستندات",
  "وثيقة",
  "وثائق",
  "ورقة",
  "أوراق",
  "شرط",
  "شروط",
  "فرع",
  "فروع",
  "يجب",
  "يلزم",
  "يتطلب",
  "مطلوب",
  "ضروري",
  "تقديم",
  "أحضر",
  "احضار",
  "إحضار",
];

function containsProceduralKeyword(sentence: string): boolean {
  return PROCEDURAL_KEYWORDS.some((keyword) => sentence.includes(keyword));
}

/**
 * فحص محافظ لـsummary (نص حر): لا NLP، فقط قاعدتان حتميتان:
 * 1) كل رقم يظهر في summary يجب أن يظهر حرفيًا في corpus (وإلا رقم مخترع).
 * 2) أي جملة تحتوي كلمة مفتاحية إجرائية يجب أن تكون موجودة حرفيًا (بعد إزالة
 *    الترقيم والتطبيع) في corpus، وإلا فهي ادعاء إجرائي غير قابل للإسناد.
 * جمل بلا أرقام وبلا كلمات مفتاحية (إعادة صياغة/ربط عام) مسموحة دون فحص، لأن
 * إعادة الصياغة الطبيعية غير المدَّعية لحقائق جديدة مقبولة صراحةً.
 */
function isSummaryGrounded(summary: string, context: TransactionContext): boolean {
  const trimmed = summary.trim();
  if (trimmed.length === 0) return false;

  const rawCorpus = buildCanonicalCorpusParts(context).join("\n");
  const corpusNumbers = new Set(extractNumbers(rawCorpus));
  for (const number of extractNumbers(trimmed)) {
    if (!corpusNumbers.has(number)) return false;
  }

  const summaryCorpus = buildCanonicalCorpusForSummaryMatch(context);
  for (const sentence of splitSentences(trimmed)) {
    if (!containsProceduralKeyword(sentence)) continue;
    if (!summaryCorpus.includes(normalizeForSummaryMatch(sentence))) return false;
  }

  return true;
}

/** ملخص آمن بديل عندما لا يمكن إثبات أن summary مُسنَد بالكامل إلى context. */
function buildSafeSummary(transaction: TransactionContext["transaction"]): string {
  const title = transaction.title.trim();
  const description = transaction.shortDescription.trim();
  return description.length > 0 ? `${title}. ${description}` : title;
}

/**
 * مطابقة نصية محافظة فقط (substring بعد التطبيع) — بلا أي NLP. الهدف تفضيل
 * false negative (رفض قيمة صحيحة الصياغة لكن غير مؤكَّدة الوجود حرفيًا) على
 * السماح بمعلومة مخترعة.
 */
function isGroundedInCorpus(value: string, corpus: string): boolean {
  const needle = normalizeText(value);
  return needle.length > 0 && corpus.includes(needle);
}

/**
 * يفحص حقلًا واحدًا: يُطهِّر الحالة أولًا، ثم — لأي قيمة نصية غير فارغة، بصرف
 * النظر عن الحالة المُعلَنة — يتحقق من وجودها حرفيًا في corpus. أي قيمة غير
 * مؤكَّدة تتحول حتميًا إلى { value: null, status: "not_documented" }.
 */
function validateField(field: GroundedField, corpus: string): GroundedField {
  const status = sanitizeStatus(field.status);
  const value = typeof field.value === "string" ? field.value.trim() : null;

  if (value === null || value.length === 0) {
    return {
      label: field.label,
      value: null,
      status: status === "confirmed" ? "not_documented" : status,
    };
  }

  if (!isGroundedInCorpus(value, corpus)) {
    return { label: field.label, value: null, status: "not_documented" };
  }

  return { label: field.label, value: field.value, status };
}

/**
 * التحقق الحتمي الرئيسي. لا تُدخِل هذه الدالة أي حقل جديد (لا verificationStatus
 * ولا sourceLinks) — GroundedAnswer لا يحتوي هذه الحقول أصلًا بتصميم متعمَّد
 * (انظر src/lib/ai/types.ts)، ومصدر الحقيقة لحالة التحقق يبقى حصريًا
 * context.transaction.verificationStatus (استخدم getVerificationWarning أدناه).
 * summary أيضًا يُفحص (أرقام + جمل ذات كلمات إجرائية مفتاحية)؛ إذا تعذر إثبات
 * أنه مُسنَد بالكامل إلى context يُستبدَل بملخص آمن من title/shortDescription.
 */
export function validateGroundedAnswer(
  answer: GroundedAnswer,
  context: TransactionContext
): GroundedAnswer {
  const corpus = buildCanonicalCorpus(context);
  const fields = answer.fields.map((field) => validateField(field, corpus));

  const summary = isSummaryGrounded(answer.summary, context)
    ? answer.summary
    : buildSafeSummary(context.transaction);

  const validated: GroundedAnswer = {
    summary,
    fields,
    refused: answer.refused,
  };

  if (answer.refusalReason !== undefined) {
    validated.refusalReason = answer.refusalReason;
  }

  return validated;
}

const VERIFICATION_WARNINGS: Record<VerificationStatus, string> = {
  demo:
    "هذه المعاملة قيد الإعداد والتحقق. لا تعتمد هذه المعلومات لإتمام معاملتك حتى يتم توثيقها من مصدر رسمي.",
  needs_review:
    "تم ربط هذه المعاملة بمصدر رسمي، لكن الموقع الرسمي لا ينشر حاليًا تفاصيل كاملة لخطوات هذه الخدمة أو مستنداتها أو رسومها. راجع الجهة المختصة مباشرة قبل البدء في الإجراء.",
  outdated:
    "قد تكون هذه المعلومات قديمة ولم تُحدَّث مؤخرًا. تحقق من المصدر الرسمي قبل الاعتماد عليها.",
  conflict:
    "توجد اختلافات بين المصادر الرسمية حول هذه المعلومة. راجع الجهة المختصة مباشرة لحسم الاختلاف قبل البدء في الإجراء.",
  verified: "تمت مراجعة هذه المعلومات مقابل مصدر رسمي.",
};

/**
 * مصدر واحد للتحذير النصي المناسب لكل حالة توثيق — لاستخدام الواجهة مستقبلًا.
 * لا تُعدِّل هذه الدالة transaction ولا context؛ فقط تُرجع نصًا ثابتًا.
 */
export function getVerificationWarning(status: VerificationStatus): string {
  return VERIFICATION_WARNINGS[status];
}
