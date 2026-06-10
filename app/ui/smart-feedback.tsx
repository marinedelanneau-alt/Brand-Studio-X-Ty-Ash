"use client";

import { useMemo } from "react";
import {
  evaluateSmartFeedback,
  getClarityLabel,
  type SmartFeedbackConfig,
} from "@/lib/smart-feedback";

const LEVEL_STYLES = {
  improve: {
    border: "border-[#eadfca]",
    bg: "bg-[#fffaf4]",
    text: "text-[#7f6856]",
    badge: "bg-[#f7ead7] text-[#b07b48]",
    label: "À ajuster",
  },
  warning: {
    border: "border-[#e8dccb]",
    bg: "bg-[#fffaf6]",
    text: "text-[#7b6453]",
    badge: "bg-[#f6e7db] text-[#b16f52]",
    label: "À préciser",
  },
  good: {
    border: "border-[#dde7df]",
    bg: "bg-[#fbfdfb]",
    text: "text-[#5d6f61]",
    badge: "bg-[#e9f1eb] text-[#5f8d63]",
    label: "Bonne base",
  },
  excellent: {
    border: "border-[#e8dec7]",
    bg: "bg-[#fffdf8]",
    text: "text-[#6a5c44]",
    badge: "bg-[#fff1d9] text-[#c08a2c]",
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
          <span className="text-xs font-semibold text-[#8a8077]">
            Clarté : {feedback.clarityScore}/100 ({getClarityLabel(feedback.clarityScore)})
          </span>
        ) : null}
      </div>
      <p className={`mt-2 text-sm leading-6 ${style.text}`}>{feedback.message}</p>
    </div>
  );
}
