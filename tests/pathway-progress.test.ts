import { describe, expect, it } from "vitest";
import { getPathwayProgress } from "../lib/pathway-progress";

const progress = (answeredCount: number, exerciseCount: number, isCompleted = answeredCount === exerciseCount) => ({ answeredCount, exerciseCount, isCompleted });

describe("pathway progress", () => {
  it("rounds once after averaging exact module ratios", () => {
    // Initial saved state before answering another question in the first module.
    expect(getPathwayProgress([progress(1, 3), progress(0, 1)])).toBe(17);
    // The former live delta from an already rounded 17% produced 34%.
    expect(getPathwayProgress([progress(2, 3), progress(0, 1)])).toBe(33);
  });

  it("reserves 100% for a fully completed pathway", () => {
    expect(getPathwayProgress([progress(199, 200), progress(1, 1)])).toBe(99);
    expect(getPathwayProgress([progress(200, 200), progress(1, 1)])).toBe(100);
    expect(getPathwayProgress([progress(198, 200), progress(1, 1)])).toBe(99);
  });

  it("handles empty, optional-only and manually completed modules", () => {
    expect(getPathwayProgress([])).toBe(0);
    expect(getPathwayProgress([progress(0, 0, false)])).toBe(0);
    expect(getPathwayProgress([progress(0, 0, true)])).toBe(100);
    expect(getPathwayProgress([progress(0, 3, true)])).toBe(100);
  });
});
