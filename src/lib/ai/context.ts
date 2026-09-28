import { authorities } from "@/lib/authorities";
import { branches } from "@/lib/branches";
import { demoTransactions } from "@/lib/demo-transactions";
import { officialForms } from "@/lib/forms";
import { allSources } from "@/lib/sources";
import type { TransactionContext } from "@/lib/ai/types";
import type { Authority } from "@/types/authority";
import type { OfficialSource } from "@/types/source";
import type { Transaction } from "@/types/transaction";

/**
 * يبني TransactionContext بنفس العلاقات الحتمية المستخدمة فعليًا في
 * src/app/transactions/[slug]/page.tsx (رُوجعت الصفحة سطرًا بسطر قبل كتابة
 * هذا الملف). هذا الملف مُقترَح ليكون المصدر الوحيد لإعادة بناء السياق
 * مستقبلًا، لكن الصفحة نفسها لم تُعدَّل بعد لاستخدامه — تبقى بمنطقها الحالي
 * إلى أن يُتحقق أن ناتج buildTransactionContext مطابق تمامًا لما تعرضه.
 */

/**
 * يطابق منطق sourceRefs/linkedSource في الصفحة: يُفضَّل transaction.sources
 * (المصادر المتعددة مع الأدوار) إن وُجدت ويمكن حلّ عنصر واحد منها على الأقل،
 * وإلا يُستخدم transaction.sourceId (المصدر الفردي القديم) كـfallback.
 *
 * ملاحظة: هذه الدالة تُعيد OfficialSource[] فقط (بلا role/url الخاصين بكل
 * مرجع)، لأن هذا هو شكل TransactionContext.sources المُعتمَد حاليًا في
 * src/lib/ai/types.ts. راجع "الاختلاف عن منطق الصفحة" في تقرير التنفيذ.
 */
function resolveSources(transaction: Transaction): OfficialSource[] {
  if (transaction.sources && transaction.sources.length > 0) {
    const resolved = transaction.sources
      .map((ref) => allSources.find((source) => source.id === ref.sourceId))
      .filter((source): source is OfficialSource => source !== undefined);

    if (resolved.length > 0) return resolved;
  }

  if (transaction.sourceId) {
    const source = allSources.find((s) => s.id === transaction.sourceId);
    return source ? [source] : [];
  }

  return [];
}

/** يطابق منطق linkedAuthority في الصفحة. */
function resolveAuthority(transaction: Transaction): Authority | null {
  if (!transaction.authorityId) return null;
  return authorities.find((a) => a.id === transaction.authorityId) ?? null;
}

export function buildTransactionContext(slug: string): TransactionContext | null {
  const transaction = demoTransactions.find((t) => t.slug === slug);
  if (!transaction) return null;

  const authority = resolveAuthority(transaction);
  const sources = resolveSources(transaction);

  // يطابق منطق authorityBranches في الصفحة.
  const transactionBranches = authority
    ? branches.filter((b) => b.authorityId === authority.id)
    : [];

  // يطابق منطق فلترة officialForms داخل مكوّن OfficialForms.tsx.
  const forms = officialForms.filter((form) =>
    form.transactionSlugs.includes(transaction.slug)
  );

  return {
    transaction,
    authority,
    sources,
    branches: transactionBranches,
    forms,
  };
}
