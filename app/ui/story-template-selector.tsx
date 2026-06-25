"use client";

import type { StoryTemplate } from "@/lib/get-module-share-data";

const OPTIONS: Array<{ value: StoryTemplate; label: string; description: string }> = [
  {
    value: "minimal",
    label: "Minimal",
    description: "Clair, editorial, tres lisible.",
  },
  {
    value: "color",
    label: "Colore",
    description: "Plus expressif, avec accent chaleureux.",
  },
  {
    value: "moodboard",
    label: "Moodboard",
    description: "Ambiance collage douce et premium.",
  },
];

export default function StoryTemplateSelector({
  value,
  onChange,
}: {
  value: StoryTemplate;
  onChange: (value: StoryTemplate) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {OPTIONS.map((option) => {
        const isSelected = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`min-h-24 rounded-[1rem] border px-4 py-3 text-left transition ${
              isSelected
                ? "border-[#cf7430] bg-[#fff6e3] text-[#4b4550]"
                : "border-[#eadfca] bg-white text-[#6f645b] hover:border-[#cf7430]"
            }`}
            aria-pressed={isSelected}
          >
            <span className="block text-sm font-black uppercase tracking-[0.14em]">
              {option.label}
            </span>
            <span className="mt-2 block text-xs leading-5">{option.description}</span>
          </button>
        );
      })}
    </div>
  );
}
