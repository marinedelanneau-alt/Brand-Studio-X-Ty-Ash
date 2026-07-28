"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { syncAnswerMutations } from "@/app/sync-answer-mutations";
import {
  acknowledgeMutations,
  failMutations,
  getPendingMutations,
  loadLocalModuleAnswers,
  markMutationsSyncing,
} from "@/lib/persistence/answerRepository";
import type { AnswerPersistenceScope, LocalAnswerRecord } from "@/lib/persistence/types";

export type AnswerSyncStatus = "local" | "syncing" | "synced" | "offline" | "error";

function debugSync(event: string, details?: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "production") {
    console.info(`[Brand Studio sync] ${event}`, details ?? {});
  }
}

export function useAnswerSync(input: {
  scope: AnswerPersistenceScope;
  enabled: boolean;
  changeToken: number;
  onRemoteAnswers: (answers: LocalAnswerRecord[]) => void;
}) {
  const [status, setStatus] = useState<AnswerSyncStatus>("local");
  const [errorMessage, setErrorMessage] = useState("");
  const syncingRef = useRef(false);
  const syncRequestedRef = useRef(false);
  const syncRef = useRef<() => Promise<void>>(async () => undefined);
  const retryTimerRef = useRef<number | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);
  const onRemoteAnswersRef = useRef(input.onRemoteAnswers);
  onRemoteAnswersRef.current = input.onRemoteAnswers;
  const { userId, projectId, moduleId } = input.scope;
  const scopeKey = `${userId}:${projectId}:${moduleId}`;
  const enabled = input.enabled;

  const sync = useCallback(async () => {
    if (!enabled) return;
    if (syncingRef.current) {
      syncRequestedRef.current = true;
      return;
    }
    if (!navigator.onLine) {
      setStatus("offline");
      return;
    }

    const scope = { userId, projectId, moduleId };
    const mutations = await getPendingMutations(scope);
    if (mutations.length === 0) {
      setStatus("synced");
      setErrorMessage("");
      return;
    }

    syncingRef.current = true;
    setStatus("syncing");
    await markMutationsSyncing(mutations.map((mutation) => mutation.id));
    debugSync("start", { count: mutations.length, scope: scopeKey });

    try {
      const result = await syncAnswerMutations(
        mutations.map((mutation) => ({
          id: mutation.id,
          userId: mutation.userId,
          projectId: mutation.projectId,
          moduleId: mutation.moduleId,
          exerciseId: mutation.exerciseId,
          values: mutation.values,
          revision: mutation.revision,
          updatedAt: mutation.updatedAt,
          operation: mutation.operation,
        })),
      );
      const merged = await acknowledgeMutations(scope, result.answers);
      onRemoteAnswersRef.current(merged);
      setStatus("synced");
      setErrorMessage("");
      debugSync("success", { count: mutations.length });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Synchronisation impossible.";
      await failMutations(mutations.map((mutation) => mutation.id), message);
      setStatus(navigator.onLine ? "error" : "offline");
      setErrorMessage(message);
      const delay = Math.min(
        1000 * 2 ** (Math.max(...mutations.map((item) => item.retryCount), 0) + 1),
        30000,
      );
      retryTimerRef.current = window.setTimeout(() => void sync(), delay);
      debugSync("error", { message, delay });
    } finally {
      syncingRef.current = false;
      if (syncRequestedRef.current) {
        syncRequestedRef.current = false;
        queueMicrotask(() => void syncRef.current());
      }
    }
  }, [enabled, moduleId, projectId, scopeKey, userId]);
  syncRef.current = sync;

  useEffect(() => {
    if (!enabled) return;
    const timeoutId = window.setTimeout(() => void sync(), 700);
    return () => window.clearTimeout(timeoutId);
  }, [input.changeToken, enabled, sync]);

  useEffect(() => {
    const handleOnline = () => void sync();
    const handleOffline = () => setStatus("offline");
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [sync]);

  useEffect(() => {
    if (!enabled || typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel(`brand-studio-answers:${scopeKey}`);
    channelRef.current = channel;
    channel.onmessage = (event: MessageEvent<{ type: string; answer?: LocalAnswerRecord }>) => {
      if (event.data.type === "answer-updated" && event.data.answer) {
        const exerciseId = event.data.answer.exerciseId;
        void loadLocalModuleAnswers({ userId, projectId, moduleId }).then((records) => {
          const current = records.find((record) => record.exerciseId === exerciseId);
          if (current) onRemoteAnswersRef.current([current]);
        });
      }
      if (event.data.type === "sync-request") void sync();
    };
    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [enabled, moduleId, projectId, scopeKey, sync, userId]);

  useEffect(() => () => {
    if (retryTimerRef.current !== null) window.clearTimeout(retryTimerRef.current);
  }, []);

  const broadcastAnswer = useCallback((answer: LocalAnswerRecord) => {
    channelRef.current?.postMessage({ type: "answer-updated", answer });
  }, []);

  return { status, errorMessage, sync, broadcastAnswer };
}
