"use client";

import { getDefaultMoodboardConfig, type MoodboardConfig } from "@/lib/exercise-types";
import { MOODBOARD_TEMPLATES } from "@/lib/moodboard";

export default function MoodboardAdminEditor({
  value,
  onChange,
}: {
  value: MoodboardConfig;
  onChange: (nextValue: MoodboardConfig) => void;
}) {
  return (
    <div className="space-y-4 rounded-[1rem] border border-[var(--border)] bg-[var(--tyash-subtle)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Exercice Moodboard
          </p>
          <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
            Configure une trame, le nombre de blocs et les actions autorisees.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange(getDefaultMoodboardConfig())}
          className="rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-[0.72rem] font-black uppercase tracking-[0.12em] text-[var(--text-primary)]"
        >
          Reinitialiser
        </button>
      </div>

      <label className="space-y-2">
        <span className="block text-xs font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">
          Template par defaut
        </span>
        <select
          value={value.templateId}
          onChange={(event) => onChange({ ...value, templateId: event.target.value })}
          className="h-12 w-full rounded-[0.9rem] border border-[var(--border)] bg-[var(--card)] px-4"
        >
          {MOODBOARD_TEMPLATES.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="block text-xs font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Nombre maximum d&apos;images
          </span>
          <input
            type="number"
            min={1}
            max={12}
            value={value.maxImages}
            onChange={(event) =>
              onChange({
                ...value,
                maxImages: Math.min(Math.max(Number(event.target.value) || 1, 1), 12),
              })
            }
            className="h-12 w-full rounded-[0.9rem] border border-[var(--border)] bg-[var(--card)] px-4"
          />
        </label>
        <label className="space-y-2">
          <span className="block text-xs font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Nombre maximum de blocs texte
          </span>
          <input
            type="number"
            min={0}
            max={6}
            value={value.maxTextBlocks}
            onChange={(event) =>
              onChange({
                ...value,
                maxTextBlocks: Math.min(Math.max(Number(event.target.value) || 0, 0), 6),
              })
            }
            className="h-12 w-full rounded-[0.9rem] border border-[var(--border)] bg-[var(--card)] px-4"
          />
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <ToggleCard
          label="Autoriser l&apos;upload d&apos;images"
          checked={value.allowImageUpload}
          onChange={(checked) => onChange({ ...value, allowImageUpload: checked })}
        />
        <ToggleCard
          label="Autoriser le remplacement d&apos;images"
          checked={value.allowImageReplace}
          onChange={(checked) => onChange({ ...value, allowImageReplace: checked })}
        />
        <ToggleCard
          label="Autoriser le deplacement d&apos;images"
          checked={value.allowImageMove}
          onChange={(checked) => onChange({ ...value, allowImageMove: checked })}
        />
        <ToggleCard
          label="Autoriser la modification de texte"
          checked={value.allowTextEdit}
          onChange={(checked) => onChange({ ...value, allowTextEdit: checked })}
        />
        <ToggleCard
          label="Autoriser la modification des couleurs"
          checked={value.allowColorEdit}
          onChange={(checked) => onChange({ ...value, allowColorEdit: checked })}
        />
        <ToggleCard
          label="Autoriser l&apos;export PNG"
          checked={value.allowExportPng}
          onChange={(checked) => onChange({ ...value, allowExportPng: checked })}
        />
        <ToggleCard
          label="Autoriser l&apos;export PDF"
          checked={value.allowExportPdf}
          onChange={(checked) => onChange({ ...value, allowExportPdf: checked })}
        />
      </div>
    </div>
  );
}

function ToggleCard({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between rounded-[0.9rem] border border-[var(--border)] bg-[var(--card)] px-4 py-3">
      <span className="text-sm font-semibold text-[var(--text-primary)]">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4"
      />
    </label>
  );
}
