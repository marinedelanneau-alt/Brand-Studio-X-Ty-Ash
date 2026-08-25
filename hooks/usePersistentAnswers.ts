"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { WorkspaceModule } from "@/lib/training-types";
import {
  loadLocalModuleAnswers,
  mergeRemoteModuleAnswers,
  persistLocalAnswer,
} from "@/lib/persistence/answerRepository";
import type { AnswerPersistenceScope, LocalAnswerRecord, RemoteAnswerVersion } from "@/lib/persistence/types";
import { useAnswerSync } from "./useAnswerSync";

type AnswersByExercise = Record<number, string[]>;

function hasValue(values: string[]) {
  return values.some((value) => value.trim().length > 0);
}

export function usePersistentAnswers(input: {
  module: WorkspaceModule;
  scope: AnswerPersistenceScope;
  initialAnswers: AnswersByExercise;
}) {
  const [answers, setAnswersState] = useState<AnswersByExercise>(input.initialAnswers);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [changeToken, setChangeToken] = useState(0);
  const userInteractionRef = useRef(false);
  const locallyEditedDuringHydrationRef = useRef(new Set<number>());
  const answersRef = useRef(answers);
  const broadcastAnswerRef = useRef<(answer: LocalAnswerRecord) => void>(() => undefined);
  const { userId, projectId, moduleId } = input.scope;
  const exercisesRef = useRef(input.module.exercises);

  const remoteVersions = useMemo<RemoteAnswerVersion[]>(
    () =>
      input.module.exercises.map((exercise) => ({
        exerciseId: exercise.id,
        values: input.module.answers[exercise.id] ?? [],
        revision: input.module.answerVersions[exercise.id]?.revision ?? 0,
        updatedAt: input.module.answerVersions[exercise.id]?.updatedAt ?? 0,
        deleted: (input.module.answers[exercise.id] ?? []).length === 0,
      })).filter((answer) => answer.updatedAt > 0 || hasValue(answer.values)),
    [input.module],
  );

  const applyRecords = useCallback((records: LocalAnswerRecord[]) => {
      const current = answersRef.current;
      const next = { ...current };
      let changed = false;
      for (const record of records) {
        if (
          locallyEditedDuringHydrationRef.current.has(record.exerciseId)
        ) {
          continue;
        }
        const values = record.deleted ? [] : record.values;
        if (JSON.stringify(next[record.exerciseId] ?? []) !== JSON.stringify(values)) {
          next[record.exerciseId] = [...values];
          changed = true;
        }
      }
      if (changed) {
        answersRef.current = next;
        setAnswersState(next);
      }
  }, []);

  const sync = useAnswerSync({
    scope: { userId, projectId, moduleId },
    enabled: hasHydrated,
    changeToken,
    onRemoteAnswers: applyRecords,
  });
  useEffect(() => {
    broadcastAnswerRef.current = sync.broadcastAnswer;
  }, [sync.broadcastAnswer]);

  useEffect(() => {
    exercisesRef.current = input.module.exercises;
  }, [input.module.exercises]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const scope = { userId, projectId, moduleId };
      const localFirst = await loadLocalModuleAnswers(scope);
      if (cancelled) return;
      applyRecords(localFirst);

      const merged = await mergeRemoteModuleAnswers(scope, remoteVersions);
      if (cancelled) return;
      applyRecords(merged);
      locallyEditedDuringHydrationRef.current.clear();

      const knownExerciseIds = new Set(
        [...localFirst, ...merged].map((answer) => answer.exerciseId),
      );
      const browserRecovery = answersRef.current;
      for (const exercise of input.module.exercises) {
        const recoveredValues = browserRecovery[exercise.id] ?? [];
        if (!knownExerciseIds.has(exercise.id) && hasValue(recoveredValues)) {
          const recovered = await persistLocalAnswer({
            scope,
            exerciseId: exercise.id,
            values: recoveredValues,
            explicitDelete: false,
          });
          broadcastAnswerRef.current(recovered);
          setChangeToken((token) => token + 1);
        }
      }
      setHasHydrated(true);

      if (process.env.NODE_ENV !== "production") {
        console.info("[Brand Studio persistence] hydrated", {
          moduleId,
          localCount: localFirst.length,
          mergedCount: merged.length,
        });
      }
    })().catch((error) => {
      if (!cancelled) {
        console.error("[Brand Studio persistence] hydration failed", error);
        setHasHydrated(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [applyRecords, input.module.exercises, moduleId, projectId, remoteVersions, userId]);

  const setAnswers = useCallback(
    (update: AnswersByExercise | ((current: AnswersByExercise) => AnswersByExercise)) => {
        const current = answersRef.current;
        const next = typeof update === "function" ? update(current) : update;
        answersRef.current = next;
        setAnswersState(next);

        for (const exercise of exercisesRef.current) {
          const previousValues = current[exercise.id] ?? [];
          const nextValues = next[exercise.id] ?? [];
          if (JSON.stringify(previousValues) === JSON.stringify(nextValues)) continue;

          if (!hasHydrated) {
            locallyEditedDuringHydrationRef.current.add(exercise.id);
          }

          // An empty transient UI value is never a deletion request. Answer
          // deletion is reserved for an explicit, confirmed account action.
          if (!hasValue(nextValues)) continue;

          void persistLocalAnswer({
            scope: { userId, projectId, moduleId },
            exerciseId: exercise.id,
            values: nextValues,
            explicitDelete: false,
          }).then((record) => {
            broadcastAnswerRef.current(record);
            setChangeToken((token) => token + 1);
          }).catch((error) => {
            console.error("[Brand Studio persistence] local write failed", error);
          });
        }

        userInteractionRef.current = false;
    },
    [hasHydrated, moduleId, projectId, userId],
  );

  const markUserInteraction = useCallback(() => {
    userInteractionRef.current = true;
  }, []);

  return {
    answers,
    setAnswers,
    hasHydrated,
    markUserInteraction,
    syncStatus: sync.status,
    syncError: sync.errorMessage,
    retrySync: sync.sync,
  };
}
