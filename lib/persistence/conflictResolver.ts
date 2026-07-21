import type { LocalAnswerRecord, RemoteAnswerVersion } from "./types";

export function resolveAnswerConflict(
  local: LocalAnswerRecord | undefined,
  remote: RemoteAnswerVersion | undefined,
) {
  if (!local) return remote ? { source: "remote" as const, answer: remote } : null;
  if (!remote) return { source: "local" as const, answer: local };

  if (local.updatedAt !== remote.updatedAt) {
    return local.updatedAt > remote.updatedAt
      ? { source: "local" as const, answer: local }
      : { source: "remote" as const, answer: remote };
  }

  return local.revision >= remote.revision
    ? { source: "local" as const, answer: local }
    : { source: "remote" as const, answer: remote };
}
