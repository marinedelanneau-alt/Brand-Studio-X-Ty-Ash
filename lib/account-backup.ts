import "server-only";
import { Zip, ZipPassThrough, strToU8 } from "fflate";
import { createSupabaseServerClient } from "./supabase/server";
import { accountStoragePrefixes, listAccountFiles } from "./account-storage";
import type { LifetimeAccount } from "./account-lifetime";

type BackupAccount = LifetimeAccount & {
  id: number; email: string; client_name: string | null; company_name: string | null; created_at: string;
};

export async function prepareAccountBackup(account: BackupAccount) {
  const db = createSupabaseServerClient();
  const { data: projects, error } = await db.from("brand_projects").select("*").eq("account_id", account.id).order("id");
  if (error) throw error;
  const projectIds = (projects ?? []).map(project => project.id as number);
  const records: Record<string, unknown> = {
    account: { email: account.email, name: account.client_name, company: account.company_name, createdAt: account.created_at, accessExpiresAt: account.access_expires_at },
    projects: projects ?? [],
  };
  for (const table of ["user_answers", "user_module_progress", "project_exercise_answers", "project_module_states", "brand_exports", "communication_actions", "tyash_questionnaire_prefills"]) {
    const rows: Record<string, unknown>[] = [];
    for (let offset = 0; ; offset += 500) {
      let query = db.from(table).select("*");
      if (table === "user_answers" || table === "user_module_progress") query = query.eq("user_id", account.id);
      else if (projectIds.length) query = query.in("project_id", projectIds);
      else break;
      query = table === "tyash_questionnaire_prefills"
        ? query.order("project_id").order("question_key")
        : query.order("id");
      const { data, error: readError } = await query.range(offset, offset + 499);
      if (readError) throw readError;
      rows.push(...(data ?? []));
      if ((data?.length ?? 0) < 500) break;
    }
    records[table] = rows;
  }
  const storagePaths = await listAccountFiles(db, accountStoragePrefixes(account.id, projectIds));
  const dataFiles: Record<string, Uint8Array> = {
    "donnees.json": strToU8(JSON.stringify({ exportedAt: new Date().toISOString(), ...records }, null, 2)),
    "LISEZ-MOI.txt": strToU8("Sauvegarde Brand Studio X Ty Ash\n\nLe fichier donnees.json contient votre compte, vos projets, toutes vos réponses enregistrées (y compris historiques), votre progression et vos synthèses sauvegardées.\nLe dossier fichiers contient vos images, logos et polices téléversés.\nTéléchargez également les documents PDF que vous souhaitez conserver depuis votre espace avant son expiration.\nCette archive ne contient pas les vidéos et ressources partagées du parcours.\n"),
  };
  // Human-readable current question labels are helpful, but a release outage
  // must not prevent exporting the authoritative historical answer records.
  try {
    const { getWorkspaceData } = await import("./training");
    const workspace = await getWorkspaceData(account.id);
    dataFiles["reponses.json"] = strToU8(JSON.stringify(workspace.modules.map(module => ({
      module: module.title,
      responses: module.exercises.map(exercise => ({ question: exercise.question, values: module.answers[exercise.id] ?? [] })),
    })), null, 2));
  } catch {
    dataFiles["LISEZ-MOI.txt"] = strToU8("Sauvegarde Brand Studio X Ty Ash\n\nLes libellés du questionnaire actuel sont temporairement indisponibles. Toutes vos réponses enregistrées, y compris historiques, restent disponibles dans donnees.json avec leurs identifiants d’origine. Le dossier fichiers contient vos fichiers téléversés.\n");
  }
  return { db, storagePaths, dataFiles };
}

// Stream each original file into a ZIP rather than buffering the whole archive.
// Any missing/unreadable file fails the download instead of silently omitting it.
export function streamAccountBackup(backup: Awaited<ReturnType<typeof prepareAccountBackup>>): ReadableStream<Uint8Array> {
  let cancelled = false;
  let zip: Zip;
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      zip = new Zip((error, chunk, final) => {
        if (cancelled) return;
        if (error) { cancelled = true; controller.error(error); return; }
        controller.enqueue(chunk);
        if (final) controller.close();
      });
      try {
        for (const [name, bytes] of Object.entries(backup.dataFiles)) {
          const entry = new ZipPassThrough(name);
          zip.add(entry);
          entry.push(bytes, true);
        }
        for (const path of backup.storagePaths) {
          if (cancelled) return;
          const { data, error } = await backup.db.storage.from("project-assets").download(path);
          if (error || !data) throw new Error("Un fichier de la sauvegarde est indisponible.");
          const entry = new ZipPassThrough(`fichiers/${path.replace(/[\\:\x00-\x1f]/g, "_")}`);
          zip.add(entry);
          const reader = data.stream().getReader();
          try {
            while (!cancelled) {
              const { value, done } = await reader.read();
              if (done) break;
              entry.push(value);
            }
            if (cancelled) { await reader.cancel(); return; }
            entry.push(new Uint8Array(), true);
          } finally { reader.releaseLock(); }
        }
        if (!cancelled) zip.end();
      } catch (error) {
        if (!cancelled) { cancelled = true; zip.terminate(); controller.error(error); }
      }
    },
    cancel() { cancelled = true; zip?.terminate(); },
  });
}
