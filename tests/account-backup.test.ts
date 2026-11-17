import { describe, expect, it, vi } from "vitest";
import { unzipSync, strToU8, strFromU8 } from "fflate";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: vi.fn() }));
import { streamAccountBackup } from "../lib/account-backup";
import { accountStoragePrefixes, listAccountFiles } from "../lib/account-storage";
import type { SupabaseClient } from "@supabase/supabase-js";

describe("self-contained account backup", () => {
  it("creates an extractable ZIP containing answers and original binary files", async () => {
    const download = vi.fn().mockResolvedValue({ data: new Blob([new Uint8Array([0, 1, 255, 15])]), error: null });
    const db = { storage: { from: () => ({ download }) } } as unknown as SupabaseClient;
    const stream = streamAccountBackup({ db, storagePaths: ["projects/12/logo.png"], dataFiles: { "donnees.json": strToU8('{"answer":"Réponse"}') } });
    const result = unzipSync(new Uint8Array(await new Response(stream).arrayBuffer()));
    expect(strFromU8(result["donnees.json"])).toContain("Réponse");
    expect([...result["fichiers/projects/12/logo.png"]]).toEqual([0, 1, 255, 15]);
    expect(download).toHaveBeenCalledWith("projects/12/logo.png");
  });
  it("fails the download if an original file cannot be read", async () => {
    const db = { storage: { from: () => ({ download: async () => ({ data: null, error: new Error("missing") }) }) } } as unknown as SupabaseClient;
    const response = new Response(streamAccountBackup({ db, storagePaths: ["projects/12/logo.png"], dataFiles: {} }));
    await expect(response.arrayBuffer()).rejects.toThrow("indisponible");
  });
  it("scopes files to exact owned directories and paginates beyond 100 items", async () => {
    const list = vi.fn().mockImplementation(async (prefix: string, options: { offset: number }) => ({ data: prefix === "projects/12" && !options.offset
      ? Array.from({ length: 100 }, (_, index) => ({ id: `id-${index}`, name: `${index}.png` }))
      : prefix === "projects/12" ? [{ id: "id-100", name: "100.png" }] : [], error: null }));
    const db = { storage: { from: () => ({ list }) } } as unknown as SupabaseClient;
    const prefixes = accountStoragePrefixes(12, [99]);
    expect(prefixes).toEqual(["projects/12", "exercise-images/99", "exercise-fonts/99"]);
    expect(await listAccountFiles(db, prefixes)).toHaveLength(101);
    expect(list.mock.calls.every(([prefix]) => prefixes.includes(prefix))).toBe(true);
  });
});
