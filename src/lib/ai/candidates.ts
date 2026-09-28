import { demoTransactions } from "@/lib/demo-transactions";
import { transactionAliases } from "@/lib/ai/aliases";
import type { TransactionSummary } from "@/lib/ai/types";

/**
 * يبني فهرسًا مختصرًا فقط لكل المعاملات — slug/title/keywords/category حصرًا
 * — ليكون الحد الأدنى من البيانات التي تراها خطوة "فهم النية" مستقبلًا. لا
 * رسوم، لا مستندات، لا خطوات، لا مصادر، لا فروع، لا تنبيهات.
 *
 * keywords هنا = keywords الرسمية من demo-transactions.ts + aliases اللهجية
 * من aliases.ts (إن وُجدت لهذا الـslug). الدمج هنا فقط، لا في أي مكان آخر،
 * حتى يبقى demo-transactions.ts خاليًا تمامًا من أي صياغة لهجية.
 *
 * كل الحقول الأربعة (slug/title/category إلزامية نصيًا، وkeywords مصفوفة
 * إلزامية) غير اختيارية في Transaction الحالي، فلا حاجة لقيم افتراضية هنا.
 */
export function buildCandidateIndex(): TransactionSummary[] {
  return demoTransactions.map((transaction) => ({
    slug: transaction.slug,
    title: transaction.title,
    keywords: [...transaction.keywords, ...(transactionAliases[transaction.slug] ?? [])],
    category: transaction.category,
  }));
}
