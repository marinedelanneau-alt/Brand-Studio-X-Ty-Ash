import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export function accountStoragePrefixes(accountId: number, projectIds: number[]): string[] {
  return [`projects/${accountId}`, ...projectIds.flatMap(id => [`exercise-images/${id}`, `exercise-fonts/${id}`])];
}

// Directory listing is paginated at every depth; prefix boundaries prevent
// account 12 from matching account 123 or any shared Admin assets.
export async function listAccountFiles(db: SupabaseClient, prefixes: string[]): Promise<string[]> {
  const files: string[] = [];
  const pending = [...prefixes];
  while (pending.length) {
    const prefix = pending.pop()!;
    for (let offset = 0; ; offset += 100) {
      const { data, error } = await db.storage.from("project-assets").list(prefix, {
        limit: 100, offset, sortBy: { column: "name", order: "asc" },
      });
      if (error) throw new Error(`Storage listing failed: ${error.message}`);
      for (const item of data ?? []) {
        if (!item.name || item.name.includes("/") || item.name === "." || item.name === "..") throw new Error("Unexpected storage path");
        const path = `${prefix}/${item.name}`;
        if (item.id) files.push(path);
        else pending.push(path);
      }
      if ((data?.length ?? 0) < 100) break;
    }
  }
  return files;
}

export async function removeAccountFiles(db: SupabaseClient, accountId: number, projectIds: number[]) {
  const files = await listAccountFiles(db, accountStoragePrefixes(accountId, projectIds));
  for (let index = 0; index < files.length; index += 100) {
    const { error } = await db.storage.from("project-assets").remove(files.slice(index, index + 100));
    if (error) throw new Error(`Storage deletion failed: ${error.message}`);
  }
}
