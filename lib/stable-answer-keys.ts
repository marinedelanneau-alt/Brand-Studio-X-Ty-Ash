export function getStableExerciseAnswerKey(input: {
  modulePosition: number;
  submodulePosition: number | null;
  exercisePosition: number;
}) {
  const scope = input.submodulePosition === null
    ? "module_root"
    : `submodule_position_${input.submodulePosition}`;
  return `module_position_${input.modulePosition}_${scope}_exercise_position_${input.exercisePosition}`;
}

export function getStableBrowserExerciseSlot(input: {
  submodulePosition: number | null;
  exercisePosition: number;
}) {
  return (input.submodulePosition ?? 0) * 1_000_000 + input.exercisePosition;
}
