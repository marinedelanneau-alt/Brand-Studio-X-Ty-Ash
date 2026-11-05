import type { CSSProperties } from "react";

// Exact /brand-guide reference. CSS px become PDF points at 96 dpi.
// Background tokens only: cards, borders and charts retain their own colors.
export const TYASH_PAPER = {
  background: "#F4F0DF", line: "#E5DFC9", opacity: 0.4,
  cellPx: 23, strokePx: 1,
} as const;
const line = `${TYASH_PAPER.line}${Math.round(TYASH_PAPER.opacity * 255).toString(16).padStart(2, "0")}`;
export const TYASH_PAPER_STYLE = {
  backgroundColor: TYASH_PAPER.background,
  backgroundImage: `linear-gradient(${line} ${TYASH_PAPER.strokePx}px, transparent ${TYASH_PAPER.strokePx}px), linear-gradient(90deg, ${line} ${TYASH_PAPER.strokePx}px, transparent ${TYASH_PAPER.strokePx}px)`,
  backgroundSize: `${TYASH_PAPER.cellPx}px ${TYASH_PAPER.cellPx}px`,
  backgroundPosition: "0 0", backgroundRepeat: "repeat",
} satisfies CSSProperties;

export const TYASH_PAPER_VARIABLES = {
  "--tyash-paper-color": TYASH_PAPER_STYLE.backgroundColor,
  "--tyash-paper-image": TYASH_PAPER_STYLE.backgroundImage,
  "--tyash-paper-size": TYASH_PAPER_STYLE.backgroundSize,
} as CSSProperties;

export const TYASH_PAPER_PDF = {
  ...TYASH_PAPER,
  cellPt: TYASH_PAPER.cellPx * 72 / 96,
  strokePt: TYASH_PAPER.strokePx * 72 / 96,
};

export function usesTyashPaper() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL === "https://cplzwnlstcpqqzqeawgs.supabase.co";
}
