import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Document, Page, renderToBuffer } from "@react-pdf/renderer";
import { createCanvas } from "@napi-rs/canvas";
import { TYASH_PAPER_STYLE, usesTyashPaper } from "../lib/tyash-paper";
import { TyashPaperGrid } from "../lib/tyash-paper-pdf";

afterEach(() => vi.unstubAllEnvs());

describe("shared TYASH paper reference", () => {
  it("preserves the exact reference CSS and keeps original Brand Studio outside the scope", () => {
    expect(TYASH_PAPER_STYLE.backgroundColor).toBe("#F4F0DF");
    expect(TYASH_PAPER_STYLE.backgroundSize).toBe("23px 23px");
    expect(TYASH_PAPER_STYLE.backgroundImage).toBe("linear-gradient(#E5DFC966 1px, transparent 1px), linear-gradient(90deg, #E5DFC966 1px, transparent 1px)");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://original.supabase.co");
    expect(usesTyashPaper()).toBe(false);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://cplzwnlstcpqqzqeawgs.supabase.co");
    expect(usesTyashPaper()).toBe(true);
  });

  it("rasterizes to the same 23 CSS px grid, colors and opacity on every A4 page", async () => {
    const buffer = await renderToBuffer(<Document>{[1, 2].map(page => <Page key={page} size="A4" style={{ backgroundColor: "#F4F0DF" }}><TyashPaperGrid /></Page>)}</Document>);
    const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const task = getDocument({ data: new Uint8Array(buffer) });
    try {
      const pdf = await task.promise;
      expect(pdf.numPages).toBe(2);
      const pagePixels: number[][] = [];
      for (let n = 1; n <= pdf.numPages; n++) {
        const page = await pdf.getPage(n);
        const viewport = page.getViewport({ scale: 96 / 72 });
        const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
        const context = canvas.getContext("2d");
        await page.render({ canvas: canvas as never, canvasContext: context as never, viewport }).promise;
        const pixel = (x: number, y: number) => [...context.getImageData(x, y, 1, 1).data].slice(0, 3);
        expect(pixel(5, 5)).toEqual([244, 240, 223]);
        // 40% line color composited over the cream background, as in CSS.
        for (const x of [23, 46, 69]) {
          const line = pixel(x, 5);
          for (const [channel, expected] of [238, 233, 214].entries()) expect(Math.abs(line[channel] - expected)).toBeLessThanOrEqual(1);
          expect(pixel(x + 1, 5)).toEqual([244, 240, 223]);
        }
        expect(pixel(5, 23)).toEqual(pixel(23, 5));
        expect(pixel(5, 46)).toEqual(pixel(46, 5));
        pagePixels.push([...pixel(5, 5), ...pixel(23, 5), ...pixel(23, 23)]);
      }
      expect(pagePixels[0]).toEqual(pagePixels[1]);
    } finally { await task.destroy(); }
  });
});
