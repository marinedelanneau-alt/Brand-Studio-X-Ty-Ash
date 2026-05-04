"use client";

import {
  getDefaultColorPaletteConfig,
  normalizeHexColor,
  type ColorPaletteBucket,
  type ColorPaletteConfig,
} from "@/lib/color-palette";

const MODE_OPTIONS = [
  { value: "solid", label: "Couleur unie" },
  { value: "gradient", label: "Degrade" },
] as const;

const TYPE_OPTIONS: Array<{ value: ColorPaletteBucket; label: string }> = [
  { value: "primary", label: "Principale" },
  { value: "secondary", label: "Secondaire" },
];

export default function ColorPaletteAdminEditor({
  value,
  onChange,
}: {
  value: ColorPaletteConfig;
  onChange: (nextValue: ColorPaletteConfig) => void;
}) {
  return (
    <div className="space-y-4 rounded-[1rem] border border-[#eadfca] bg-[#fff8f1] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
            Exercice Palette de couleurs
          </p>
          <p className="mt-1 text-sm leading-6 text-[#8a8077]">
            Configure le picker visuel, les limites de palette et les couleurs
            d&apos;exemple proposees a l&apos;utilisateur.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange(getDefaultColorPaletteConfig())}
          className="rounded-full border border-[#eadfca] bg-white px-4 py-2 text-[0.72rem] font-black uppercase tracking-[0.12em] text-[#6b625a]"
        >
          Reinitialiser
        </button>
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
        <label className="space-y-2">
          <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
            Couleurs principales max
          </span>
          <input
            type="number"
            min={1}
            max={8}
            value={value.maxPrimaryColors}
            onChange={(event) =>
              onChange({
                ...value,
                maxPrimaryColors: Math.min(
                  Math.max(Number(event.target.value) || 1, 1),
                  8,
                ),
              })
            }
            className="h-12 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4"
          />
        </label>
        <label className="space-y-2">
          <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
            Couleurs secondaires max
          </span>
          <input
            type="number"
            min={1}
            max={12}
            value={value.maxSecondaryColors}
            onChange={(event) =>
              onChange({
                ...value,
                maxSecondaryColors: Math.min(
                  Math.max(Number(event.target.value) || 1, 1),
                  12,
                ),
              })
            }
            className="h-12 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4"
          />
        </label>
      </div>

      <label className="space-y-2">
        <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
          Mode par defaut
        </span>
        <select
          value={value.defaultMode}
          onChange={(event) =>
            onChange({
              ...value,
              defaultMode: event.target.value === "gradient" ? "gradient" : "solid",
            })
          }
          className="h-12 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4"
        >
          {MODE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <ToggleCard
          label="Activer les degrades"
          checked={value.allowGradient}
          onChange={(checked) => onChange({ ...value, allowGradient: checked })}
        />
        <ToggleCard
          label="Activer le color picker"
          checked={value.allowColorPicker}
          onChange={(checked) => onChange({ ...value, allowColorPicker: checked })}
        />
        <ToggleCard
          label="Activer le champ HEX"
          checked={value.allowHexInput}
          onChange={(checked) => onChange({ ...value, allowHexInput: checked })}
        />
        <ToggleCard
          label="Activer la pipette"
          checked={value.allowEyeDropper}
          onChange={(checked) => onChange({ ...value, allowEyeDropper: checked })}
        />
        <ToggleCard
          label="Champ usage obligatoire"
          checked={value.requireUsage}
          onChange={(checked) => onChange({ ...value, requireUsage: checked })}
        />
        <ToggleCard
          label="Activer l'aide sur le sens des couleurs"
          checked={value.enableColorMeaningHelper}
          onChange={(checked) =>
            onChange({ ...value, enableColorMeaningHelper: checked })
          }
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
              Couleurs d&apos;exemple
            </p>
            <p className="mt-1 text-sm leading-6 text-[#8a8077]">
              Ces exemples servent d&apos;inspiration rapide dans l&apos;exercice.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              onChange({
                ...value,
                exampleColors: [
                  ...value.exampleColors,
                  {
                    id: crypto.randomUUID(),
                    name: "",
                    hex: "#EFE8D0",
                    usage: "",
                    type: "primary",
                  },
                ],
              })
            }
            className="rounded-full border border-[#eadfca] bg-white px-4 py-2 text-[0.72rem] font-black uppercase tracking-[0.12em] text-[#6b625a]"
          >
            Ajouter une couleur
          </button>
        </div>

        <div className="space-y-3">
          {value.exampleColors.map((example, index) => (
            <div
              key={example.id}
              className="rounded-[1rem] border border-[#eadfca] bg-white p-4"
            >
              <div className="grid gap-4 md:grid-cols-[5rem_minmax(0,1.2fr)_minmax(0,1fr)_10rem_auto]">
                <label className="space-y-2">
                  <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
                    Apercu
                  </span>
                  <span
                    className="block h-12 rounded-[0.9rem] border border-[#eadfca]"
                    style={{ background: normalizeHexColor(example.hex) ?? "#EFE8D0" }}
                  />
                </label>

                <label className="space-y-2">
                  <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
                    Nom
                  </span>
                  <input
                    type="text"
                    value={example.name}
                    onChange={(event) =>
                      onChange({
                        ...value,
                        exampleColors: value.exampleColors.map((item) =>
                          item.id === example.id ? { ...item, name: event.target.value } : item,
                        ),
                      })
                    }
                    className="h-12 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4"
                  />
                </label>

                <label className="space-y-2">
                  <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
                    Usage
                  </span>
                  <input
                    type="text"
                    value={example.usage}
                    onChange={(event) =>
                      onChange({
                        ...value,
                        exampleColors: value.exampleColors.map((item) =>
                          item.id === example.id ? { ...item, usage: event.target.value } : item,
                        ),
                      })
                    }
                    className="h-12 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4"
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
                      HEX
                    </span>
                    <input
                      type="text"
                      value={example.hex}
                      onChange={(event) =>
                        onChange({
                          ...value,
                          exampleColors: value.exampleColors.map((item) =>
                            item.id === example.id ? { ...item, hex: event.target.value } : item,
                          ),
                        })
                      }
                      className="h-12 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4 uppercase"
                    />
                  </label>

                  <label className="space-y-2">
                    <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
                      Type
                    </span>
                    <select
                      value={example.type}
                      onChange={(event) =>
                        onChange({
                          ...value,
                          exampleColors: value.exampleColors.map((item) =>
                            item.id === example.id
                              ? {
                                  ...item,
                                  type:
                                    event.target.value === "secondary"
                                      ? "secondary"
                                      : "primary",
                                }
                              : item,
                          ),
                        })
                      }
                      className="h-12 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4"
                    >
                      {TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="flex items-end justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      onChange({
                        ...value,
                        exampleColors: value.exampleColors.filter(
                          (item) => item.id !== example.id,
                        ),
                      })
                    }
                    className="text-xs font-black uppercase tracking-[0.12em] text-[#b45247]"
                  >
                    Supprimer
                  </button>
                </div>
              </div>

              <p className="mt-3 text-xs leading-5 text-[#8a8077]">
                Exemple {index + 1}
              </p>
            </div>
          ))}
        </div>
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
    <label className="flex items-center justify-between rounded-[0.9rem] border border-[#eadfca] bg-white px-4 py-3">
      <span className="text-sm font-semibold text-[#5f544a]">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4"
      />
    </label>
  );
}
