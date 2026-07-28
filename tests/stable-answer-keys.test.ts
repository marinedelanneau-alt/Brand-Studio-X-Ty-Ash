import { describe, expect, it } from "vitest";
import {
  getStableBrowserExerciseSlot,
  getStableExerciseAnswerKey,
} from "../lib/stable-answer-keys";

describe("stable answer identity", () => {
  it("keeps identical exercise positions in different submodules isolated", () => {
    const first = {
      modulePosition: 1,
      submodulePosition: 1,
      exercisePosition: 1,
    };
    const second = {
      modulePosition: 1,
      submodulePosition: 2,
      exercisePosition: 1,
    };

    expect(getStableExerciseAnswerKey(first)).not.toBe(
      getStableExerciseAnswerKey(second),
    );
    expect(getStableBrowserExerciseSlot(first)).not.toBe(
      getStableBrowserExerciseSlot(second),
    );
  });

  it("keeps a module-level question separate from a submodule question", () => {
    expect(
      getStableExerciseAnswerKey({
        modulePosition: 1,
        submodulePosition: null,
        exercisePosition: 1,
      }),
    ).not.toBe(
      getStableExerciseAnswerKey({
        modulePosition: 1,
        submodulePosition: 1,
        exercisePosition: 1,
      }),
    );
  });
});
