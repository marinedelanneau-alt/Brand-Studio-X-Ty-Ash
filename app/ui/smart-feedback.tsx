"use client";

import { useMemo } from "react";
import {
  evaluateSmartFeedback,
  getClarityLabel,
  type SmartFeedbackConfig,
} from "@/lib/smart-feedback";

const LEVEL_STYLES = {
  improve: {
    border: "border-[var(--border)]",
    bg: "bg-[var(--tyash-subtle)]",
    text: "text-[var(--text-primary)]",
    badge: "bs-status-light bg-[#f7ead7] text-[var(--status-warning-text)]",
    label: "À ajuster",
  },
  warning: {
    border: "border-[var(--border)]",
    bg: "bg-[var(--tyash-subtle)]",
    text: "text-[var(--text-primary)]",
    badge: "bs-status-light bg-[#f6e7db] text-[var(--status-warning-text)]",
    label: "À préciser",
  },
  good: {
    border: "border-[#dde7df]",
    bg: "bs-status-light bg-[#fbfdfb]",
    text: "text-[#5d6f61]",
    badge: "bs-status-light bg-[#e9f1eb] text-[var(--status-success-text)]",
    label: "Bonne base",
  },
  excellent: {
    border: "border-[#e8dec7]",
    bg: "bg-[var(--surface)]",
    text: "text-[var(--text-primary)]",
    badge: "bs-status-light bg-[#fff1d9] text-[var(--status-warning-text)]",
    label: "Excellent",
  },
} as const;

export default function SmartFeedback({
  value,
  feedbackConfig,
  fieldKey,
  sectionKey,
}: {
  value: string;
  feedbackConfig: SmartFeedbackConfig | null | undefined;
  fieldKey: string;
  sectionKey: string;
}) {
  const feedback = useMemo(
    () =>
      feedbackConfig?.enabled ? evaluateSmartFeedback(value, feedbackConfig) : null,
    [feedbackConfig, value],
  );

  if (!feedback) {
    return null;
  }

  const style = LEVEL_STYLES[feedback.level];

  return (
    <div
      aria-live="polite"
      data-field-key={fieldKey}
      data-section-key={sectionKey}
      className={`mt-3 rounded-[0.95rem] border px-4 py-3 ${style.border} ${style.bg}`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`rounded-full px-3 py-1 text-[0.68rem] font-black uppercase tracking-[0.14em] ${style.badge}`}
        >
          {style.label}
        </span>
        {typeof feedback.clarityScore === "number" ? (
          <span className="text-xs font-semibold text-[var(--text-muted)]">
            Clarté : {feedback.clarityScore}/100 ({getClarityLabel(feedback.clarityScore)})
          </span>
        ) : null}
      </div>
      <p className={`mt-2 text-sm leading-6 ${style.text}`}>{feedback.message}</p>
    </div>
  );
}
