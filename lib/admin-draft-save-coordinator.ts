// Browser-only coordination. Every saver still calls the same controlled-draft
// server action; publication never reads a second client-side draft store.
const savers = new Map<string, () => Promise<void>>();

export function registerAdminDraftSaver(key: string, save: () => Promise<void>) {
  savers.set(key, save);
  return () => { if (savers.get(key) === save) savers.delete(key); };
}

export async function flushAdminDraftSaves() {
  // Serialize modules because they share the same release snapshot revision.
  for (const save of [...savers.values()]) await save();
}
