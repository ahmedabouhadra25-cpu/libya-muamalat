"use client";

import Link from "next/link";
import { useId, useRef, useState, type FormEvent } from "react";
import { VerificationBadge } from "@/components/VerificationBadge";
import type { VerificationStatus } from "@/types/transaction";

/**
 * مكوّن عميل بسيط يتصل فقط بـ POST /api/ask عبر fetch عادي. لا يستورد أي شيء
 * من src/lib/ai (لا provider، لا guardrails، لا SDK) — الحدود الآمنة كلها في
 * الـRoute Handler، وهذا المكوّن لا يعرف عنها شيئًا. الأنواع أدناه محلية
 * ومطابقة لشكل استجابة /api/ask فقط، وليست استيرادًا لأي نوع من src/lib/ai.
 */

type AskFieldStatus = "confirmed" | "not_documented" | "not_applicable";

interface AskField {
  label: string;
  value: string | null;
  status: AskFieldStatus;
}

interface AskAnswer {
  summary: string;
  fields: AskField[];
  refused: boolean;
  refusalReason?: string;
}

interface AskCandidate {
  slug: string;
  reason: string;
}

type AskResponse =
  | {
      status: "answered";
      transaction: { slug: string; title: string };
      verificationStatus: VerificationStatus;
      verificationWarning: string;
      answer: AskAnswer;
    }
  | { status: "needs_clarification"; message: string; candidates: AskCandidate[] }
  | { status: "not_found"; message: string }
  | { status: "invalid_input" | "server_error"; message: string };

const NETWORK_ERROR_MESSAGE =
  "تعذّر الاتصال بالمساعد الآن. تحقّق من الاتصال وحاول مرة أخرى.";

const WARNING_STYLES: Record<VerificationStatus, string> = {
  demo: "border-amber-300 bg-amber-50 text-amber-900",
  needs_review: "border-orange-300 bg-orange-50 text-orange-900",
  outdated: "border-zinc-300 bg-zinc-50 text-zinc-700",
  conflict: "border-red-300 bg-red-50 text-red-900",
  verified: "border-teal-300 bg-teal-50 text-teal-900",
};

export function AskAssistant() {
  const inputId = useId();
  const headingId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AskResponse | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);

  async function submitQuestion(rawQuestion: string) {
    const trimmed = rawQuestion.trim();
    if (trimmed.length === 0 || isLoading) return;

    setIsLoading(true);
    setNetworkError(null);
    setResult(null);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });
      const data = (await response.json()) as AskResponse;
      setResult(data);
    } catch {
      setNetworkError(NETWORK_ERROR_MESSAGE);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitQuestion(question);
  }

  function handleCandidateClick(candidate: AskCandidate) {
    setQuestion(candidate.reason);
    setResult(null);
    setNetworkError(null);
    inputRef.current?.focus();
  }

  function handleTryAgain() {
    setQuestion("");
    setResult(null);
    setNetworkError(null);
    inputRef.current?.focus();
  }

  return (
    <section
      aria-labelledby={headingId}
      className="mx-auto w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-5 text-right shadow-sm sm:p-8"
    >
      <h2 id={headingId} className="text-xl font-bold text-zinc-900 sm:text-2xl">
        شن المعاملة اللي تبي تديرها؟
      </h2>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
        <label htmlFor={inputId} className="text-sm font-medium text-zinc-700">
          اكتب سؤالك
        </label>
        <input
          ref={inputRef}
          id={inputId}
          name="question"
          type="text"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          disabled={isLoading}
          maxLength={1000}
          placeholder="مثلاً: نبي نجدد جواز السفر"
          className="w-full rounded-full border border-zinc-300 bg-white px-5 py-3 text-base text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400"
        />
        <button
          type="submit"
          disabled={isLoading || question.trim().length === 0}
          className="rounded-full bg-teal-700 px-6 py-3 text-base font-semibold text-white transition hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          اسأل المساعد
        </button>
      </form>

      <div aria-live="polite" className="mt-5 min-h-[1.5rem]">
        {isLoading && (
          <p role="status" className="text-sm font-medium text-teal-700">
            جاري البحث عن المعاملة…
          </p>
        )}

        {!isLoading && networkError && (
          <p role="alert" className="text-sm font-medium text-red-700">
            {networkError}
          </p>
        )}

        {!isLoading && !networkError && result?.status === "answered" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-zinc-900">{result.transaction.title}</h3>
              <VerificationBadge status={result.verificationStatus} />
            </div>

            <p className="text-zinc-700">{result.answer.summary}</p>

            {result.answer.fields.filter((field) => field.status !== "not_applicable")
              .length > 0 && (
              <dl className="space-y-2">
                {result.answer.fields
                  .filter((field) => field.status !== "not_applicable")
                  .map((field) => (
                    <div
                      key={field.label}
                      className="rounded-lg border border-zinc-200 bg-zinc-50 p-3"
                    >
                      <dt className="text-sm font-semibold text-zinc-500">{field.label}</dt>
                      <dd className="mt-1 text-zinc-800">
                        {field.status === "confirmed" && field.value ? (
                          field.value
                        ) : (
                          <span className="text-zinc-500">غير موثق حاليًا</span>
                        )}
                      </dd>
                    </div>
                  ))}
              </dl>
            )}

            <p
              role="note"
              className={`rounded-xl border p-3 text-sm ${WARNING_STYLES[result.verificationStatus]}`}
            >
              {result.verificationWarning}
            </p>

            <Link
              href={`/transactions/${result.transaction.slug}`}
              className="inline-block rounded-full border border-teal-300 bg-teal-50 px-5 py-2 text-sm font-semibold text-teal-800 transition hover:bg-teal-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
            >
              عرض تفاصيل المعاملة
            </Link>
          </div>
        )}

        {!isLoading && !networkError && result?.status === "needs_clarification" && (
          <div className="space-y-3">
            <p className="text-zinc-700">{result.message}</p>
            {result.candidates.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {result.candidates.map((candidate) => (
                  <button
                    key={candidate.slug}
                    type="button"
                    onClick={() => handleCandidateClick(candidate)}
                    className="rounded-full border border-zinc-300 bg-white px-4 py-1.5 text-sm text-zinc-800 transition hover:border-teal-300 hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
                  >
                    {candidate.reason}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {!isLoading && !networkError && result?.status === "not_found" && (
          <div className="space-y-3">
            <p className="text-zinc-700">{result.message}</p>
            <button
              type="button"
              onClick={handleTryAgain}
              className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-800 transition hover:border-zinc-400 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
            >
              جرّب سؤالًا آخر
            </button>
          </div>
        )}

        {!isLoading &&
          !networkError &&
          result &&
          (result.status === "invalid_input" || result.status === "server_error") && (
            <p role="alert" className="text-sm font-medium text-red-700">
              {result.message}
            </p>
          )}
      </div>
    </section>
  );
}
