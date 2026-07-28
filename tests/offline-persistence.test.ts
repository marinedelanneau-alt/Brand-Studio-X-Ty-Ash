import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { getAnswerDatabase } from "../lib/persistence/answerDatabase";
import {
  failMutations,
  getPendingMutations,
  acknowledgeMutations,
  loadLocalModuleAnswers,
  mergeRemoteModuleAnswers,
  persistLocalAnswer,
  restoreAnswerVersion,
} from "../lib/persistence/answerRepository";
import { resolveAnswerConflict } from "../lib/persistence/conflictResolver";
import type { AnswerPersistenceScope } from "../lib/persistence/types";

const scope: AnswerPersistenceScope = { userId: 11, projectId: 22, moduleId: 33 };

beforeEach(async () => {
  const db = getAnswerDatabase();
  await db.answers.clear();
  await db.mutations.clear();
  await db.history.clear();
});

describe("offline-first answer repository", () => {
  it("writes locally and queues immediately, including very long answers", async () => {
    const value = "réponse ".repeat(20_000);
    const saved = await persistLocalAnswer({ scope, exerciseId: 1, values: [value], explicitDelete: false });
    expect(saved.revision).toBe(1);
    expect((await loadLocalModuleAnswers(scope))[0]?.values[0]).toBe(value);
    expect((await getPendingMutations(scope))[0]?.values[0]).toBe(value);
  });

  it("survives a repository reload because answers and queue are persistent", async () => {
    await persistLocalAnswer({ scope, exerciseId: 2, values: ["durable"], explicitDelete: false });
    const reloaded = await loadLocalModuleAnswers({ ...scope });
    expect(reloaded[0]?.values).toEqual(["durable"]);
    expect(await getAnswerDatabase().mutations.count()).toBe(1);
  });

  it("ignores a legacy record with an incomplete compound key", async () => {
    const db = getAnswerDatabase();
    await db.table("answers").put({
      key: "legacy-incomplete",
      userId: scope.userId,
      projectId: scope.projectId,
      exerciseId: 999,
      values: ["ancienne donnée invalide"],
      revision: 1,
      updatedAt: Date.now(),
      deleted: false,
      syncedAt: null,
    });
    await persistLocalAnswer({
      scope,
      exerciseId: 11,
      values: ["réponse valide"],
      explicitDelete: false,
    });

    const loaded = await loadLocalModuleAnswers(scope);
    expect(loaded.map((answer) => answer.values)).toEqual([["réponse valide"]]);
    expect(await getPendingMutations(scope)).toHaveLength(1);
  });

  it("increments revisions and keeps only the five previous versions", async () => {
    for (let index = 1; index <= 8; index += 1) {
      await persistLocalAnswer({ scope, exerciseId: 3, values: [`v${index}`], explicitDelete: false });
    }
    const answer = (await loadLocalModuleAnswers(scope))[0];
    expect(answer.revision).toBe(8);
    expect(await getAnswerDatabase().history.where("answerKey").equals(answer.key).count()).toBe(5);
  });

  it("never lets an older remote version replace a newer local version", async () => {
    const local = await persistLocalAnswer({ scope, exerciseId: 4, values: ["nouveau"], explicitDelete: false });
    const merged = await mergeRemoteModuleAnswers(scope, [{
      exerciseId: 4,
      values: ["ancien"],
      revision: Math.max(0, local.revision - 1),
      updatedAt: local.updatedAt - 1,
      deleted: false,
    }]);
    expect(merged[0]?.values).toEqual(["nouveau"]);
    expect(await getAnswerDatabase().mutations.count()).toBe(1);
  });

  it("accepts a newer remote version and acknowledges the queue", async () => {
    const local = await persistLocalAnswer({ scope, exerciseId: 5, values: ["local"], explicitDelete: false });
    const merged = await mergeRemoteModuleAnswers(scope, [{
      exerciseId: 5,
      values: ["distant récent"],
      revision: local.revision + 1,
      updatedAt: local.updatedAt + 1,
      deleted: false,
    }]);
    expect(merged[0]?.values).toEqual(["distant récent"]);
    expect(await getAnswerDatabase().mutations.count()).toBe(0);
  });

  it("acknowledges an exact server echo and removes it from the queue", async () => {
    const local = await persistLocalAnswer({
      scope,
      exerciseId: 10,
      values: ["enregistrée"],
      explicitDelete: false,
    });
    const merged = await acknowledgeMutations(scope, [{
      exerciseId: local.exerciseId,
      values: local.values,
      revision: local.revision,
      updatedAt: local.updatedAt,
      deleted: false,
    }]);

    expect(merged[0]?.values).toEqual(["enregistrée"]);
    expect(await getAnswerDatabase().mutations.count()).toBe(0);
  });

  it("records deletion only as an explicit delete mutation", async () => {
    await persistLocalAnswer({ scope, exerciseId: 6, values: ["à supprimer"], explicitDelete: false });
    const deleted = await persistLocalAnswer({ scope, exerciseId: 6, values: [], explicitDelete: true });
    expect(deleted.deleted).toBe(true);
    expect((await getPendingMutations(scope))[0]?.operation).toBe("delete");
  });

  it("keeps failed mutations and applies progressive retry metadata", async () => {
    await persistLocalAnswer({ scope, exerciseId: 7, values: ["hors ligne"], explicitDelete: false });
    await failMutations([(await getAnswerDatabase().mutations.toArray())[0].id], "network error");
    const queued = (await getAnswerDatabase().mutations.toArray())[0];
    expect(queued.syncStatus).toBe("error");
    expect(queued.retryCount).toBe(1);
    expect(queued.nextRetryAt).toBeGreaterThan(Date.now());
  });

  it("restores a local historical version as a new revision", async () => {
    const first = await persistLocalAnswer({ scope, exerciseId: 8, values: ["première"], explicitDelete: false });
    await persistLocalAnswer({ scope, exerciseId: 8, values: ["seconde"], explicitDelete: false });
    const restored = await restoreAnswerVersion(first.key, first.revision);
    expect(restored?.values).toEqual(["première"]);
    expect(restored?.revision).toBe(3);
  });

  it("uses revision to resolve simultaneous equal-timestamp changes", () => {
    const base = { exerciseId: 9, values: ["local"], revision: 3, updatedAt: 100, deleted: false };
    const local = { ...scope, ...base, key: "k", questionId: "q", syncedAt: null };
    const resolved = resolveAnswerConflict(local, { ...base, values: ["remote"], revision: 4 });
    expect(resolved?.source).toBe("remote");
  });
});
