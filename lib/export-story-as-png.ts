"use client";

import { toPng } from "html-to-image";

export async function exportStoryAsPng(cardElement: HTMLElement) {
  return toPng(cardElement, {
    cacheBust: true,
    canvasWidth: 1080,
    canvasHeight: 1920,
    pixelRatio: 3,
    backgroundColor: "#fbf4ea",
    filter: (node) => {
      if (!(node instanceof HTMLElement)) {
        return true;
      }

      return node.dataset.exportHidden !== "true";
    },
  });
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.rel = "noopener";
  link.click();
}

export async function dataUrlToFile(dataUrl: string, filename: string) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();

  return new File([blob], filename, { type: "image/png" });
}
