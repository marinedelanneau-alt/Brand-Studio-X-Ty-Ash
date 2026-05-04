"use client";

import { PencilSquareIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { HexColorPicker } from "react-colorful";
import { useEffect, useMemo, useState } from "react";
import {
  buildColorPaletteAnswer,
  createEmptyPaletteColor,
  getDefaultColorPaletteAnswer,
  getPaletteColorCss,
  isPaletteColorComplete,
  isValidHexColor,
  normalizeHexColor,
  parseStoredColorPaletteAnswer,
  parseStoredColorPaletteConfig,
  serializeColorPaletteAnswer,
  suggestColorMeaning,
  type ColorPaletteBucket,
  type ColorPaletteConfig,
  type ColorPaletteMode,
  type GradientDirection,
  type PaletteColor,
} from "@/lib/color-palette";
import type { ExerciseType } from "@/lib/exercise-types";

type ExerciseLike = {
  id: string | number;
  type: ExerciseType;
  question: string;
  explanation: string;
  options: string[];
};

type PaletteDraftState = {
  bucket: ColorPaletteBucket;
  index: number | null;
  value: PaletteColor;
  activeGradientStop: "from" | "to";
};

type PaletteSeed = Partial<PaletteColor> & {
  mode?: ColorPaletteMode;
  name?: string;
  usage?: string;
  hex?: string;
  from?: string;
  to?: string;
  direction?: GradientDirection;
};

type EyeDropperLike = {
  open: () => Promise<{ sRGBHex: string }>;
};

declare global {
  interface Window {
    EyeDropper?: new () => EyeDropperLike;
  }
}

export default function ColorPaletteExercise({
  exercise,
  answers,
  onChange,
}: {
  exercise: ExerciseLike;
  answers: string[];
  onChange: (nextValues: string[]) => void;
}) {
  const config = useMemo(() => parseStoredColorPaletteConfig(exercise.options), [exercise.options]);
  const hydratedAnswer = useMemo(
    () => parseStoredColorPaletteAnswer(answers) ?? getDefaultColorPaletteAnswer(),
    [answers],
  );
  const [primaryColors, setPrimaryColors] = useState(hydratedAnswer.primaryColors);
  const [secondaryColors, setSecondaryColors] = useState(hydratedAnswer.secondaryColors);
  const [draftState, setDraftState] = useState<PaletteDraftState | null>(null);
  const [eyeDropperAvailable, setEyeDropperAvailable] = useState(false);
  const [eyeDropperMessage, setEyeDropperMessage] = useState("");

  useEffect(() => {
    setPrimaryColors(hydratedAnswer.primaryColors);
    setSecondaryColors(hydratedAnswer.secondaryColors);
  }, [hydratedAnswer]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setEyeDropperAvailable(Boolean(window.EyeDropper));
  }, []);

  const currentDraftMeaning = useMemo(() => {
    if (!draftState || !config.enableColorMeaningHelper) {
      return "";
    }

    const referenceHex =
      draftState.value.mode === "gradient"
        ? draftState.activeGradientStop === "from"
          ? draftState.value.from
          : draftState.value.to
        : draftState.value.hex;

    return suggestColorMeaning(referenceHex);
  }, [config.enableColorMeaningHelper, draftState]);

  function applyPalette(nextPrimaryColors: PaletteColor[], nextSecondaryColors: PaletteColor[]) {
    setPrimaryColors(nextPrimaryColors);
    setSecondaryColors(nextSecondaryColors);
    onChange([
      serializeColorPaletteAnswer(
        buildColorPaletteAnswer({
          primaryColors: nextPrimaryColors,
          secondaryColors: nextSecondaryColors,
        }),
      ),
    ]);
  }

  function openCreateModal(bucket: ColorPaletteBucket, seed?: PaletteSeed) {
    const preferredMode: ColorPaletteMode =
      seed?.mode === "gradient"
        ? "gradient"
        : config.defaultMode === "gradient" && config.allowGradient
          ? "gradient"
          : "solid";
    const emptyColor = createEmptyPaletteColor(preferredMode);
    const nextValue = seed
      ? normalizeDraftSeed(emptyColor, seed)
      : emptyColor;

    setDraftState({
      bucket,
      index: null,
      value: nextValue,
      activeGradientStop: "from",
    });
    setEyeDropperMessage("");
  }

  function openEditModal(bucket: ColorPaletteBucket, index: number, value: PaletteColor) {
    setDraftState({
      bucket,
      index,
      value: normalizeDraftColor(value),
      activeGradientStop: "from",
    });
    setEyeDropperMessage("");
  }

  function closeModal() {
    setDraftState(null);
    setEyeDropperMessage("");
  }

  function saveDraft() {
    if (!draftState) {
      return;
    }

    const normalized = normalizeDraftColor(draftState.value);
    const nextPrimaryColors =
      draftState.bucket === "primary"
        ? draftState.index === null
          ? [...primaryColors, normalized]
          : primaryColors.map((item, index) =>
              index === draftState.index ? normalized : item,
            )
        : primaryColors;
    const nextSecondaryColors =
      draftState.bucket === "secondary"
        ? draftState.index === null
          ? [...secondaryColors, normalized]
          : secondaryColors.map((item, index) =>
              index === draftState.index ? normalized : item,
            )
        : secondaryColors;

    applyPalette(nextPrimaryColors, nextSecondaryColors);
    closeModal();
  }

  async function pickScreenColor() {
    if (!draftState || !config.allowEyeDropper || !window.EyeDropper) {
      return;
    }

    try {
      const eyeDropper = new window.EyeDropper();
      const result = await eyeDropper.open();
      const normalizedHex = normalizeHexColor(result.sRGBHex);

      if (!normalizedHex) {
        return;
      }

      setDraftState((current) => {
        if (!current) {
          return current;
        }

        if (current.value.mode === "gradient") {
          return {
            ...current,
            value:
              current.activeGradientStop === "from"
                ? { ...current.value, from: normalizedHex }
                : { ...current.value, to: normalizedHex },
          };
        }

        return {
          ...current,
          value: { ...current.value, hex: normalizedHex },
        };
      });
      setEyeDropperMessage("");
    } catch {
      setEyeDropperMessage("La pipette a ete annulee ou n'est pas disponible.");
    }
  }

  return (
    <>
      <div className="mt-4 space-y-5 rounded-[1.7rem] border border-[#eadfca] bg-[linear-gradient(180deg,#fffdfa,#fff7ef)] p-5 shadow-[0_18px_40px_rgba(210,189,152,0.1)]">
        <div className="rounded-[1.3rem] border border-[#f0dfc6] bg-white px-5 py-5">
          <p className="text-[0.72rem] font-black uppercase tracking-[0.18em] text-[#cf7430]">
            Palette de couleurs
          </p>
          <h3 className="mt-3 font-[family:var(--font-cormorant)] text-[2rem] leading-[0.96] text-[#4b4550]">
            {exercise.question || "Construis la palette de couleurs de ta marque"}
          </h3>
          {exercise.explanation ? (
            <p className="mt-4 font-[family:var(--font-caveat)] text-[1.4rem] italic leading-[1.35] text-[#8b684f] sm:text-[1.55rem]">
              {exercise.explanation}
            </p>
          ) : null}
          <p className="mt-3 text-sm leading-7 text-[#8a8077]">{config.helperText}</p>
        </div>

        {config.exampleColors.length > 0 ? (
          <div className="rounded-[1.2rem] border border-[#eadfca] bg-white px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[0.72rem] font-black uppercase tracking-[0.16em] text-[#7a7087]">
                  Inspirations rapides
                </p>
                <p className="mt-1 text-sm leading-6 text-[#8a8077]">
                  Clique sur un exemple pour l&apos;ajouter et l&apos;adapter.
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              {config.exampleColors.map((example) => (
                <button
                  key={example.id}
                  type="button"
                  onClick={() =>
                    openCreateModal(example.type, {
                      mode: "solid",
                      name: example.name,
                      hex: example.hex,
                      usage: example.usage,
                    })
                  }
                  className="flex items-center gap-3 rounded-full border border-[#eadfca] bg-[#fffdf8] px-3 py-2 text-left transition hover:border-[#cf7430]"
                >
                  <span
                    className="h-8 w-8 rounded-full border border-white shadow-[0_0_0_1px_rgba(75,69,80,0.14)]"
                    style={{ background: example.hex }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold leading-5 text-[#5f544a]">
                      {example.name}
                    </span>
                    <span className="block text-xs leading-5 text-[#8a8077]">
                      {example.usage || (example.type === "primary" ? "Principale" : "Secondaire")}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <PaletteSection
          title="Couleurs principales"
          helper={`Jusqu'a ${config.maxPrimaryColors} couleur${config.maxPrimaryColors > 1 ? "s" : ""} pour les teintes structurantes de la marque.`}
          items={primaryColors}
          maxItems={config.maxPrimaryColors}
          requireUsage={config.requireUsage}
          onAdd={() => openCreateModal("primary")}
          onEdit={(index, value) => openEditModal("primary", index, value)}
          onDelete={(index) =>
            applyPalette(
              primaryColors.filter((_, currentIndex) => currentIndex !== index),
              secondaryColors,
            )
          }
        />

        <PaletteSection
          title="Couleurs secondaires"
          helper={`Jusqu'a ${config.maxSecondaryColors} couleur${config.maxSecondaryColors > 1 ? "s" : ""} pour les accents, respirations et details.`}
          items={secondaryColors}
          maxItems={config.maxSecondaryColors}
          requireUsage={config.requireUsage}
          onAdd={() => openCreateModal("secondary")}
          onEdit={(index, value) => openEditModal("secondary", index, value)}
          onDelete={(index) =>
            applyPalette(
              primaryColors,
              secondaryColors.filter((_, currentIndex) => currentIndex !== index),
            )
          }
        />
      </div>

      {draftState ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#2f2418]/45 px-4 py-6"
          onClick={closeModal}
        >
          <div
            className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[1.7rem] border border-[#eadfca] bg-[linear-gradient(180deg,#fffdfa,#fff7ef)] p-6 shadow-[0_24px_70px_rgba(47,36,24,0.18)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_22rem]">
              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[0.72rem] font-black uppercase tracking-[0.18em] text-[#cf7430]">
                      {draftState.bucket === "primary"
                        ? "Couleur principale"
                        : "Couleur secondaire"}
                    </p>
                    <h4 className="mt-2 font-[family:var(--font-cormorant)] text-[2rem] leading-none text-[#4b4550]">
                      {draftState.index === null ? "Ajouter une couleur" : "Modifier la couleur"}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-full border border-[#eadfca] bg-white px-4 py-2 text-[0.72rem] font-black uppercase tracking-[0.12em] text-[#6b625a]"
                  >
                    Fermer
                  </button>
                </div>

                <div className="rounded-[1.3rem] border border-[#eadfca] bg-white p-5">
                  <div className="flex flex-wrap gap-2">
                    <ModeTab
                      active={draftState.value.mode === "solid"}
                      label="Couleur unie"
                      onClick={() =>
                        setDraftState((current) =>
                          current
                            ? {
                                ...current,
                                value:
                                  current.value.mode === "solid"
                                    ? current.value
                                    : {
                                        id: current.value.id,
                                        mode: "solid",
                                        name: current.value.name,
                                        hex: current.value.from,
                                        usage: current.value.usage,
                                      },
                              }
                            : current
                        )
                      }
                    />
                    {config.allowGradient ? (
                      <ModeTab
                        active={draftState.value.mode === "gradient"}
                        label="Degrade"
                        onClick={() =>
                          setDraftState((current) =>
                            current
                              ? {
                                  ...current,
                                  value:
                                    current.value.mode === "gradient"
                                      ? current.value
                                      : {
                                          id: current.value.id,
                                          mode: "gradient",
                                          name: current.value.name,
                                          from: current.value.hex,
                                          to: "#F3C447",
                                          direction: "horizontal",
                                          usage: current.value.usage,
                                        },
                                }
                              : current
                          )
                        }
                      />
                    ) : null}
                  </div>

                  <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_15rem]">
                    <div className="space-y-4">
                      {config.allowColorPicker ? (
                        <div className="rounded-[1.2rem] border border-[#f0dfc6] bg-[#fffdf8] p-4">
                          {draftState.value.mode === "gradient" ? (
                            <div className="mb-4 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setDraftState((current) =>
                                    current
                                      ? { ...current, activeGradientStop: "from" }
                                      : current,
                                  )
                                }
                                className={`rounded-full px-4 py-2 text-[0.72rem] font-black uppercase tracking-[0.12em] ${
                                  draftState.activeGradientStop === "from"
                                    ? "bg-[linear-gradient(135deg,#df9b39,#f1cc56)] text-white"
                                    : "border border-[#eadfca] bg-white text-[#6b625a]"
                                }`}
                              >
                                Couleur depart
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setDraftState((current) =>
                                    current
                                      ? { ...current, activeGradientStop: "to" }
                                      : current,
                                  )
                                }
                                className={`rounded-full px-4 py-2 text-[0.72rem] font-black uppercase tracking-[0.12em] ${
                                  draftState.activeGradientStop === "to"
                                    ? "bg-[linear-gradient(135deg,#df9b39,#f1cc56)] text-white"
                                    : "border border-[#eadfca] bg-white text-[#6b625a]"
                                }`}
                              >
                                Couleur arrivee
                              </button>
                            </div>
                          ) : null}

                          <HexColorPicker
                            color={getPickerColor(draftState.value, draftState.activeGradientStop)}
                            onChange={(nextColor) =>
                              setDraftState((current) =>
                                current
                                  ? updateDraftColor(current, normalizeHexColor(nextColor) ?? nextColor)
                                  : current,
                              )
                            }
                            className="!w-full"
                          />
                        </div>
                      ) : null}

                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="space-y-2">
                          <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
                            Nom de la couleur
                          </span>
                          <input
                            type="text"
                            value={draftState.value.name}
                            onChange={(event) =>
                              setDraftState((current) =>
                                current
                                  ? {
                                      ...current,
                                      value: { ...current.value, name: event.target.value },
                                    }
                                  : current,
                              )
                            }
                            className="h-12 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4"
                            placeholder="Ex. Beige chaud"
                          />
                        </label>

                        {draftState.value.mode === "gradient" ? (
                          <label className="space-y-2">
                            <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
                              Direction
                            </span>
                            <select
                              value={draftState.value.direction}
                              onChange={(event) =>
                                setDraftState((current) =>
                                  current && current.value.mode === "gradient"
                                    ? {
                                        ...current,
                                        value: {
                                          ...current.value,
                                          direction:
                                            event.target.value === "vertical"
                                              ? "vertical"
                                              : event.target.value === "diagonal"
                                                ? "diagonal"
                                                : "horizontal",
                                        },
                                      }
                                    : current,
                                )
                              }
                              className="h-12 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4"
                            >
                              <option value="horizontal">Horizontal</option>
                              <option value="vertical">Vertical</option>
                              <option value="diagonal">Diagonal</option>
                            </select>
                          </label>
                        ) : null}

                        {config.allowHexInput ? (
                          <>
                            {draftState.value.mode === "gradient" ? (
                              <>
                                <HexInput
                                  label="HEX depart"
                                  value={draftState.value.from}
                                  onChange={(nextValue) =>
                                    setDraftState((current) =>
                                      current && current.value.mode === "gradient"
                                        ? {
                                            ...current,
                                            value: { ...current.value, from: nextValue },
                                          }
                                        : current,
                                    )
                                  }
                                />
                                <HexInput
                                  label="HEX arrivee"
                                  value={draftState.value.to}
                                  onChange={(nextValue) =>
                                    setDraftState((current) =>
                                      current && current.value.mode === "gradient"
                                        ? {
                                            ...current,
                                            value: { ...current.value, to: nextValue },
                                          }
                                        : current,
                                    )
                                  }
                                />
                              </>
                            ) : (
                              <HexInput
                                label="Code HEX"
                                value={draftState.value.hex}
                                onChange={(nextValue) =>
                                  setDraftState((current) =>
                                    current && current.value.mode === "solid"
                                      ? {
                                          ...current,
                                          value: { ...current.value, hex: nextValue },
                                        }
                                      : current,
                                  )
                                }
                              />
                            )}
                          </>
                        ) : null}

                        <label className="space-y-2 md:col-span-2">
                          <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
                            Usage
                            {config.requireUsage ? (
                              <span className="ml-2 text-[#cf7430]">*</span>
                            ) : null}
                          </span>
                          <textarea
                            value={draftState.value.usage}
                            onChange={(event) =>
                              setDraftState((current) =>
                                current
                                  ? {
                                      ...current,
                                      value: { ...current.value, usage: event.target.value },
                                    }
                                  : current,
                              )
                            }
                            rows={3}
                            className="min-h-24 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4 py-3"
                            placeholder="Ex. Fond principal / bouton / accent / encart"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-[1.2rem] border border-[#eadfca] bg-white p-4">
                        <p className="text-[0.72rem] font-black uppercase tracking-[0.16em] text-[#7a7087]">
                          Apercu
                        </p>
                        <div
                          className="mt-3 h-44 rounded-[1.1rem] border border-[#eadfca]"
                          style={{
                            background: getPaletteColorCss(draftState.value),
                          }}
                        />
                        <div className="mt-4 space-y-2 text-sm leading-6 text-[#6f645b]">
                          <p>
                            {draftState.value.mode === "gradient"
                              ? `${draftState.value.from} -> ${draftState.value.to}`
                              : draftState.value.hex}
                          </p>
                          {config.enableColorMeaningHelper && currentDraftMeaning ? (
                            <p className="rounded-[0.9rem] bg-[#fff7ec] px-3 py-3 text-sm leading-6 text-[#6f645b]">
                              Cette couleur peut evoquer...
                              <span className="block">{currentDraftMeaning.replace("Cette couleur peut evoquer ", "")}</span>
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="rounded-[1.2rem] border border-[#eadfca] bg-white p-4">
                        <div className="flex flex-wrap gap-2">
                          {config.allowEyeDropper ? (
                            <button
                              type="button"
                              onClick={() => void pickScreenColor()}
                              disabled={!eyeDropperAvailable}
                              title={
                                eyeDropperAvailable
                                  ? "Prelever une couleur a l'ecran"
                                  : "Non disponible sur ce navigateur"
                              }
                              className="flex h-11 items-center justify-center rounded-[0.9rem] border border-[#eadfca] bg-[#fffaf4] px-4 text-[0.72rem] font-black uppercase tracking-[0.12em] text-[#6b625a] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Utiliser la pipette
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={saveDraft}
                            disabled={!canSaveDraft(draftState.value, config)}
                            className="flex h-11 items-center justify-center rounded-[0.9rem] bg-[linear-gradient(135deg,#df9b39,#f1cc56)] px-4 text-[0.72rem] font-black uppercase tracking-[0.12em] text-white disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Enregistrer la couleur
                          </button>
                        </div>
                        {eyeDropperMessage ? (
                          <p className="mt-3 text-sm leading-6 text-[#8a8077]">
                            {eyeDropperMessage}
                          </p>
                        ) : null}
                        {!canSaveDraft(draftState.value, config) ? (
                          <p className="mt-3 text-sm leading-6 text-[#8a8077]">
                            Renseigne un nom, une couleur valide et{config.requireUsage ? " un usage" : ""} pour enregistrer cet element.
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <CompletionPanel
                  title="Principales"
                  currentCount={primaryColors.length}
                  maxCount={config.maxPrimaryColors}
                  requireUsage={config.requireUsage}
                  items={primaryColors}
                />
                <CompletionPanel
                  title="Secondaires"
                  currentCount={secondaryColors.length}
                  maxCount={config.maxSecondaryColors}
                  requireUsage={config.requireUsage}
                  items={secondaryColors}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function PaletteSection({
  title,
  helper,
  items,
  maxItems,
  requireUsage,
  onAdd,
  onEdit,
  onDelete,
}: {
  title: string;
  helper: string;
  items: PaletteColor[];
  maxItems: number;
  requireUsage: boolean;
  onAdd: () => void;
  onEdit: (index: number, value: PaletteColor) => void;
  onDelete: (index: number) => void;
}) {
  const canAdd = items.length < maxItems;

  return (
    <div className="rounded-[1.3rem] border border-[#eadfca] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[0.72rem] font-black uppercase tracking-[0.16em] text-[#7a7087]">
            {title}
          </p>
          <p className="mt-2 text-sm leading-6 text-[#8a8077]">{helper}</p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          disabled={!canAdd}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-[0.9rem] border border-[#eadfca] bg-[#fff8f1] px-4 text-[0.72rem] font-black uppercase tracking-[0.12em] text-[#6b625a] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <PlusIcon className="h-4 w-4" />
          Ajouter une couleur
        </button>
      </div>

      {items.length === 0 ? (
        <div className="mt-4 rounded-[1rem] border border-dashed border-[#eadfca] bg-[#fffdf9] px-4 py-5 text-sm leading-6 text-[#8a8077]">
          Aucune couleur ajoutee pour le moment.
        </div>
      ) : (
        <div className="mt-4 grid gap-3">
          {items.map((item, index) => {
            const isComplete = isPaletteColorComplete(item, requireUsage);

            return (
              <div
                key={item.id}
                className="grid gap-4 rounded-[1rem] border border-[#eadfca] bg-[#fffdf9] p-4 md:grid-cols-[5rem_minmax(0,1fr)_auto]"
              >
                <div
                  className="h-16 rounded-[1rem] border border-[#eadfca]"
                  style={{ background: getPaletteColorCss(item) }}
                  aria-label={`Apercu ${item.mode === "gradient" ? "du degrade" : "de la couleur"} ${item.name || index + 1}`}
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold leading-6 text-[#5f544a]">
                      {item.name || "Couleur sans nom"}
                    </p>
                    <span className="rounded-full bg-[#f7efe1] px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-[#8a8077]">
                      {item.mode === "gradient" ? "Degrade" : "Unie"}
                    </span>
                    {!isComplete ? (
                      <span className="rounded-full bg-[#fff7ec] px-2.5 py-1 text-[0.65rem] font-black uppercase tracking-[0.12em] text-[#cf7430]">
                        A completer
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm leading-6 text-[#8a8077]">
                    {item.mode === "gradient"
                      ? `${item.from} -> ${item.to}`
                      : item.hex}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#6f645b]">
                    {item.usage || "Usage non renseigne"}
                  </p>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(index, item)}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-[#eadfca] bg-white text-[#6b625a]"
                    aria-label={`Modifier ${item.name || "la couleur"}`}
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(index)}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-[#eadfca] bg-white text-[#b45247]"
                    aria-label={`Supprimer ${item.name || "la couleur"}`}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CompletionPanel({
  title,
  currentCount,
  maxCount,
  requireUsage,
  items,
}: {
  title: string;
  currentCount: number;
  maxCount: number;
  requireUsage: boolean;
  items: PaletteColor[];
}) {
  const completedCount = items.filter((item) => isPaletteColorComplete(item, requireUsage)).length;

  return (
    <div className="rounded-[1.2rem] border border-[#eadfca] bg-white p-4">
      <p className="text-[0.72rem] font-black uppercase tracking-[0.16em] text-[#7a7087]">
        {title}
      </p>
      <p className="mt-3 text-3xl font-black leading-none text-[#4b4550]">
        {currentCount}/{maxCount}
      </p>
      <p className="mt-2 text-sm leading-6 text-[#8a8077]">
        {completedCount} element{completedCount > 1 ? "s" : ""} complet
        {completedCount > 1 ? "s" : ""}.
      </p>
    </div>
  );
}

function ModeTab({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-[0.72rem] font-black uppercase tracking-[0.12em] ${
        active
          ? "bg-[linear-gradient(135deg,#df9b39,#f1cc56)] text-white"
          : "border border-[#eadfca] bg-white text-[#6b625a]"
      }`}
    >
      {label}
    </button>
  );
}

function HexInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="block text-xs font-black uppercase tracking-[0.18em] text-[#7a7087]">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value.toUpperCase())}
        className="h-12 w-full rounded-[0.9rem] border border-[#eadfca] bg-white px-4 uppercase"
        aria-label={label}
      />
      {!isValidHexColor(value) ? (
        <p className="text-xs leading-5 text-[#8a8077]">Format attendu : `#RRGGBB`.</p>
      ) : null}
    </label>
  );
}

function getPickerColor(value: PaletteColor, activeGradientStop: "from" | "to") {
  return value.mode === "gradient"
    ? activeGradientStop === "from"
      ? value.from
      : value.to
    : value.hex;
}

function updateDraftColor(state: PaletteDraftState, nextHex: string) {
  if (state.value.mode === "gradient") {
    return {
      ...state,
      value:
        state.activeGradientStop === "from"
          ? { ...state.value, from: nextHex }
          : { ...state.value, to: nextHex },
    };
  }

  return {
    ...state,
    value: { ...state.value, hex: nextHex },
  };
}

function normalizeDraftSeed(base: PaletteColor, seed: PaletteSeed): PaletteColor {
  if (base.mode === "gradient") {
    return normalizeDraftColor({
      id: base.id,
      mode: "gradient",
      name: seed.name ?? base.name,
      from: seed.from ?? seed.hex ?? base.from,
      to: seed.to ?? base.to,
      direction:
        seed.mode === "gradient" && "direction" in seed && seed.direction
          ? seed.direction
          : base.direction,
      usage: seed.usage ?? base.usage,
    });
  }

  return normalizeDraftColor({
    id: base.id,
    mode: "solid",
    name: seed.name ?? base.name,
    hex: seed.hex ?? ("from" in seed ? seed.from ?? base.hex : base.hex),
    usage: seed.usage ?? base.usage,
  });
}

function normalizeDraftColor(value: PaletteColor): PaletteColor {
  if (value.mode === "gradient") {
    return {
      ...value,
      from: normalizeHexColor(value.from) ?? "#EFE8D0",
      to: normalizeHexColor(value.to) ?? "#F3C447",
      direction:
        value.direction === "vertical" || value.direction === "diagonal"
          ? value.direction
          : "horizontal",
    };
  }

  return {
    ...value,
    hex: normalizeHexColor(value.hex) ?? "#EFE8D0",
  };
}

function canSaveDraft(value: PaletteColor, config: ColorPaletteConfig) {
  return isPaletteColorComplete(value, config.requireUsage);
}
