"use client";

import { useState } from "react";
import type { WorkspaceModule } from "@/lib/training-types";
import ModuleAnswerForm from "./module-answer-form";
import ModuleSubmoduleViewer from "./module-submodule-viewer";

export default function ModuleLearningSection({
  module,
  initialSubmoduleIndex = 0,
  initialExerciseIndex = 0,
  startInExercises = false,
}: {
  module: WorkspaceModule;
  initialSubmoduleIndex?: number;
  initialExerciseIndex?: number;
  startInExercises?: boolean;
}) {
  const [currentSubmoduleIndex, setCurrentSubmoduleIndex] = useState(initialSubmoduleIndex);
  const [isReadingSubmodule, setIsReadingSubmodule] = useState(!startInExercises);
  const [exerciseStartIndex, setExerciseStartIndex] = useState(initialExerciseIndex);
  const currentSubmodule = module.submodules[currentSubmoduleIndex];

  function openPreviousSubmodule() {
    setIsReadingSubmodule(true);
    setExerciseStartIndex(0);
    setCurrentSubmoduleIndex((current) => Math.max(current - 1, 0));
  }

  function openNextSubmodule() {
    setIsReadingSubmodule(true);
    setExerciseStartIndex(0);
    setCurrentSubmoduleIndex((current) =>
      Math.min(current + 1, module.submodules.length - 1),
    );
  }

  function openSubmodule(index: number) {
    setIsReadingSubmodule(true);
    setExerciseStartIndex(0);
    setCurrentSubmoduleIndex(index);
  }

  const submoduleNavigation =
    module.submodules.length > 1 ? (
      <nav
        aria-label="Sous-modules du module"
        className="border-t border-[#eadfca] pt-6"
      >
        <p className="text-[0.76rem] font-black uppercase tracking-[0.18em] text-[#7a7087]">
          Sous-modules
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {module.submodules.map((submodule, index) => {
            const isActive = index === currentSubmoduleIndex;

            return (
              <button
                key={submodule.id}
                type="button"
                onClick={() => openSubmodule(index)}
                aria-current={isActive ? "step" : undefined}
                className={`min-h-11 rounded-full border px-4 py-2 text-left text-xs font-black uppercase tracking-[0.12em] transition sm:text-sm ${
                  isActive
                    ? "border-[#cf7430] bg-[#fff6e3] text-[#cf7430]"
                    : "border-[#eadfca] bg-white text-[#6b625a] hover:border-[#cf7430] hover:text-[#cf7430]"
                }`}
              >
                <span className="block text-[0.64rem] leading-4 opacity-75">
                  Sous-module {index + 1}
                </span>
                <span className="block max-w-[16rem] truncate leading-5">
                  {submodule.title}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    ) : null;

  if (isReadingSubmodule) {
    return (
      <div className="mt-8 space-y-6">
        {submoduleNavigation}

        <ModuleSubmoduleViewer
          submodules={module.submodules}
          currentIndex={currentSubmoduleIndex}
          onPrevious={openPreviousSubmodule}
          onNext={openNextSubmodule}
        />

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              setExerciseStartIndex(0);
              setIsReadingSubmodule(false);
            }}
            className="flex h-12 items-center justify-center rounded-[0.95rem] bg-[linear-gradient(135deg,#df9b39,#f1cc56)] px-6 text-sm font-extrabold uppercase tracking-[0.12em] text-white"
          >
            Commencer les exercices
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mt-8">
      {submoduleNavigation}

      <div className={`${submoduleNavigation ? "mt-6" : ""} border-t border-[#eadfca] pt-6`}>
        <div>
          <ModuleAnswerForm
            module={module}
            activeSubmoduleId={currentSubmodule?.id}
            initialExerciseIndex={exerciseStartIndex}
            currentSubmoduleIndex={currentSubmoduleIndex}
            totalSubmodules={module.submodules.length}
            onPreviousSubmodule={openPreviousSubmodule}
            onNextSubmodule={openNextSubmodule}
          />
        </div>
      </div>
    </div>
  );
}
