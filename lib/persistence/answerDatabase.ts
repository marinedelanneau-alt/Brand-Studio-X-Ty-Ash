import Dexie, { type EntityTable } from "dexie";
import type {
  AnswerHistoryRecord,
  AnswerMutation,
  LocalAnswerRecord,
} from "./types";

class BrandStudioAnswerDatabase extends Dexie {
  answers!: EntityTable<LocalAnswerRecord, "key">;
  mutations!: EntityTable<AnswerMutation, "id">;
  history!: EntityTable<AnswerHistoryRecord, "id">;

  constructor() {
    super("brand-studio-offline-answers");
    this.version(2).stores({
      answers: "&key, userId, [userId+projectId+moduleId], exerciseId, updatedAt, syncedAt",
      mutations:
        "&id, &answerKey, userId, [userId+projectId+moduleId], syncStatus, nextRetryAt, updatedAt",
      history: "&id, answerKey, [answerKey+updatedAt], updatedAt",
    });
  }
}

let database: BrandStudioAnswerDatabase | null = null;

export function getAnswerDatabase() {
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB n'est pas disponible dans cet environnement.");
  }

  database ??= new BrandStudioAnswerDatabase();
  return database;
}

export async function clearAnswerDatabaseForUser(userId: number) {
  const db = getAnswerDatabase();
  await db.transaction("rw", db.answers, db.mutations, db.history, async () => {
    const answers = await db.answers.where("userId").equals(userId).toArray();
    const answerKeys = answers.map((answer) => answer.key);
    await db.answers.bulkDelete(answerKeys);
    await db.mutations.where("userId").equals(userId).delete();
    for (const answerKey of answerKeys) {
      await db.history.where("answerKey").equals(answerKey).delete();
    }
  });
}
