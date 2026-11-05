import { usesTyashPaper } from "@/lib/tyash-paper";

export default function AccessPageBackground() {
  // TYASH's canvas is painted once globally, without extra grid/tint overlays.
  if (usesTyashPaper()) return null;
  return <>
    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(184,171,152,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(184,171,152,0.18)_1px,transparent_1px)] [background-size:34px_34px]" />
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgb(var(--tyash-glow-rgb)/0.24),transparent_20%),radial-gradient(circle_at_88%_18%,rgba(219,232,216,0.45),transparent_20%),radial-gradient(circle_at_78%_84%,rgb(var(--tyash-glow-rgb)/0.18),transparent_22%)]" />
  </>;
}
