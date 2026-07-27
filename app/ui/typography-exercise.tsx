"use client";

import { useEffect, useMemo, useState } from "react";
import { uploadExerciseFont } from "@/app/upload-exercise-font";
import {
  OPEN_SOURCE_FONT_LIBRARY,
  parseStoredTypographyAnswer,
  serializeTypographyAnswer,
  type TypographyChoice,
  type TypographyRole,
} from "@/lib/typography";
import type { ModuleExercise } from "@/lib/training-types";

const ROLES: Array<{ id: TypographyRole; label: string; sample: string }> = [
  { id: "title", label: "Titre", sample: "Une marque qui affirme sa singularité" },
  { id: "subtitle", label: "Sous-titre", sample: "Une identité claire, sensible et mémorable" },
  { id: "body", label: "Texte", sample: "Cette typographie accompagnera les paragraphes et les contenus de lecture." },
];

export default function TypographyExercise({ exercise, answers, onChange }: {
  exercise: ModuleExercise;
  answers: string[];
  onChange: (values: string[]) => void;
}) {
  const initial = useMemo(() => parseStoredTypographyAnswer(answers), [answers]);
  const [choices, setChoices] = useState<TypographyChoice[]>(initial.choices);
  const [uploadingRole, setUploadingRole] = useState<TypographyRole | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const id = "brand-studio-open-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Cormorant+Garamond:wght@400;600&family=DM+Sans:wght@400;600&family=Libre+Baskerville&family=Lora:wght@400;600&family=Manrope:wght@400;600&family=Montserrat:wght@400;600&family=Playfair+Display:wght@400;600&family=Poppins:wght@400;600&family=Space+Grotesk:wght@400;600&display=swap";
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    initial.choices.filter((choice) => choice.source === "upload" && choice.fileUrl).forEach((choice) => {
      const face = new FontFace(choice.family, `url(${choice.fileUrl})`);
      void face.load().then((loaded) => document.fonts.add(loaded)).catch(() => undefined);
    });
  }, [initial]);

  function updateChoice(choice: TypographyChoice) {
    const next = [...choices.filter((item) => item.role !== choice.role), choice];
    setChoices(next);
    onChange([serializeTypographyAnswer({ version: 1, choices: next })]);
  }

  async function upload(role: TypographyRole, file?: File) {
    if (!file) return;
    setUploadingRole(role);
    setMessage("");
    const formData = new FormData();
    formData.set("moduleId", String(exercise.module_id));
    formData.set("exerciseId", String(exercise.id));
    formData.set("font", file);
    const result = await uploadExerciseFont(formData);
    setUploadingRole(null);
    if (result.status === "error") {
      setMessage(result.message);
      return;
    }
    const family = file.name.replace(/\.(woff2?|ttf|otf)$/i, "").replace(/[-_]+/g, " ");
    try {
      const face = new FontFace(family, `url(${result.url})`);
      document.fonts.add(await face.load());
    } catch {
      setMessage("La police est enregistrée, mais son aperçu n’a pas pu être chargé.");
    }
    updateChoice({ role, family, source: "upload", fileUrl: result.url, fileName: result.fileName });
  }

  return (
    <section className="rounded-[1.5rem] border border-[#eadfca] bg-[#fffdf8] p-5 sm:p-7">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-[#cf7430]">Ton système typographique</p>
      <h3 className="mt-3 font-serif text-3xl text-[#4b4550]">Choisis jusqu’à trois typographies.</h3>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-[#746961]">Associe une police à chaque rôle. Toutes les polices proposées sont libres de droit. Tu peux aussi importer tes propres fichiers si leur licence t’autorise à les utiliser.</p>
      <div className="mt-7 grid gap-5">
        {ROLES.map((role) => {
          const selected = choices.find((choice) => choice.role === role.id);
          return (
            <article key={role.id} className="rounded-[1.2rem] border border-[#eadfca] bg-white p-5">
              <div className="grid gap-4 md:grid-cols-[180px_1fr]">
                <div>
                  <label className="text-xs font-black uppercase tracking-[0.16em] text-[#7a7087]" htmlFor={`font-${role.id}`}>{role.label}</label>
                  <select id={`font-${role.id}`} value={selected?.source === "library" ? selected.family : ""} onChange={(event) => event.target.value && updateChoice({ role: role.id, family: event.target.value, source: "library" })} className="mt-2 w-full rounded-xl border border-[#dfd2c0] bg-white px-3 py-3 text-sm text-[#4b4550]">
                    <option value="">Choisir une police</option>
                    {OPEN_SOURCE_FONT_LIBRARY.map((font) => <option key={font.family} value={font.family}>{font.family} — {font.category}</option>)}
                  </select>
                  <label className="mt-3 block cursor-pointer rounded-xl border border-dashed border-[#d6b992] px-3 py-3 text-center text-xs font-bold text-[#b56c2b]">
                    {uploadingRole === role.id ? "Import en cours…" : "Importer ma police"}
                    <input className="sr-only" type="file" accept=".woff,.woff2,.ttf,.otf,font/woff,font/woff2,font/ttf,font/otf" disabled={uploadingRole !== null} onChange={(event) => void upload(role.id, event.target.files?.[0])} />
                  </label>
                </div>
                <div className="min-h-32 rounded-xl bg-[#f7f1e8] p-5">
                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#998d83]">{selected ? selected.family : "Aperçu"}</p>
                  <p className="mt-4 break-words text-[#403a40]" style={{ fontFamily: selected ? `"${selected.family}", sans-serif` : "inherit", fontSize: role.id === "title" ? 30 : role.id === "subtitle" ? 22 : 16, lineHeight: 1.25 }}>{role.sample}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {message ? <p className="mt-4 text-sm text-[#a34e42]">{message}</p> : null}
      <p className="mt-5 text-xs text-[#8a8077]">{choices.length}/3 rôles renseignés</p>
    </section>
  );
}
