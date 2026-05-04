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

  if (isReadingSubmodule) {
    return (
      <div className="mt-8 space-y-6">
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
    <div className="mt-8 relative">
      <div className="border-t border-[#eadfca] pt-6">
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
