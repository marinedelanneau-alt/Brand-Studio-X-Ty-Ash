import { describe, expect, it } from "vitest";
import { findFinalAnswerCandidate } from "../lib/brand-guide-final-answers";

type Candidate = {
  id: number;
  label: string;
  type: string;
  answer: string;
};

const candidates: Candidate[] = [
  {
    id: 1,
    label: "Avant moi, mes clients sont… Après moi…",
    type: "open",
    answer: "Réponse préparatoire de promesse",
  },
  {
    id: 2,
    label: "Ta promesse",
    type: "prompt_open",
    answer: "Promesse finale uniquement",
  },
  {
    id: 3,
    label: "Qu'est-ce qui te distingue de tes concurrents ?",
    type: "open",
    answer: "Réponse préparatoire de positionnement",
  },
  {
    id: 4,
    label: "Ton positionnement",
    type: "prompt_open",
    answer: "Positionnement final uniquement",
  },
];

describe("brand guide final answer selection", () => {
  it("rejects preparatory prompts and prefers explicitly final answers", () => {
    const drafts = [{ label: "Comment améliorer ton positionnement ?", type: "prompt_open" }];
    expect(findFinalAnswerCandidate(drafts, "positioning")).toBeUndefined();
    const final = { label: "Ton positionnement final", type: "prompt_open" };
    expect(findFinalAnswerCandidate([...drafts, { label: "Ton positionnement", type: "prompt_open" }, final], "positioning")).toBe(final);
  });
  it("selects only the final promise answer", () => {
    expect(findFinalAnswerCandidate(candidates, "promise")?.answer).toBe(
      "Promesse finale uniquement",
    );
  });

  it("selects only the final positioning answer", () => {
    expect(findFinalAnswerCandidate(candidates, "positioning")?.answer).toBe(
      "Positionnement final uniquement",
    );
  });

  it("does not substitute preparatory answers when final answers are absent", () => {
    const drafts = candidates.filter((candidate) => candidate.id === 1 || candidate.id === 3);

    expect(findFinalAnswerCandidate(drafts, "promise")).toBeUndefined();
    expect(findFinalAnswerCandidate(drafts, "positioning")).toBeUndefined();
  });
});
