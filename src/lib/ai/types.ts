import type { Authority } from "@/types/authority";
import type { Branch } from "@/types/branch";
import type { OfficialForm } from "@/types/form";
import type { OfficialSource } from "@/types/source";
import type { Transaction } from "@/types/transaction";

/**
 * أنواع طبقة AI — مستقلة تمامًا عن أي مزوّد (Anthropic/OpenAI/Gemini).
 * لا يُستورد هنا أي SDK خارجي، فقط أنواع المشروع الحالية.
 */

// ---------- فهم النية (interpretIntent) ----------

export interface TransactionSummary {
  slug: string;
  title: string;
  keywords: string[];
  category: string;
}

export interface InterpretIntentInput {
  question: string;
  /** ملخص فقط — وليس بيانات المعاملة الكاملة — هذا كل ما تراه هذه الخطوة. */
  candidateIndex: TransactionSummary[];
}

export interface IntentCandidate {
  slug: string;
  reason: string;
}

export interface IntentResult {
  /** المعاملة المقصودة بوضوح، أو null إذا لم تكن هناك ثقة كافية. */
  slug: string | null;
  /** بدائل محتملة عند التباس حقيقي بين أكثر من معاملة. */
  candidates: IntentCandidate[];
  /** true يعني: لا تُجب الآن، اطلب توضيحًا من المستخدم. */
  needsClarification: boolean;
  /** درجة ثقة التفسير نفسه (وليس ثقة صحة معلومات المعاملة) — بين 0 و1. */
  confidence: number;
  /** شرح مختصر لسبب القرار — لغرض التصحيح والمراجعة الداخلية. */
  reason: string;
}

// ---------- توليد الإجابة (generateGroundedAnswer) ----------

/**
 * السياق الحتمي الوحيد المسموح أن يُبنى منه أي رد. يُبنى بالكود (لاحقًا في
 * context.ts) من بيانات المشروع الفعلية، ولا يُنشئه أي Provider أو AI.
 */
export interface TransactionContext {
  transaction: Transaction;
  authority: Authority | null;
  sources: OfficialSource[];
  branches: Branch[];
  forms: OfficialForm[];
}

export interface GenerateAnswerInput {
  question: string;
  context: TransactionContext;
}

export type FieldStatus = "confirmed" | "not_documented" | "not_applicable";

export interface GroundedField {
  /** اسم الحقل كما يفهمه المستخدم، مثل "الرسوم" أو "المدة". */
  label: string;
  value: string | null;
  status: FieldStatus;
}

/**
 * ملاحظة تصميمية مهمة: هذا النوع عمدًا لا يحتوي verificationStatus أو
 * sourceLinks أو أي تمثيل مستقل للفروع/الرسوم/المستندات. هذه كلها تبقى في
 * TransactionContext فقط، وتُستمد لاحقًا بالكود (لا بالـAI) عند بناء ما
 * يُعرض فعليًا للمستخدم. جعل GroundedAnswer يحتوي هذه الحقول كان سيسمح لأي
 * رد AI بـ"الكتابة فوق" مصدر الحقيقة — وهذا ممنوع بنيويًا هنا، لا فقط
 * بالتعليمات النصية. انظر تقرير التنفيذ لتفصيل هذا القرار.
 */
export interface GroundedAnswer {
  /** ملخص نصي، مبني فقط على transaction.title/shortDescription وقيم fields. */
  summary: string;
  fields: GroundedField[];
  /** true إذا رفض المزوّد توليد إجابة (بيانات غير كافية جدًا مثلًا). */
  refused: boolean;
  refusalReason?: string;
}

// ---------- عقد المزوّد ----------

export interface AiProvider {
  readonly name: string;
  interpretIntent(input: InterpretIntentInput): Promise<IntentResult>;
  generateGroundedAnswer(input: GenerateAnswerInput): Promise<GroundedAnswer>;
}
