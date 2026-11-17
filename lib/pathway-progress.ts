import type { ModuleProgress } from "./training-types";

type Progress = Pick<ModuleProgress, "answeredCount" | "exerciseCount" | "isCompleted">;

export function getProgressPercent(progress: Progress): number {
  if (progress.isCompleted) return 100;
  return progress.exerciseCount > 0
    ? Math.max(0, Math.min(100, progress.answeredCount / progress.exerciseCount * 100))
    : 0;
}

// Keep equal module weights, but round only the final result. Completion is
// explicit: rounding must never announce a finished module or pathway early.
export function getPathwayProgress(modules: Progress[]): number {
  if (!modules.length) return 0;
  const percent = Math.round(modules.reduce((sum, progress) => sum + getProgressPercent(progress), 0) / modules.length);
  return Math.min(modules.every(progress => progress.isCompleted) ? 100 : 99, percent);
}
