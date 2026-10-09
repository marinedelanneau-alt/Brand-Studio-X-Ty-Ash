import { afterEach, expect, it } from "vitest";
import { flushAdminDraftSaves, registerAdminDraftSaver } from "../lib/admin-draft-save-coordinator";

const cleanup: Array<() => void> = [];
afterEach(() => { cleanup.splice(0).forEach((remove) => remove()); });

it("waits for pending autosave and serializes modules before publication", async () => {
  const events: string[] = [];
  let finish!: () => void;
  const pending = new Promise<void>((resolve) => { finish = resolve; });
  cleanup.push(registerAdminDraftSaver("1", async () => { events.push("saving-1"); await pending; events.push("saved-1"); }));
  cleanup.push(registerAdminDraftSaver("2", async () => { events.push("saved-2"); }));
  const publish = (async () => { await flushAdminDraftSaves(); events.push("published"); })();
  expect(events).toEqual(["saving-1"]);
  finish();
  await publish;
  expect(events).toEqual(["saving-1", "saved-1", "saved-2", "published"]);
});

it("does not publish if saving fails", async () => {
  let published = false;
  cleanup.push(registerAdminDraftSaver("1", async () => { throw new Error("Sauvegarde impossible"); }));
  await expect((async () => { await flushAdminDraftSaves(); published = true; })()).rejects.toThrow("Sauvegarde impossible");
  expect(published).toBe(false);
});

it("ignores unmounted forms without deleting a newer registration", async () => {
  let saves = 0;
  const removeOld = registerAdminDraftSaver("1", async () => { throw new Error("Old form"); });
  const removeNew = registerAdminDraftSaver("1", async () => { saves++; });
  cleanup.push(removeNew);
  removeOld();
  await flushAdminDraftSaves();
  expect(saves).toBe(1);
  removeNew();
  await flushAdminDraftSaves();
  expect(saves).toBe(1);
});
