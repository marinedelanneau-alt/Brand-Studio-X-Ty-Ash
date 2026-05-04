"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  buildSpectrumAnswer,
  getDefaultSpectrumAnswer,
  getSpectrumEdgeTriggered,
  parseStoredSpectrumAnswer,
  parseStoredSpectrumConfig,
  serializeSpectrumAnswer,
  type SpectrumEdgeTriggered,
  type SpectrumEffectType,
} from "@/lib/spectrum";
import type { ExerciseType } from "@/lib/exercise-types";

type ExerciseLike = {
  id: string | number;
  type: ExerciseType;
  question: string;
  options: string[];
};

type EffectParticle = {
  id: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
  delay: number;
  hueShift: number;
};

function buildEffectParticles(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
    x: Math.round((Math.random() - 0.5) * 100),
    y: Math.round(Math.random() * -80),
    size: 6 + Math.round(Math.random() * 8),
    rotation: Math.round(Math.random() * 120 - 60),
    delay: Math.round(Math.random() * 120),
    hueShift: Math.round(Math.random() * 30 - 15),
  }));
}

export default function SpectrumExercise({
  exercise,
  answers,
  onChange,
}: {
  exercise: ExerciseLike;
  answers: string[];
  onChange: (nextValues: string[]) => void;
}) {
  const config = useMemo(() => parseStoredSpectrumConfig(exercise.options), [exercise.options]);
  const hydratedAnswer = useMemo(
    () => parseStoredSpectrumAnswer(answers) ?? getDefaultSpectrumAnswer(config),
    [answers, config],
  );
  const [score, setScore] = useState(() => hydratedAnswer.score);
  const [justification, setJustification] = useState(() => hydratedAnswer.justification);
  const [edgeMessage, setEdgeMessage] = useState("");
  const [effectState, setEffectState] = useState<{
    trigger: number;
    type: SpectrumEffectType;
    edge: SpectrumEdgeTriggered;
    particles: EffectParticle[];
  } | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const trackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyPreference = () => setPrefersReducedMotion(mediaQuery.matches);

    applyPreference();
    mediaQuery.addEventListener("change", applyPreference);
    return () => mediaQuery.removeEventListener("change", applyPreference);
  }, []);

  const answer = useMemo(
    () =>
      buildSpectrumAnswer({
        config,
        score,
        justification,
      }),
    [config, score, justification],
  );

  useEffect(() => {
    onChange([serializeSpectrumAnswer(answer)]);
  }, [answer, onChange]);

  useEffect(() => {
    if (!effectState) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setEffectState(null);
    }, 1100);

    return () => window.clearTimeout(timeoutId);
  }, [effectState]);

  function handleRelease() {
    const edgeTriggered = getSpectrumEdgeTriggered(config, score);

    if (!edgeTriggered) {
      setEdgeMessage("");
      setEffectState(null);
      return;
    }

    setEdgeMessage(
      edgeTriggered === "left" ? config.leftEdgeMessage : config.rightEdgeMessage,
    );

    if (!config.enableEdgeEffect || prefersReducedMotion) {
      setEffectState(null);
      return;
    }

    setEffectState({
      trigger: Date.now(),
      type: config.edgeEffectType,
      edge: edgeTriggered,
      particles:
        config.edgeEffectType === "pulse"
          ? []
          : buildEffectParticles(config.edgeEffectType === "confetti" ? 16 : 10),
    });
  }

  const filledTrackStyle = {
    width: `${score}%`,
  };

  return (
    <div className="mt-4 space-y-4 rounded-[1.6rem] border border-[#eadfca] bg-[linear-gradient(180deg,#fffdfa,#fff7ef)] p-5 shadow-[0_16px_40px_rgba(210,189,152,0.08)]">
      <div className="flex items-center justify-between gap-4 text-sm font-semibold text-[#5f544a]">
        <span className="inline-flex items-center gap-2">
          {config.leftEmoji ? <span aria-hidden="true">{config.leftEmoji}</span> : null}
          <span>{config.leftLabel}</span>
        </span>
        <span className="inline-flex items-center gap-2 text-right">
          <span>{config.rightLabel}</span>
          {config.rightEmoji ? <span aria-hidden="true">{config.rightEmoji}</span> : null}
        </span>
      </div>

      <div className="space-y-5">
        <div ref={trackRef} className="relative px-1 py-5">
          <div className="absolute inset-x-1 top-1/2 h-2 -translate-y-1/2 rounded-full bg-[#efe7db]" />
          <div
            className="absolute left-1 top-1/2 h-2 -translate-y-1/2 rounded-full bg-[linear-gradient(90deg,#d7e6da,#eed9b7,#df9b39)]"
            style={filledTrackStyle}
          />

          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={score}
            onChange={(event) => setScore(Number(event.target.value))}
            onMouseUp={handleRelease}
            onTouchEnd={handleRelease}
            onKeyUp={(event) => {
              if (
                event.key.startsWith("Arrow") ||
                event.key === "Home" ||
                event.key === "End" ||
                event.key === "PageUp" ||
                event.key === "PageDown"
              ) {
                handleRelease();
              }
            }}
            aria-label={exercise.question}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={score}
            className="spectrum-range relative z-10 h-10 w-full appearance-none bg-transparent"
          />

          <div
            className="pointer-events-none absolute top-1/2 z-20 h-6 w-6 -translate-y-1/2 rounded-full border border-white bg-[linear-gradient(135deg,#d88a2f,#f0cf55)] shadow-[0_12px_24px_rgba(207,116,48,0.28)] transition-[left,transform,box-shadow] duration-200"
            style={{ left: `calc(${score}% - 0.75rem)` }}
          >
            {effectState?.type === "pulse" ? (
              <span
                key={effectState.trigger}
                className="absolute inset-[-0.55rem] rounded-full border border-[#f0cf55]/55 animate-[spectrum-pulse_900ms_ease-out]"
              />
            ) : null}
            {effectState && effectState.type !== "pulse" ? (
              <span className="absolute inset-0">
                {effectState.particles.map((particle) => (
                  <span
                    key={particle.id}
                    className={`absolute left-1/2 top-1/2 block -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 ${
                      effectState.type === "confetti"
                        ? "animate-[spectrum-confetti_1000ms_cubic-bezier(0.18,0.8,0.32,1)_forwards]"
                        : "animate-[spectrum-sparkle_900ms_ease-out_forwards]"
                    }`}
                    style={{
                      width: `${particle.size}px`,
                      height:
                        effectState.type === "confetti"
                          ? `${Math.max(4, Math.round(particle.size * 0.65))}px`
                          : `${particle.size}px`,
                      marginLeft: `${particle.x}px`,
                      marginTop: `${particle.y}px`,
                      animationDelay: `${particle.delay}ms`,
                      transform: `translate(-50%, -50%) rotate(${particle.rotation}deg)`,
                      background:
                        effectState.type === "confetti"
                          ? `hsl(${36 + particle.hueShift} 82% 72%)`
                          : "radial-gradient(circle, rgba(255,255,255,0.98) 0%, rgba(240,207,85,0.95) 45%, rgba(240,207,85,0) 72%)",
                      boxShadow:
                        effectState.type === "sparkle"
                          ? "0 0 18px rgba(240,207,85,0.42)"
                          : undefined,
                    }}
                  />
                ))}
              </span>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_15rem] md:items-start">
          <div className="rounded-[1rem] border border-[#f0dfc6] bg-white px-4 py-4">
            <p className="text-[0.72rem] font-black uppercase tracking-[0.16em] text-[#cf7430]">
              Interpretation
            </p>
            <p className="mt-2 text-sm leading-6 text-[#5f544a]">{answer.interpretation}</p>
            <p className="mt-3 text-sm leading-6 text-[#8a8077]">{config.helperText}</p>
            {edgeMessage ? (
              <p className="mt-3 rounded-[0.9rem] bg-[#fff7ec] px-3 py-3 text-sm leading-6 text-[#6f645b]">
                {edgeMessage}
              </p>
            ) : null}
          </div>

          <div className="rounded-[1rem] border border-[#eadfca] bg-white px-4 py-4 text-center">
            <p className="text-[0.72rem] font-black uppercase tracking-[0.16em] text-[#7a7087]">
              Score
            </p>
            <p className="mt-3 text-4xl font-black leading-none text-[#4b4550]">{score}</p>
          </div>
        </div>
      </div>

      {config.enableJustification ? (
        <label className="block rounded-[1rem] border border-[#eadfca] bg-white px-4 py-4">
          <span className="block text-sm font-semibold leading-7 text-[#5f544a]">
            Pourquoi ce positionnement ?
            {config.requireJustification ? (
              <span className="ml-2 text-[#cf7430]">*</span>
            ) : null}
          </span>
          <textarea
            value={justification}
            onChange={(event) => setJustification(event.target.value)}
            rows={4}
            className="mt-3 min-h-24 w-full rounded-[0.9rem] border border-[#eadfca] bg-[#fffdf9] px-4 py-3 text-base text-[#5f544a] outline-none focus:border-[#f0cf55] focus:ring-4 focus:ring-[#f0cf55]/20"
            placeholder="Explique ce qui motive ce choix."
          />
        </label>
      ) : null}
    </div>
  );
}
