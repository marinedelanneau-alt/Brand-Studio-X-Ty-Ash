"use client";

import type { SpectrumConfig, SpectrumEffectType } from "@/lib/spectrum";

const EFFECT_OPTIONS: Array<{ value: SpectrumEffectType; label: string }> = [
  { value: "confetti", label: "Confetti" },
  { value: "sparkle", label: "Sparkle" },
  { value: "pulse", label: "Pulse" },
];

const SPECTRUM_PRESETS: Array<{ id: string; label: string; config: SpectrumConfig }> = [
  {
    id: "sobriete-expression",
    label: "Sobre / Expressif",
    config: {
      leftLabel: "Sobre",
      rightLabel: "Expressif",
      leftEmoji: "🌿",
      rightEmoji: "🎨",
      defaultValue: 50,
      helperText: "Deplace le curseur pour situer ta marque.",
      enableJustification: true,
      requireJustification: false,
      enableEdgeEffect: true,
      edgeEffectType: "confetti",
      edgeThreshold: 10,
      leftEdgeMessage: "Ta marque assume une direction tres sobre.",
      rightEdgeMessage: "Ta marque assume une direction tres expressive.",
    },
  },
  {
    id: "accessible-premium",
    label: "Accessible / Premium",
    config: {
      leftLabel: "Accessible",
      rightLabel: "Premium",
      leftEmoji: "🤝",
      rightEmoji: "✨",
      defaultValue: 50,
      helperText: "Deplace le curseur pour situer ta marque.",
      enableJustification: true,
      requireJustification: false,
      enableEdgeEffect: true,
      edgeEffectType: "sparkle",
      edgeThreshold: 10,
      leftEdgeMessage: "Ta marque assume une vraie accessibilite.",
      rightEdgeMessage: "Ta marque assume un positionnement premium marque.",
    },
  },
  {
    id: "douceur-audace",
    label: "Doux / Audacieux",
    config: {
      leftLabel: "Doux",
      rightLabel: "Audacieux",
      leftEmoji: "☁️",
      rightEmoji: "⚡",
      defaultValue: 50,
      helperText: "Deplace le curseur pour situer ta marque.",
      enableJustification: true,
      requireJustification: false,
      enableEdgeEffect: true,
      edgeEffectType: "pulse",
      edgeThreshold: 12,
      leftEdgeMessage: "Ta marque assume une douceur tres enveloppante.",
      rightEdgeMessage: "Ta marque assume une audace tres affirmee.",
    },
  },
];

export default function SpectrumAdminEditor({
  value,
  onChange,
}: {
  value: SpectrumConfig;
  onChange: (nextValue: SpectrumConfig) => void;
}) {
  return (
    <div className="space-y-4 rounded-[1rem] border border-[#eadfca] bg-[#fff8f1] p-4">
      <div className="space-y-2">
        <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
          Presets
        </span>
        <div className="flex flex-wrap gap-2">
          {SPECTRUM_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onChange(preset.config)}
              className="rounded-full border border-[#eadfca] bg-white px-4 py-2 text-[0.72rem] font-black uppercase tracking-[0.12em] text-[#6b625a]"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
            Label gauche
          </span>
          <input
            type="text"
            value={value.leftLabel}
            onChange={(event) => onChange({ ...value, leftLabel: event.target.value })}
            className="h-12 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4"
          />
        </label>
        <label className="space-y-2">
          <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
            Label droit
          </span>
          <input
            type="text"
            value={value.rightLabel}
            onChange={(event) => onChange({ ...value, rightLabel: event.target.value })}
            className="h-12 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4"
          />
        </label>

        <label className="space-y-2">
          <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
            Emoji gauche
          </span>
          <input
            type="text"
            value={value.leftEmoji}
            onChange={(event) => onChange({ ...value, leftEmoji: event.target.value })}
            className="h-12 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4"
          />
        </label>
        <label className="space-y-2">
          <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
            Emoji droit
          </span>
          <input
            type="text"
            value={value.rightEmoji}
            onChange={(event) => onChange({ ...value, rightEmoji: event.target.value })}
            className="h-12 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4"
          />
        </label>

        <label className="space-y-2">
          <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
            Valeur par defaut
          </span>
          <input
            type="number"
            min={0}
            max={100}
            value={value.defaultValue}
            onChange={(event) =>
              onChange({
                ...value,
                defaultValue: Math.min(Math.max(Number(event.target.value) || 0, 0), 100),
              })
            }
            className="h-12 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4"
          />
        </label>
        <label className="space-y-2">
          <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
            Seuil d&apos;activation
          </span>
          <input
            type="number"
            min={5}
            max={20}
            value={value.edgeThreshold}
            onChange={(event) =>
              onChange({
                ...value,
                edgeThreshold: Math.min(
                  Math.max(Number(event.target.value) || 5, 5),
                  20,
                ),
              })
            }
            className="h-12 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4"
          />
        </label>
      </div>

      <label className="space-y-2">
        <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
          Helper text
        </span>
        <textarea
          value={value.helperText}
          onChange={(event) => onChange({ ...value, helperText: event.target.value })}
          className="min-h-20 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4 py-3"
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex items-center justify-between rounded-[0.9rem] border border-[#eadfca] bg-white px-4 py-3">
          <span className="text-sm font-semibold text-[#5f544a]">
            Activer justification
          </span>
          <input
            type="checkbox"
            checked={value.enableJustification}
            onChange={(event) =>
              onChange({ ...value, enableJustification: event.target.checked })
            }
            className="h-4 w-4"
          />
        </label>
        <label className="flex items-center justify-between rounded-[0.9rem] border border-[#eadfca] bg-white px-4 py-3">
          <span className="text-sm font-semibold text-[#5f544a]">
            Justification obligatoire
          </span>
          <input
            type="checkbox"
            checked={value.requireJustification}
            onChange={(event) =>
              onChange({ ...value, requireJustification: event.target.checked })
            }
            className="h-4 w-4"
          />
        </label>
        <label className="flex items-center justify-between rounded-[0.9rem] border border-[#eadfca] bg-white px-4 py-3 md:col-span-2">
          <span className="text-sm font-semibold text-[#5f544a]">
            Activer effet aux extremes
          </span>
          <input
            type="checkbox"
            checked={value.enableEdgeEffect}
            onChange={(event) =>
              onChange({ ...value, enableEdgeEffect: event.target.checked })
            }
            className="h-4 w-4"
          />
        </label>
      </div>

      <label className="space-y-2">
        <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
          Type d&apos;effet
        </span>
        <select
          value={value.edgeEffectType}
          onChange={(event) =>
            onChange({
              ...value,
              edgeEffectType: event.target.value as SpectrumEffectType,
            })
          }
          className="h-12 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4"
        >
          {EFFECT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
            Message extreme gauche
          </span>
          <textarea
            value={value.leftEdgeMessage}
            onChange={(event) => onChange({ ...value, leftEdgeMessage: event.target.value })}
            className="min-h-20 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4 py-3"
          />
        </label>
        <label className="space-y-2">
          <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
            Message extreme droit
          </span>
          <textarea
            value={value.rightEdgeMessage}
            onChange={(event) => onChange({ ...value, rightEdgeMessage: event.target.value })}
            className="min-h-20 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4 py-3"
          />
        </label>
      </div>
    </div>
  );
}
