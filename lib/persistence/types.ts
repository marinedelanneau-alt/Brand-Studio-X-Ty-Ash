export type AnswerPersistenceScope = {
  userId: number;
  projectId: number;
  moduleId: number;
};

export type LocalAnswerRecord = AnswerPersistenceScope & {
  key: string;
  exerciseId: number;
  questionId: string;
  values: string[];
  revision: number;
  updatedAt: number;
  deleted: boolean;
  syncedAt: number | null;
};

export type AnswerMutation = AnswerPersistenceScope & {
  id: string;
  answerKey: string;
  exerciseId: number;
  questionId: string;
  values: string[];
  revision: number;
  updatedAt: number;
  operation: "upsert" | "delete";
  retryCount: number;
  syncStatus: "pending" | "syncing" | "error";
  lastError: string;
  nextRetryAt: number;
};

export type AnswerHistoryRecord = {
  id: string;
  answerKey: string;
  values: string[];
  revision: number;
  updatedAt: number;
  deleted: boolean;
};

export type RemoteAnswerVersion = {
  exerciseId: number;
  values: string[];
  revision: number;
  updatedAt: number;
  deleted: boolean;
};

export function getAnswerKey(
  scope: AnswerPersistenceScope,
  exerciseId: number,
) {
  return `${scope.userId}:${scope.projectId}:${scope.moduleId}:${exerciseId}`;
}

export function getModuleScopeKey(scope: AnswerPersistenceScope) {
  return `${scope.userId}:${scope.projectId}:${scope.moduleId}`;
}
