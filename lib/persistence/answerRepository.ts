import { getAnswerDatabase } from "./answerDatabase";
import { resolveAnswerConflict } from "./conflictResolver";
import {
  getAnswerKey,
  type AnswerMutation,
  type AnswerPersistenceScope,
  type LocalAnswerRecord,
  type RemoteAnswerVersion,
} from "./types";

const HISTORY_LIMIT = 5;

function moduleQuery(scope: AnswerPersistenceScope) {
  return [scope.userId, scope.projectId, scope.moduleId] as [number, number, number];
}

export async function loadLocalModuleAnswers(scope: AnswerPersistenceScope) {
  return getAnswerDatabase().answers
    .where("[userId+projectId+moduleId]")
    .equals(moduleQuery(scope))
    .toArray();
}

export async function persistLocalAnswer(input: {
  scope: AnswerPersistenceScope;
  exerciseId: number;
  values: string[];
  explicitDelete: boolean;
}) {
  const db = getAnswerDatabase();
  const key = getAnswerKey(input.scope, input.exerciseId);
  let saved!: LocalAnswerRecord;

  await db.transaction("rw", db.answers, db.mutations, db.history, async () => {
    const previous = await db.answers.get(key);
    const now = Math.max(Date.now(), (previous?.updatedAt ?? 0) + 1);
    const revision = (previous?.revision ?? 0) + 1;

    if (previous) {
      await db.history.put({
        id: `${key}:${previous.revision}:${previous.updatedAt}`,
        answerKey: key,
        values: [...previous.values],
        revision: previous.revision,
        updatedAt: previous.updatedAt,
        deleted: previous.deleted,
      });
    }

    saved = {
      ...input.scope,
      key,
      exerciseId: input.exerciseId,
      questionId: `question_${input.exerciseId}`,
      values: [...input.values],
      revision,
      updatedAt: now,
      deleted: input.explicitDelete,
      syncedAt: null,
    };
    await db.answers.put(saved);

    const mutation: AnswerMutation = {
      ...input.scope,
      id: key,
      answerKey: key,
      exerciseId: input.exerciseId,
      questionId: saved.questionId,
      values: [...input.values],
      revision,
      updatedAt: now,
      operation: input.explicitDelete ? "delete" : "upsert",
      retryCount: 0,
      syncStatus: "pending",
      lastError: "",
      nextRetryAt: now,
    };
    await db.mutations.put(mutation);

    const history = await db.history.where("answerKey").equals(key).sortBy("updatedAt");
    if (history.length > HISTORY_LIMIT) {
      await db.history.bulkDelete(
        history.slice(0, history.length - HISTORY_LIMIT).map((item) => item.id),
      );
    }
  });

  return saved;
}

export async function mergeRemoteModuleAnswers(
  scope: AnswerPersistenceScope,
  remoteAnswers: RemoteAnswerVersion[],
) {
  const db = getAnswerDatabase();
  const localAnswers = await loadLocalModuleAnswers(scope);
  const localByExercise = new Map(localAnswers.map((answer) => [answer.exerciseId, answer]));
  const remoteByExercise = new Map(remoteAnswers.map((answer) => [answer.exerciseId, answer]));
  const exerciseIds = new Set([...localByExercise.keys(), ...remoteByExercise.keys()]);
  const merged: LocalAnswerRecord[] = [];

  await db.transaction("rw", db.answers, db.mutations, async () => {
    for (const exerciseId of exerciseIds) {
      const local = localByExercise.get(exerciseId);
      const remote = remoteByExercise.get(exerciseId);
      const resolved = resolveAnswerConflict(local, remote);
      if (!resolved) continue;

      const answer: LocalAnswerRecord = {
        ...scope,
        key: getAnswerKey(scope, exerciseId),
        exerciseId,
        questionId: `question_${exerciseId}`,
        values: [...resolved.answer.values],
        revision: resolved.answer.revision,
        updatedAt: resolved.answer.updatedAt,
        deleted: resolved.answer.deleted,
        syncedAt: resolved.source === "remote" ? Date.now() : (local?.syncedAt ?? null),
      };
      await db.answers.put(answer);
      if (resolved.source === "remote") {
        await db.mutations.delete(answer.key);
      }
      merged.push(answer);
    }
  });

  return merged;
}

export async function getPendingMutations(scope: AnswerPersistenceScope) {
  const now = Date.now();
  const mutations = await getAnswerDatabase().mutations
    .where("[userId+projectId+moduleId]")
    .equals(moduleQuery(scope))
    .toArray();
  return mutations.filter((mutation) => mutation.nextRetryAt <= now);
}

export async function markMutationsSyncing(ids: string[]) {
  const db = getAnswerDatabase();
  await db.mutations.where("id").anyOf(ids).modify({ syncStatus: "syncing" });
}

export async function acknowledgeMutations(
  scope: AnswerPersistenceScope,
  remoteAnswers: RemoteAnswerVersion[],
) {
  const merged = await mergeRemoteModuleAnswers(scope, remoteAnswers);
  const db = getAnswerDatabase();

  // An exact server echo is a successful acknowledgement too. The conflict
  // resolver deliberately keeps the local record on an exact tie, so relying
  // on `source === "remote"` alone leaves the mutation queued forever.
  await db.transaction("rw", db.mutations, async () => {
    for (const remote of remoteAnswers) {
      const mutationId = getAnswerKey(scope, remote.exerciseId);
      const pending = await db.mutations.get(mutationId);
      if (!pending) continue;

      const serverHasAcknowledgedThisMutation =
        remote.updatedAt > pending.updatedAt ||
        (
          remote.updatedAt === pending.updatedAt &&
          remote.revision >= pending.revision &&
          remote.deleted === (pending.operation === "delete") &&
          JSON.stringify(remote.values) === JSON.stringify(pending.values)
        );

      if (serverHasAcknowledgedThisMutation) {
        await db.mutations.delete(mutationId);
      }
    }
  });

  return merged;
}

export async function failMutations(ids: string[], message: string) {
  const db = getAnswerDatabase();
  await db.transaction("rw", db.mutations, async () => {
    for (const id of ids) {
      const mutation = await db.mutations.get(id);
      if (!mutation) continue;
      const retryCount = mutation.retryCount + 1;
      await db.mutations.update(id, {
        retryCount,
        syncStatus: "error",
        lastError: message,
        nextRetryAt: Date.now() + Math.min(1000 * 2 ** retryCount, 30000),
      });
    }
  });
}

export async function restoreAnswerVersion(answerKey: string, revision: number) {
  const db = getAnswerDatabase();
  const version = await db.history
    .where("answerKey")
    .equals(answerKey)
    .filter((item) => item.revision === revision)
    .first();
  const current = await db.answers.get(answerKey);
  if (!version || !current) return null;
  return persistLocalAnswer({
    scope: current,
    exerciseId: current.exerciseId,
    values: version.values,
    explicitDelete: version.deleted,
  });
}
