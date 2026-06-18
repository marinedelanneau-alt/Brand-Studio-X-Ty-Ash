"use client";

import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowUpTrayIcon,
  PhotoIcon,
  PlusIcon,
  SparklesIcon,
  SwatchIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useMemo, useRef, useState } from "react";
import { uploadExerciseImages } from "@/app/upload-exercise-images";
import { getBrandPersonaFields, parseStoredBrandPersonaConfig } from "@/lib/brand-persona";
import { parseStoredColorPaletteAnswer } from "@/lib/color-palette";
import {
  analyzeMoodboard,
  autoArrange,
  createMoodboardFromTemplate,
  createSuggestedMoodboardImages,
  generateMoodboard,
  getMoodboardImageCount,
  getMoodboardTemplate,
  parseStoredMoodboardAnswer,
  serializeMoodboardAnswer,
  type MoodboardAnswer,
  type MoodboardBlock,
  type MoodboardLayoutStyle,
} from "@/lib/moodboard";
import type { WorkspaceModule } from "@/lib/training-types";
import {
  getDefaultMoodboardConfig,
  parseIndexedAnswerItems,
  parseStoredImageUploadConfig,
  parseStoredMoodboardConfig,
  type MoodboardConfig,
} from "@/lib/exercise-types";
import PedagogicalContent from "./pedagogical-content";

type ExerciseLike = WorkspaceModule["exercises"][number];

type UploadState = {
  status: "idle" | "loading" | "error";
  message: string;
};

const initialUploadState: UploadState = {
  status: "idle",
  message: "",
};

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized, 16);

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function sanitizeHex(value: string, fallback = "#E9DDCF") {
  const normalized = value.trim().toUpperCase();
  return /^#[0-9A-F]{6}$/.test(normalized) ? normalized : fallback;
}

function colorToRgba(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(sanitizeHex(hex));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Le fichier n'a pas pu être converti en image."));
    };

    reader.onerror = () => {
      reject(reader.error ?? new Error("La lecture du fichier a échoué."));
    };

    reader.readAsDataURL(file);
  });
}

function getBoardBackground(palette: string[]) {
  const base = sanitizeHex(palette[0] ?? "#FBF5EC");
  const accent = sanitizeHex(palette[1] ?? "#E3C79D");
  const contrast = sanitizeHex(palette[2] ?? "#556274");

  return `linear-gradient(145deg, ${colorToRgba(base, 0.9)}, ${colorToRgba(
    accent,
    0.55,
  )} 52%, ${colorToRgba(contrast, 0.28)} 100%)`;
}

function getBlockShadow(style: MoodboardLayoutStyle) {
  if (style === "collage" || style === "bold") {
    return "0 22px 42px rgba(71, 52, 33, 0.18)";
  }

  return "0 14px 32px rgba(71, 52, 33, 0.12)";
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Image impossible à charger."));
    image.src = url;
  });
}

async function renderBoardToCanvas(input: {
  board: MoodboardAnswer;
  palette: string[];
  width?: number;
  height?: number;
}) {
  const width = input.width ?? 1200;
  const height = input.height ?? 1500;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas indisponible sur ce navigateur.");
  }

  const background = context.createLinearGradient(0, 0, width, height);
  const colors = [
    sanitizeHex(input.palette[0] ?? "#FBF5EC"),
    sanitizeHex(input.palette[1] ?? "#E3C79D"),
    sanitizeHex(input.palette[2] ?? "#556274"),
  ];
  background.addColorStop(0, colors[0]);
  background.addColorStop(0.52, colors[1]);
  background.addColorStop(1, colors[2]);
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  const orderedBlocks = input.board.blocks.slice().sort((left, right) => left.zIndex - right.zIndex);

  for (const block of orderedBlocks) {
    const x = (block.x / 100) * width;
    const y = (block.y / 100) * height;
    const blockWidth = (block.w / 100) * width;
    const blockHeight = (block.h / 100) * height;
    const centerX = x + blockWidth / 2;
    const centerY = y + blockHeight / 2;

    context.save();
    context.translate(centerX, centerY);
    context.rotate((block.rotation * Math.PI) / 180);
    context.translate(-blockWidth / 2, -blockHeight / 2);

    context.shadowColor = "rgba(71, 52, 33, 0.18)";
    context.shadowBlur = 28;
    context.shadowOffsetY = 14;

    const radius = Math.min(blockWidth, blockHeight) * 0.08;
    context.beginPath();
    context.moveTo(radius, 0);
    context.lineTo(blockWidth - radius, 0);
    context.quadraticCurveTo(blockWidth, 0, blockWidth, radius);
    context.lineTo(blockWidth, blockHeight - radius);
    context.quadraticCurveTo(blockWidth, blockHeight, blockWidth - radius, blockHeight);
    context.lineTo(radius, blockHeight);
    context.quadraticCurveTo(0, blockHeight, 0, blockHeight - radius);
    context.lineTo(0, radius);
    context.quadraticCurveTo(0, 0, radius, 0);
    context.closePath();
    context.clip();

    if (block.type === "image") {
      try {
        const image = await loadImage(block.imageUrl);
        const scale = Math.max(blockWidth / image.width, blockHeight / image.height);
        const drawWidth = image.width * scale;
        const drawHeight = image.height * scale;
        context.drawImage(
          image,
          (blockWidth - drawWidth) / 2,
          (blockHeight - drawHeight) / 2,
          drawWidth,
          drawHeight,
        );
      } catch {
        context.fillStyle = "rgba(255,255,255,0.85)";
        context.fillRect(0, 0, blockWidth, blockHeight);
      }
    } else if (block.type === "color") {
      context.fillStyle = sanitizeHex(block.color);
      context.fillRect(0, 0, blockWidth, blockHeight);
      context.fillStyle = "rgba(255,255,255,0.92)";
      context.fillRect(24, blockHeight - 94, blockWidth - 48, 54);
      context.fillStyle = "#4B4550";
      context.font = "600 28px Arial";
      context.fillText(block.label || "Couleur", 42, blockHeight - 58);
    } else {
      context.fillStyle = "rgba(255,255,255,0.92)";
      context.fillRect(0, 0, blockWidth, blockHeight);
      context.fillStyle = "#4B4550";
      context.font = block.type === "text" ? "italic 600 38px Georgia" : "700 42px Arial";
      const text = block.type === "text" ? block.text : block.keyword;
      const words = text.split(/\s+/);
      let line = "";
      let lineY = 72;

      for (const word of words) {
        const nextLine = line ? `${line} ${word}` : word;
        const measuredWidth = context.measureText(nextLine).width;

        if (measuredWidth > blockWidth - 72 && line) {
          context.fillText(line, 36, lineY);
          line = word;
          lineY += 52;
        } else {
          line = nextLine;
        }
      }

      if (line) {
        context.fillText(line, 36, lineY);
      }

      if (block.type === "text" && block.author) {
        context.font = "500 22px Arial";
        context.fillStyle = "#7B7068";
        context.fillText(block.author, 36, Math.min(blockHeight - 36, lineY + 72));
      }
    }

    context.restore();
  }

  return canvas;
}

function dataUriToUint8Array(dataUri: string) {
  const base64 = dataUri.split(",")[1] ?? "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function buildPdfFromJpeg(jpegBytes: Uint8Array, width: number, height: number) {
  const pageWidth = 595.28;
  const pageHeight = (height / width) * pageWidth;
  const contentStream = `q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Im0 Do\nQ`;
  const encoder = new TextEncoder();
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`,
    `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`,
    `\nendstream\nendobj\n`,
    `5 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}\nendstream\nendobj\n`,
  ];

  const parts: Uint8Array[] = [encoder.encode("%PDF-1.3\n")];
  const offsets: number[] = [0];
  let byteLength = parts[0].length;

  const pushText = (value: string) => {
    const bytes = encoder.encode(value);
    parts.push(bytes);
    byteLength += bytes.length;
  };

  offsets.push(byteLength);
  pushText(objects[0]);
  offsets.push(byteLength);
  pushText(objects[1]);
  offsets.push(byteLength);
  pushText(objects[2]);
  offsets.push(byteLength);
  pushText(objects[3]);
  parts.push(jpegBytes);
  byteLength += jpegBytes.length;
  pushText(objects[4]);
  offsets.push(byteLength);
  pushText(objects[5]);

  const xrefOffset = byteLength;
  let xref = `xref\n0 ${offsets.length}\n0000000000 65535 f \n`;

  for (let index = 1; index < offsets.length; index += 1) {
    xref += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }

  pushText(
    `${xref}trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`,
  );

  const blobParts: BlobPart[] = parts.map((part) => new Uint8Array(part));
  return new Blob(blobParts, { type: "application/pdf" });
}

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function collectMoodboardSignals(
  module: WorkspaceModule,
  answers: Record<number, string[]>,
  currentExerciseId: number,
) {
  const palette = module.exercises
    .filter((exercise) => exercise.type === "color_palette")
    .flatMap((exercise) => {
      const parsedAnswer = parseStoredColorPaletteAnswer(answers[exercise.id] ?? []);

      if (!parsedAnswer) {
        return [];
      }

      return [
        ...parsedAnswer.primaryColors.map((item) =>
          item.mode === "solid" ? item.hex : item.from,
        ),
        ...parsedAnswer.secondaryColors.map((item) =>
          item.mode === "solid" ? item.hex : item.from,
        ),
      ];
    })
    .filter(Boolean)
    .slice(0, 6)
    .map((value) => sanitizeHex(value));

  const persona = module.exercises
    .filter((exercise) => exercise.type === "brand_persona")
    .flatMap((exercise) => {
      const fields = getBrandPersonaFields(parseStoredBrandPersonaConfig(exercise.options));
      const indexedAnswers = parseIndexedAnswerItems(answers[exercise.id] ?? []);

      return fields.map((field, fieldIndex) =>
        indexedAnswers
          .filter((entry) => entry.questionIndex === fieldIndex)
          .map((entry) => entry.value)
          .join(" "),
      );
    })
    .join(" ")
    .trim();

  const keywordSource = module.exercises
    .filter((exercise) => exercise.id !== currentExerciseId)
    .flatMap((exercise) => answers[exercise.id] ?? [])
    .join(" ");
  const keywords = Array.from(
    new Set(
      keywordSource
        .toLowerCase()
        .replace(/[^a-zà-ÿ0-9#\s-]/gi, " ")
        .split(/\s+/)
        .filter((word) => word.length >= 5)
        .filter(
          (word) =>
            !new Set([
              "entre",
              "ton",
              "notre",
              "marque",
              "avec",
              "pour",
              "dans",
              "cette",
              "vraie",
              "tres",
              "plus",
              "ainsi",
              "comme",
              "leurs",
              "ton",
              "elles",
              "nous",
              "tu",
            ]).has(word),
        ),
    ),
  ).slice(0, 8);

  return {
    palette: palette.length > 0 ? palette : ["#F7EBDD", "#D9B98A", "#5A6474"],
    keywords,
    persona,
  };
}

function createImageBlock(url: string, caption: string): MoodboardBlock {
  return {
    id: `mood-image-${crypto.randomUUID()}`,
    type: "image",
    imageUrl: url,
    caption,
    x: 0,
    y: 0,
    w: 0,
    h: 0,
    rotation: 0,
    zIndex: 1,
  };
}

function applyBoardUpdate(
  current: MoodboardAnswer,
  nextBoard: MoodboardAnswer,
  onChange: (values: string[]) => void,
  setBoard: (value: MoodboardAnswer) => void,
) {
  const finalizedBoard = {
    ...nextBoard,
    feedback: analyzeMoodboard(nextBoard),
    ambiance: nextBoard.ambiance || current.ambiance,
  };
  setBoard(finalizedBoard);
  onChange([serializeMoodboardAnswer(finalizedBoard)]);
}

export default function MoodboardExercise({
  module,
  exercise,
  answers,
  allAnswers,
  onChange,
}: {
  module: WorkspaceModule;
  exercise: ExerciseLike;
  answers: string[];
  allAnswers: Record<number, string[]>;
  onChange: (nextValues: string[]) => void;
}) {
  const config = useMemo<MoodboardConfig>(() => {
    if (exercise.type === "moodboard") {
      return parseStoredMoodboardConfig(exercise.options);
    }

    return {
      ...getDefaultMoodboardConfig(),
      maxImages: parseStoredImageUploadConfig(exercise.options).maxImages,
    };
  }, [exercise.options, exercise.type]);

  const signals = useMemo(
    () => collectMoodboardSignals(module, allAnswers, exercise.id),
    [allAnswers, exercise.id, module],
  );
  const incomingBoard = useMemo(() => {
    const storedBoard = parseStoredMoodboardAnswer(answers, config.maxImages);

    if (storedBoard.blocks.length > 0) {
      return storedBoard;
    }

    if (exercise.type === "moodboard") {
      return createMoodboardFromTemplate(
        getMoodboardTemplate(config.templateId),
        signals,
      );
    }

    return storedBoard;
  }, [answers, config.maxImages, config.templateId, exercise.type, signals]);
  const [board, setBoard] = useState<MoodboardAnswer>(incomingBoard);
  const [uploadState, setUploadState] = useState<UploadState>(initialUploadState);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const suggestions = useMemo(
    () =>
      createSuggestedMoodboardImages(
        {
          palette: signals.palette,
          keywords: signals.keywords,
          persona: signals.persona,
          style: board.layoutStyle,
          maxImages: config.maxImages,
        },
        6,
      ),
    [board.layoutStyle, config.maxImages, signals],
  );
  const imageCount = getMoodboardImageCount(board);
  const slotsLeft = Math.max(config.maxImages - imageCount, 0);
  const selectedBlock =
    board.blocks.find((block) => block.id === selectedBlockId) ?? board.blocks[0] ?? null;

  useEffect(() => {
    setBoard(incomingBoard);
  }, [incomingBoard]);

  useEffect(() => {
    if (!selectedBlockId && board.blocks[0]) {
      setSelectedBlockId(board.blocks[0].id);
      return;
    }

    if (selectedBlockId && !board.blocks.some((block) => block.id === selectedBlockId)) {
      setSelectedBlockId(board.blocks[0]?.id ?? "");
    }
  }, [board.blocks, selectedBlockId]);

  function commit(nextBoard: MoodboardAnswer) {
    applyBoardUpdate(board, nextBoard, onChange, setBoard);
  }

  function updateBlocks(nextBlocks: MoodboardBlock[], nextStyle = board.layoutStyle) {
    commit({
      ...board,
      layoutStyle: nextStyle,
      blocks: nextBlocks,
    });
  }

  function changeStyle(style: MoodboardLayoutStyle) {
    updateBlocks(autoArrange(board.blocks, style), style);
  }

  function addBlock(block: MoodboardBlock) {
    const nextBlocks = autoArrange(
      [
        ...board.blocks,
        {
          ...block,
          zIndex: board.blocks.length + 1,
        },
      ],
      board.layoutStyle,
    );

    updateBlocks(nextBlocks);
    setSelectedBlockId(block.id);
  }

  function removeBlock(blockId: string) {
    updateBlocks(
      autoArrange(
        board.blocks.filter((block) => block.id !== blockId),
        board.layoutStyle,
      ),
    );
  }

  function patchSelectedBlock(patch: Partial<MoodboardBlock>) {
    if (!selectedBlock) {
      return;
    }

    updateBlocks(
      board.blocks.map((block) =>
        block.id === selectedBlock.id ? ({ ...block, ...patch } as MoodboardBlock) : block,
      ),
    );
  }

  async function handleGenerateMoodboard() {
    const nextBoard = generateMoodboard({
      palette: signals.palette,
      keywords: signals.keywords,
      persona: signals.persona,
      style: board.layoutStyle,
      maxImages: config.maxImages,
    });

    commit(nextBoard);
    setSelectedBlockId(nextBoard.blocks[0]?.id ?? "");
  }

  function handleAddSuggestion(imageUrl: string, caption: string) {
    if (slotsLeft <= 0) {
      return;
    }

    addBlock(createImageBlock(imageUrl, caption));
  }

  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0 || slotsLeft <= 0) {
      return;
    }

    setUploadState({
      status: "loading",
      message: "Import du moodboard en cours...",
    });

    const fileList = Array.from(files).slice(0, slotsLeft);
    const formData = new FormData();
    formData.set("moduleId", String(module.id));
    formData.set("exerciseId", String(exercise.id));
    formData.set("currentCount", String(imageCount));

    fileList.forEach((file) => {
      formData.append("images", file);
    });

    const result = await uploadExerciseImages(formData);

    if (result.status === "success") {
      const nextImages = result.urls.map((url, index) =>
        createImageBlock(url, `Inspiration ${imageCount + index + 1}`),
      );
      updateBlocks(autoArrange([...board.blocks, ...nextImages], board.layoutStyle));
      setUploadState(initialUploadState);
      return;
    }

    try {
      const fallbackUrls = await Promise.all(fileList.map((file) => fileToDataUrl(file)));
      const nextImages = fallbackUrls.map((url, index) =>
        createImageBlock(url, `Inspiration ${imageCount + index + 1}`),
      );
      updateBlocks(autoArrange([...board.blocks, ...nextImages], board.layoutStyle));
      setUploadState({
        status: "error",
        message: "Images ajoutées localement. L'enregistrement distant n'a pas encore abouti.",
      });
    } catch {
      setUploadState({
        status: "error",
        message: result.message,
      });
    }
  }

  async function exportAsPng() {
    const canvas = await renderBoardToCanvas({
      board,
      palette: signals.palette,
    });
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));

    if (!blob) {
      throw new Error("L'export PNG a échoué.");
    }

    triggerDownload(blob, "brand-studio-moodboard.png");
  }

  async function exportAsPdf() {
    const canvas = await renderBoardToCanvas({
      board,
      palette: signals.palette,
    });
    const jpegDataUri = canvas.toDataURL("image/jpeg", 0.92);
    const pdfBlob = buildPdfFromJpeg(dataUriToUint8Array(jpegDataUri), canvas.width, canvas.height);
    triggerDownload(pdfBlob, "brand-studio-moodboard.pdf");
  }

  return (
    <div className="mt-4 space-y-5">
      <section className="overflow-hidden rounded-[1.8rem] border border-[#eadfca] bg-[linear-gradient(180deg,#fffdfa,#fff5ea)] shadow-[0_18px_44px_rgba(210,189,152,0.1)]">
        <div className="border-b border-[#f0e1cb] px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-[0.74rem] font-black uppercase tracking-[0.22em] text-[#cf7430]">
                Moodboard intelligent
              </p>
              <h3 className="mt-3 font-[family:var(--font-cormorant)] text-[2.3rem] leading-[0.94] text-[#4b4550]">
                Compose ton univers visuel
              </h3>
              <PedagogicalContent
                content={
                  exercise.explanation ||
                  "Mele images, couleurs, citations et mots-cles pour faire emerger une direction artistique coherente."
                }
                className="mt-5 rounded-[1rem] border border-[#eadfca] bg-[#fffaf2] px-4 py-4"
              />
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#6f645b]">
                Génération locale basée sur ta palette, tes réponses et le persona de marque déjà défini dans Brand Studio.
              </p>
            </div>

            <div className="rounded-[1.2rem] border border-[#eadfca] bg-white/80 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]">
              <p className="text-[0.7rem] font-black uppercase tracking-[0.18em] text-[#7a7087]">
                Ambiance
              </p>
              <p className="mt-3 max-w-56 text-sm leading-6 text-[#5f544a]">
                {board.feedback || "Ton moodboard se construira ici, avec une lecture immédiate de son équilibre visuel."}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void handleGenerateMoodboard()}
              className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#df9b39,#f1cc56)] px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-white shadow-[0_16px_30px_rgba(223,155,57,0.25)]"
            >
              <SparklesIcon className="h-4 w-4" />
              Generer un moodboard
            </button>
            <button
              type="button"
              onClick={() => setShowSuggestions((current) => !current)}
              className="inline-flex items-center gap-2 rounded-full border border-[#eadfca] bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-[#6b625a]"
            >
              <PhotoIcon className="h-4 w-4" />
              Suggérer des images
            </button>
            <button
              type="button"
              onClick={() => updateBlocks(autoArrange(board.blocks, board.layoutStyle))}
              className="inline-flex items-center gap-2 rounded-full border border-[#eadfca] bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-[#6b625a]"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Auto-layout
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={slotsLeft <= 0 || uploadState.status === "loading"}
              className="inline-flex items-center gap-2 rounded-full border border-[#eadfca] bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-[#6b625a] disabled:cursor-not-allowed disabled:opacity-55"
            >
              <ArrowUpTrayIcon className="h-4 w-4" />
              Ajouter des images
            </button>
            <button
              type="button"
              onClick={() => void exportAsPng()}
              className="inline-flex items-center gap-2 rounded-full border border-[#eadfca] bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-[#6b625a]"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Export PNG
            </button>
            <button
              type="button"
              onClick={() => void exportAsPdf()}
              className="inline-flex items-center gap-2 rounded-full border border-[#eadfca] bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-[#6b625a]"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Export PDF
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple={slotsLeft > 1}
              onChange={(event) => {
                void handleFileUpload(event.currentTarget.files);
                event.currentTarget.value = "";
              }}
              className="sr-only"
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {(["editorial", "minimal", "collage", "grid", "bold"] as MoodboardLayoutStyle[]).map(
              (style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => changeStyle(style)}
                  className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.15em] transition ${
                    board.layoutStyle === style
                      ? "bg-[#cf7430] text-white"
                      : "border border-[#eadfca] bg-white text-[#6b625a]"
                  }`}
                >
                  {style}
                </button>
              ),
            )}
          </div>

          {uploadState.message ? (
            <p
              className={`mt-4 text-sm leading-6 ${
                uploadState.status === "error" ? "text-[#9d5f46]" : "text-[#7b7068]"
              }`}
            >
              {uploadState.message}
            </p>
          ) : null}
        </div>

        {showSuggestions ? (
          <div className="border-b border-[#f0e1cb] px-5 py-5 sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[0.72rem] font-black uppercase tracking-[0.18em] text-[#cf7430]">
                  Suggestions d&apos;images
                </p>
                <p className="mt-2 text-sm leading-6 text-[#7b7068]">
                  Propositions construites à partir de tes mots-clés, de ta palette et du ton déjà émergé.
                </p>
              </div>
              <p className="rounded-full border border-[#eadfca] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#7a7087]">
                {slotsLeft} slot{slotsLeft > 1 ? "s" : ""} libre{slotsLeft > 1 ? "s" : ""}
              </p>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {suggestions.map((suggestion, index) => (
                <div
                  key={suggestion.id}
                  className="overflow-hidden rounded-[1.2rem] border border-[#eadfca] bg-white shadow-[0_16px_34px_rgba(210,189,152,0.12)]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={suggestion.imageUrl}
                    alt={suggestion.caption || `Suggestion ${index + 1}`}
                    className="aspect-[4/5] w-full object-cover"
                  />
                  <div className="flex items-center justify-between gap-3 px-4 py-4">
                    <div>
                      <p className="text-sm font-semibold leading-6 text-[#5f544a]">
                        {suggestion.caption || `Suggestion ${index + 1}`}
                      </p>
                      <p className="text-xs uppercase tracking-[0.14em] text-[#8a8077]">
                        Cohérence éditoriale
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={slotsLeft <= 0}
                      onClick={() => handleAddSuggestion(suggestion.imageUrl, suggestion.caption)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#eadfca] bg-[#fff8f1] text-[#6b625a] disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Ajouter cette suggestion"
                    >
                      <PlusIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="grid gap-5 px-5 py-6 sm:px-6 xl:grid-cols-[minmax(0,1.6fr)_20rem]">
          <div className="space-y-4">
            <div
              className="relative overflow-hidden rounded-[1.8rem] border border-[#eadfca] p-4 shadow-[0_20px_44px_rgba(210,189,152,0.14)]"
              style={{ background: getBoardBackground(signals.palette) }}
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.42),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.2),transparent_36%)]" />
              <div className="relative aspect-[4/5] w-full rounded-[1.4rem] border border-white/60 bg-white/20 p-2 backdrop-blur-[1.5px]">
                {board.blocks.length === 0 ? (
                  <div className="flex h-full items-center justify-center rounded-[1.2rem] border border-dashed border-white/70 bg-white/30 px-6 text-center text-sm leading-7 text-[#5f544a]">
                    Lance une generation, ajoute des images ou compose ton moodboard bloc par bloc.
                  </div>
                ) : null}

                {board.blocks
                  .slice()
                  .sort((left, right) => left.zIndex - right.zIndex)
                  .map((block) => (
                    <button
                      key={block.id}
                      type="button"
                      onClick={() => setSelectedBlockId(block.id)}
                      className={`absolute overflow-hidden rounded-[1.15rem] border text-left transition ${
                        selectedBlock?.id === block.id
                          ? "border-[#cf7430] ring-2 ring-[#cf7430]/25"
                          : "border-white/70"
                      }`}
                      style={{
                        left: `${block.x}%`,
                        top: `${block.y}%`,
                        width: `${block.w}%`,
                        height: `${block.h}%`,
                        transform: `rotate(${block.rotation}deg)`,
                        boxShadow: getBlockShadow(board.layoutStyle),
                        zIndex: block.zIndex,
                        background:
                          block.type === "color"
                            ? sanitizeHex(block.color)
                            : block.type === "text" || block.type === "keyword"
                              ? "rgba(255,255,255,0.92)"
                              : undefined,
                      }}
                    >
                      {block.type === "image" ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={block.imageUrl}
                            alt={block.caption || "Inspiration"}
                            className="h-full w-full object-cover"
                          />
                          {block.caption ? (
                            <span className="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,rgba(47,36,24,0.62))] px-3 py-3 text-xs font-semibold tracking-[0.08em] text-white">
                              {block.caption}
                            </span>
                          ) : null}
                        </>
                      ) : null}

                      {block.type === "color" ? (
                        <div className="flex h-full flex-col justify-end bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(0,0,0,0.12))] px-4 py-4 text-white">
                          <span className="text-sm font-semibold">{block.label || "Couleur"}</span>
                          <span className="mt-1 text-xs uppercase tracking-[0.14em] text-white/85">
                            {block.color}
                          </span>
                        </div>
                      ) : null}

                      {block.type === "text" ? (
                        <div className="flex h-full flex-col justify-between px-4 py-4 text-[#4b4550]">
                          <span className="font-[family:var(--font-cormorant)] text-[1.55rem] italic leading-[1.05]">
                            {block.text}
                          </span>
                          {block.author ? (
                            <span className="text-xs uppercase tracking-[0.16em] text-[#8a8077]">
                              {block.author}
                            </span>
                          ) : null}
                        </div>
                      ) : null}

                      {block.type === "keyword" ? (
                        <div className="flex h-full items-center justify-center px-4 py-4">
                          <span className="text-center text-lg font-black uppercase tracking-[0.18em] text-[#4b4550]">
                            {block.keyword}
                          </span>
                        </div>
                      ) : null}
                    </button>
                  ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  addBlock({
                    id: `mood-text-${crypto.randomUUID()}`,
                    type: "text",
                    text: "Une citation qui donne le ton",
                    author: "Brand Studio",
                    x: 0,
                    y: 0,
                    w: 0,
                    h: 0,
                    rotation: 0,
                    zIndex: 1,
                  })
                }
                className="inline-flex items-center gap-2 rounded-full border border-[#eadfca] bg-white px-4 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-[#6b625a]"
              >
                <PlusIcon className="h-4 w-4" />
                Ajouter une citation
              </button>
              <button
                type="button"
                onClick={() =>
                  addBlock({
                    id: `mood-keyword-${crypto.randomUUID()}`,
                    type: "keyword",
                    keyword: signals.keywords[0] ?? "Presence",
                    x: 0,
                    y: 0,
                    w: 0,
                    h: 0,
                    rotation: 0,
                    zIndex: 1,
                  })
                }
                className="inline-flex items-center gap-2 rounded-full border border-[#eadfca] bg-white px-4 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-[#6b625a]"
              >
                <PlusIcon className="h-4 w-4" />
                Ajouter un mot-clé
              </button>
              <button
                type="button"
                onClick={() =>
                  addBlock({
                    id: `mood-color-${crypto.randomUUID()}`,
                    type: "color",
                    color: signals.palette[0] ?? "#E9DDCF",
                    label: "Couleur",
                    usage: "Accent",
                    x: 0,
                    y: 0,
                    w: 0,
                    h: 0,
                    rotation: 0,
                    zIndex: 1,
                  })
                }
                className="inline-flex items-center gap-2 rounded-full border border-[#eadfca] bg-white px-4 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-[#6b625a]"
              >
                <SwatchIcon className="h-4 w-4" />
                Ajouter une couleur
              </button>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-[1.4rem] border border-[#eadfca] bg-white p-5 shadow-[0_16px_34px_rgba(210,189,152,0.1)]">
              <p className="text-[0.72rem] font-black uppercase tracking-[0.16em] text-[#cf7430]">
                Retours
              </p>
              <p className="mt-3 text-sm leading-7 text-[#5f544a]">
                {board.feedback || "Le feedback intelligent s'affichera ici une fois la composition amorcee."}
              </p>
              <p className="mt-3 text-xs uppercase tracking-[0.16em] text-[#8a8077]">
                {imageCount}/{config.maxImages} blocs image
              </p>
            </div>

            <div className="rounded-[1.4rem] border border-[#eadfca] bg-white p-5 shadow-[0_16px_34px_rgba(210,189,152,0.1)]">
              <p className="text-[0.72rem] font-black uppercase tracking-[0.16em] text-[#cf7430]">
                Bloc sélectionné
              </p>

              {selectedBlock ? (
                <div className="mt-4 space-y-4">
                  {selectedBlock.type === "image" ? (
                    <>
                      <label className="block space-y-2">
                        <span className="text-xs font-black uppercase tracking-[0.16em] text-[#7a7087]">
                          Legende
                        </span>
                        <input
                          type="text"
                          value={selectedBlock.caption}
                          onChange={(event) => patchSelectedBlock({ caption: event.target.value })}
                          className="h-11 w-full rounded-[0.9rem] border border-[#eadfca] bg-[#fffdf7] px-4 text-sm text-[#5f544a]"
                        />
                      </label>
                    </>
                  ) : null}

                  {selectedBlock.type === "color" ? (
                    <>
                      <label className="block space-y-2">
                        <span className="text-xs font-black uppercase tracking-[0.16em] text-[#7a7087]">
                          Nom
                        </span>
                        <input
                          type="text"
                          value={selectedBlock.label}
                          onChange={(event) => patchSelectedBlock({ label: event.target.value })}
                          className="h-11 w-full rounded-[0.9rem] border border-[#eadfca] bg-[#fffdf7] px-4 text-sm text-[#5f544a]"
                        />
                      </label>
                      <label className="block space-y-2">
                        <span className="text-xs font-black uppercase tracking-[0.16em] text-[#7a7087]">
                          HEX
                        </span>
                        <input
                          type="text"
                          value={selectedBlock.color}
                          onChange={(event) =>
                            patchSelectedBlock({ color: sanitizeHex(event.target.value, selectedBlock.color) })
                          }
                          className="h-11 w-full rounded-[0.9rem] border border-[#eadfca] bg-[#fffdf7] px-4 text-sm uppercase text-[#5f544a]"
                        />
                      </label>
                      <label className="block space-y-2">
                        <span className="text-xs font-black uppercase tracking-[0.16em] text-[#7a7087]">
                          Usage
                        </span>
                        <textarea
                          value={selectedBlock.usage}
                          onChange={(event) => patchSelectedBlock({ usage: event.target.value })}
                          className="min-h-24 w-full rounded-[0.9rem] border border-[#eadfca] bg-[#fffdf7] px-4 py-3 text-sm text-[#5f544a]"
                        />
                      </label>
                    </>
                  ) : null}

                  {selectedBlock.type === "text" ? (
                    <>
                      <label className="block space-y-2">
                        <span className="text-xs font-black uppercase tracking-[0.16em] text-[#7a7087]">
                          Citation
                        </span>
                        <textarea
                          value={selectedBlock.text}
                          onChange={(event) => patchSelectedBlock({ text: event.target.value })}
                          className="min-h-28 w-full rounded-[0.9rem] border border-[#eadfca] bg-[#fffdf7] px-4 py-3 text-sm text-[#5f544a]"
                        />
                      </label>
                      <label className="block space-y-2">
                        <span className="text-xs font-black uppercase tracking-[0.16em] text-[#7a7087]">
                          Signature
                        </span>
                        <input
                          type="text"
                          value={selectedBlock.author}
                          onChange={(event) => patchSelectedBlock({ author: event.target.value })}
                          className="h-11 w-full rounded-[0.9rem] border border-[#eadfca] bg-[#fffdf7] px-4 text-sm text-[#5f544a]"
                        />
                      </label>
                    </>
                  ) : null}

                  {selectedBlock.type === "keyword" ? (
                    <label className="block space-y-2">
                      <span className="text-xs font-black uppercase tracking-[0.16em] text-[#7a7087]">
                        Mot-cle
                      </span>
                      <input
                        type="text"
                        value={selectedBlock.keyword}
                        onChange={(event) => patchSelectedBlock({ keyword: event.target.value })}
                        className="h-11 w-full rounded-[0.9rem] border border-[#eadfca] bg-[#fffdf7] px-4 text-sm text-[#5f544a]"
                      />
                    </label>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => removeBlock(selectedBlock.id)}
                    className="inline-flex items-center gap-2 rounded-full border border-[#f1d6c8] bg-[#fff6f0] px-4 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-[#9d5f46]"
                  >
                    <TrashIcon className="h-4 w-4" />
                    Retirer ce bloc
                  </button>
                </div>
              ) : (
                <p className="mt-4 text-sm leading-7 text-[#7b7068]">
                  Sélectionne un bloc dans la composition pour l&apos;affiner.
                </p>
              )}
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
