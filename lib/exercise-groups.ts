export type ExerciseGroupItem = {
  id: number | string;
  exercise_group_id?: string | null;
};

export type ExerciseGroup<T extends ExerciseGroupItem> = {
  id: string;
  position: number;
  questions: T[];
};

export function groupExercisesByGroupId<T extends ExerciseGroupItem>(exercises: T[]) {
  const groups: ExerciseGroup<T>[] = [];
  const groupIndexById = new Map<string, number>();

  exercises.forEach((exercise, exerciseIndex) => {
    const groupId =
      exercise.exercise_group_id?.trim() || `exercise-${exercise.id ?? exerciseIndex + 1}`;
    const existingGroupIndex = groupIndexById.get(groupId);

    if (existingGroupIndex === undefined) {
      groupIndexById.set(groupId, groups.length);
      groups.push({
        id: groupId,
        position: groups.length + 1,
        questions: [exercise],
      });
      return;
    }

    groups[existingGroupIndex].questions.push(exercise);
  });

  return groups;
}
