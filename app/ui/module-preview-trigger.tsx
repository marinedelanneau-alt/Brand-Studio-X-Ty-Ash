"use client";

import { EyeIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import type { WorkspaceModule } from "@/lib/training-types";
import ModuleSubmoduleViewer from "./module-submodule-viewer";

export default function ModulePreviewTrigger({
  submodules,
  currentIndex,
}: {
  submodules: WorkspaceModule["submodules"];
  currentIndex: number;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="group relative shrink-0"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-[#eadfca] bg-white text-[#6b625a] shadow-[0_10px_24px_rgba(210,189,152,0.12)] transition hover:border-[#cf7430] hover:text-[#cf7430]"
        aria-label="Afficher le texte du module"
        title="Afficher le texte du module"
      >
        <EyeIcon className="h-5 w-5" />
      </button>

      <div
        className={`absolute right-0 top-14 z-20 w-[min(38rem,calc(100vw-2rem))] transition ${
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <ModuleSubmoduleViewer
          submodules={submodules}
          currentIndex={currentIndex}
          onPrevious={() => undefined}
          onNext={() => undefined}
        />
      </div>
    </div>
  );
}
