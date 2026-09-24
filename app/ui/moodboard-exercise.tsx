"use client";

import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ArrowUpTrayIcon,
  ChatBubbleLeftRightIcon,
  CursorArrowRaysIcon,
  PhotoIcon,
  PlusIcon,
  StarIcon,
  SwatchIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { uploadExerciseImages } from "@/app/upload-exercise-images";
import { getBrandPersonaFields, parseStoredBrandPersonaConfig } from "@/lib/brand-persona";
import { parseStoredColorPaletteAnswer } from "@/lib/color-palette";
import {
  analyzeMoodboard,
  autoArrange,
  getDefaultMoodboardAnswer,
  getMoodboardImageCount,
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

type ExerciseLike = WorkspaceModule["exercises"][number];

type UploadState = {
  status: "idle" | "loading" | "error";
  message: string;
};

const initialUploadState: UploadState = {
  status: "idle",
  message: "",
};

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type BoardInteraction = {
  blockId: string;
  mode: "move" | "resize";
  startClientX: number;
  startClientY: number;
  initialX: number;
  initialY: number;
  initialW: number;
  initialH: number;
};

function sanitizeHex(value: string, fallback = "#E9DDCF") {
  const normalized = value.trim().toUpperCase();
  return /^#[0-9A-F]{6}$/.test(normalized) ? normalized : fallback;
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

async function compressMoodboardImage(file: File) {
  if (!ACCEPTED_IMAGE_TYPES.has(file.type) || file.size > MAX_IMAGE_BYTES) {
    throw new Error("Cette image n’a pas pu être ajoutée. Vérifie son format ou son poids.");
  }

  const sourceUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(sourceUrl);
    const maxDimension = 2_000;
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Compression indisponible.");
    }

    context.drawImage(image, 0, 0, width, height);
    const outputType = file.type === "image/png" ? "image/png" : "image/webp";
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, outputType, outputType === "image/webp" ? 0.82 : undefined),
    );

    if (!blob) {
      throw new Error("Compression impossible.");
    }

    const extension = outputType === "image/png" ? "png" : "webp";
    const baseName = file.name.replace(/\.[^.]+$/, "") || "inspiration";
    return new File([blob], `${baseName}.${extension}`, {
      type: outputType,
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

function clampPercent(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function AutoFitKeyword({
  children,
  color,
  fontSize,
}: {
  children: string;
  color: string;
  fontSize: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fittedSize, setFittedSize] = useState(fontSize);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const fit = () => {
      const availableWidth = Math.max(0, container.clientWidth - 32);
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context || availableWidth === 0) return;

      context.font = `900 ${fontSize}px Arial`;
      const letterSpacing = fontSize * 0.18 * Math.max(children.length - 1, 0);
      const naturalWidth = context.measureText(children.toUpperCase()).width + letterSpacing;
      setFittedSize(Math.max(8, Math.min(fontSize, fontSize * (availableWidth / naturalWidth))));
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(container);
    return () => observer.disconnect();
  }, [children, fontSize]);

  return (
    <div ref={containerRef} className="flex h-full w-full items-center justify-center px-4 py-4">
      <span
        className="max-w-full whitespace-nowrap text-center font-black uppercase tracking-[0.18em]"
        style={{ color, fontSize: `${fittedSize}px` }}
      >
        {children}
      </span>
    </div>
  );
}

function MoodboardIconGraphic({ name }: { name: "spark" | "star" | "leaf" | "circle" | "wave" }) {
  if (name === "circle") {
    return <span className="block h-16 w-16 rounded-full border-[6px] border-current" />;
  }

  if (name === "wave") {
    return <span className="text-6xl font-light leading-none">∿</span>;
  }

  if (name === "leaf") {
    return <span className="block h-16 w-10 rotate-45 rounded-[100%_0_100%_0] border-[5px] border-current" />;
  }

  return <StarIcon className={`h-16 w-16 ${name === "spark" ? "rotate-12" : ""}`} />;
}

function SafeMoodboardImage({
  src,
  alt,
  className,
  objectPosition,
}: {
  src: string;
  alt: string;
  className: string;
  objectPosition?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div className={`${className} flex items-center justify-center bg-[var(--surface-secondary)] text-[var(--text-muted)]`}>
        <PhotoIcon className="h-8 w-8" />
      </div>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} style={{ objectPosition }} onError={() => setFailed(true)} />;
}

function getBoardBackground(backgroundColor: string) {
  return sanitizeHex(backgroundColor, "#F5E8C8");
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

  context.fillStyle = sanitizeHex(input.board.backgroundColor, "#F5E8C8");
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
          (blockWidth - drawWidth) * (block.cropX / 100),
          (blockHeight - drawHeight) * (block.cropY / 100),
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
    } else if (block.type === "icon") {
      if (block.imageUrl) {
        try {
          const image = await loadImage(block.imageUrl);
          const scale = Math.min(blockWidth / image.width, blockHeight / image.height);
          const drawWidth = image.width * scale;
          const drawHeight = image.height * scale;
          context.drawImage(image, (blockWidth - drawWidth) / 2, (blockHeight - drawHeight) / 2, drawWidth, drawHeight);
        } catch {
          context.fillStyle = "rgba(255,255,255,0.65)";
          context.fillRect(0, 0, blockWidth, blockHeight);
        }
      } else {
        context.fillStyle = "rgba(255,255,255,0.92)";
        context.fillRect(0, 0, blockWidth, blockHeight);
        context.fillStyle = sanitizeHex(block.color, "#4B4550");
        context.font = `700 ${Math.max(42, Math.min(blockWidth, blockHeight) * 0.42)}px Arial`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        const iconGlyph = block.icon === "circle" ? "○" : block.icon === "wave" ? "∿" : block.icon === "leaf" ? "◒" : "✦";
        context.fillText(iconGlyph, blockWidth / 2, blockHeight / 2);
        context.textAlign = "start";
        context.textBaseline = "alphabetic";
      }
    } else {
      context.fillStyle = "rgba(255,255,255,0.92)";
      context.fillRect(0, 0, blockWidth, blockHeight);
      context.fillStyle = sanitizeHex(block.textColor, "#4B4550");
      const text = block.type === "text" ? block.text : block.keyword;

      if (block.type === "keyword") {
        context.font = `900 ${block.fontSize}px Arial`;
        const availableWidth = Math.max(1, blockWidth - 72);
        const naturalWidth = context.measureText(text.toUpperCase()).width;
        const fittedSize = Math.max(12, Math.min(block.fontSize, block.fontSize * (availableWidth / naturalWidth)));
        context.font = `900 ${fittedSize}px Arial`;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(text.toUpperCase(), blockWidth / 2, blockHeight / 2);
        context.restore();
        continue;
      }

      context.font = `italic 600 ${block.fontSize}px Georgia`;
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
        context.font = `500 ${Math.max(12, Math.round(block.fontSize * 0.58))}px Arial`;
        context.fillStyle = sanitizeHex(block.textColor, "#4B4550");
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
    altText: caption,
    cropX: 50,
    cropY: 50,
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
    return storedBoard.blocks.length > 0
      ? storedBoard
      : getDefaultMoodboardAnswer();
  }, [answers, config.maxImages]);
  const [board, setBoard] = useState<MoodboardAnswer>(incomingBoard);
  const [uploadState, setUploadState] = useState<UploadState>(initialUploadState);
  const [selectedBlockId, setSelectedBlockId] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const iconInputRef = useRef<HTMLInputElement | null>(null);
  const boardCanvasRef = useRef<HTMLDivElement | null>(null);
  const interactionRef = useRef<BoardInteraction | null>(null);
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
    const offset = board.blocks.length % 7;
    const defaultSize = block.type === "keyword" || block.type === "icon"
      ? { w: 24, h: 16 }
      : block.type === "color"
        ? { w: 24, h: 20 }
        : { w: 38, h: 28 };
    const nextBlock = {
      ...block,
      x: 5 + offset * 6,
      y: 5 + offset * 7,
      w: block.w > 0 ? block.w : defaultSize.w,
      h: block.h > 0 ? block.h : defaultSize.h,
      zIndex: board.blocks.length + 1,
    };
    const nextBlocks = [...board.blocks, nextBlock];

    updateBlocks(nextBlocks);
    setSelectedBlockId(block.id);
  }

  function removeBlock(blockId: string) {
    updateBlocks(board.blocks.filter((block) => block.id !== blockId));
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

  function beginInteraction(
    event: ReactPointerEvent<HTMLElement>,
    block: MoodboardBlock,
    mode: BoardInteraction["mode"],
  ) {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedBlockId(block.id);
    interactionRef.current = {
      blockId: block.id,
      mode,
      startClientX: event.clientX,
      startClientY: event.clientY,
      initialX: block.x,
      initialY: block.y,
      initialW: block.w,
      initialH: block.h,
    };
  }

  function getInteractedBoard(event: ReactPointerEvent<HTMLElement>) {
    const interaction = interactionRef.current;
    const canvas = boardCanvasRef.current;

    if (!interaction || !canvas) {
      return null;
    }

    const bounds = canvas.getBoundingClientRect();
    const deltaX = ((event.clientX - interaction.startClientX) / bounds.width) * 100;
    const deltaY = ((event.clientY - interaction.startClientY) / bounds.height) * 100;
    const blocks = board.blocks.map((block) => {
      if (block.id !== interaction.blockId) {
        return block;
      }

      if (interaction.mode === "resize") {
        return {
          ...block,
          w: clampPercent(interaction.initialW + deltaX, 12, 96 - block.x),
          h: clampPercent(interaction.initialH + deltaY, 10, 96 - block.y),
        };
      }

      return {
        ...block,
        x: clampPercent(interaction.initialX + deltaX, 0, 100 - block.w),
        y: clampPercent(interaction.initialY + deltaY, 0, 100 - block.h),
      };
    });

    return { ...board, blocks };
  }

  function moveInteraction(event: ReactPointerEvent<HTMLElement>) {
    const nextBoard = getInteractedBoard(event);
    if (nextBoard) setBoard(nextBoard);
  }

  function endInteraction(event: ReactPointerEvent<HTMLElement>) {
    const nextBoard = getInteractedBoard(event);
    interactionRef.current = null;
    if (nextBoard) commit(nextBoard);
  }

  async function handleFileUpload(files: FileList | null) {
    if (!files || files.length === 0 || slotsLeft <= 0) {
      return;
    }

    setUploadState({
      status: "loading",
      message: "Import du moodboard en cours...",
    });

    let fileList: File[];

    try {
      fileList = await Promise.all(
        Array.from(files).slice(0, slotsLeft).map(compressMoodboardImage),
      );
    } catch {
      setUploadState({
        status: "error",
        message: "Cette image n’a pas pu être ajoutée. Vérifie son format ou son poids.",
      });
      return;
    }
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
      const arrangedImages = nextImages.map((image, index) => ({
        ...image,
        x: 5 + ((board.blocks.length + index) % 3) * 31,
        y: 5 + (Math.floor((board.blocks.length + index) / 3) % 3) * 28,
        w: 28,
        h: 23,
        zIndex: board.blocks.length + index + 1,
      }));
      updateBlocks([...board.blocks, ...arrangedImages]);
      setUploadState(initialUploadState);
      return;
    }

    try {
      const fallbackUrls = await Promise.all(fileList.map((file) => fileToDataUrl(file)));
      const nextImages = fallbackUrls.map((url, index) =>
        createImageBlock(url, `Inspiration ${imageCount + index + 1}`),
      );
      const arrangedImages = nextImages.map((image, index) => ({
        ...image,
        x: 5 + ((board.blocks.length + index) % 3) * 31,
        y: 5 + (Math.floor((board.blocks.length + index) / 3) % 3) * 28,
        w: 28,
        h: 23,
        zIndex: board.blocks.length + index + 1,
      }));
      updateBlocks([...board.blocks, ...arrangedImages]);
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

  async function handleReplaceImage(files: FileList | null) {
    if (!files?.[0] || selectedBlock?.type !== "image") return;

    const previousImageId = selectedBlock.id;
    const currentWithoutSelected = Math.max(imageCount - 1, 0);
    setUploadState({ status: "loading", message: "Remplacement de l’image…" });

    try {
      const file = await compressMoodboardImage(files[0]);
      const formData = new FormData();
      formData.set("moduleId", String(module.id));
      formData.set("exerciseId", String(exercise.id));
      formData.set("currentCount", String(currentWithoutSelected));
      formData.append("images", file);
      const result = await uploadExerciseImages(formData);

      if (result.status !== "success" || !result.urls[0]) {
        throw new Error(result.status === "error" ? result.message : "Erreur d’envoi");
      }

      updateBlocks(board.blocks.map((block) =>
        block.id === previousImageId && block.type === "image"
          ? { ...block, imageUrl: result.urls[0] }
          : block,
      ));
      setUploadState(initialUploadState);
    } catch {
      setUploadState({
        status: "error",
        message: "Cette image n’a pas pu être ajoutée. Vérifie son format ou son poids.",
      });
    }
  }

  async function handleIconUpload(files: FileList | null) {
    const sourceFile = files?.[0];
    if (!sourceFile) return;

    if (sourceFile.type !== "image/png" || sourceFile.size > MAX_IMAGE_BYTES) {
      setUploadState({ status: "error", message: "Le pictogramme doit être un fichier PNG de moins de 8 Mo." });
      return;
    }

    setUploadState({ status: "loading", message: "Ajout du pictogramme…" });

    try {
      const file = await compressMoodboardImage(sourceFile);
      const formData = new FormData();
      formData.set("moduleId", String(module.id));
      formData.set("exerciseId", String(exercise.id));
      formData.set("currentCount", String(imageCount));
      formData.set("assetKind", "pictogram");
      formData.append("images", file);
      const result = await uploadExerciseImages(formData);

      if (result.status !== "success" || !result.urls[0]) {
        throw new Error(result.status === "error" ? result.message : "Erreur d’envoi");
      }

      addBlock({
        id: `mood-icon-${crypto.randomUUID()}`,
        type: "icon",
        icon: "spark",
        label: sourceFile.name.replace(/\.png$/i, ""),
        altText: sourceFile.name.replace(/\.png$/i, ""),
        imageUrl: result.urls[0],
        color: "#4B4550",
        x: 0,
        y: 0,
        w: 0,
        h: 0,
        rotation: 0,
        zIndex: 1,
      });
      setUploadState(initialUploadState);
    } catch {
      setUploadState({ status: "error", message: "Ce pictogramme n’a pas pu être ajouté. Vérifie son format ou son poids." });
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
      <section className="overflow-hidden rounded-[1.8rem] border border-[var(--border)] bg-[image:var(--tyash-surface-gradient)] shadow-[0_18px_44px_rgba(210,189,152,0.1)]">
        <div className="border-b border-[var(--border)] px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-[0.74rem] font-black uppercase tracking-[0.22em] text-[var(--tyash-label-text)]">
                Ton moodboard de marque
              </p>
              <h3 className="mt-3 font-[family:var(--font-cormorant)] text-[2.3rem] leading-[0.94] text-[var(--heading-color)]">
                Compose ton univers visuel
              </h3>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-primary)]">
                Rassemble ici les images, couleurs, mots et détails qui traduisent l’atmosphère de ta marque.
              </p>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--text-primary)]">
                Ce moodboard te servira de repère pour créer tes supports, choisir tes visuels et conserver une vraie cohérence dans ta communication.
              </p>
            </div>

            <div className="rounded-[1.2rem] border border-[var(--border)] bg-white/80 px-4 py-4 shadow-[inset_0_1px_0_rgb(var(--tyash-highlight-rgb)/0.82)]">
              <p className="text-[0.7rem] font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Ambiance
              </p>
              <p className="mt-3 max-w-56 text-sm leading-6 text-[var(--text-primary)]">
                {board.feedback || "Ton moodboard se construira ici, avec une lecture immédiate de son équilibre visuel."}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3" aria-label="Actions du moodboard">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={slotsLeft <= 0 || uploadState.status === "loading"}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--tyash-primary)] px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-[var(--tyash-text-on-primary)] shadow-[0_16px_30px_rgb(var(--tyash-glow-rgb)/0.22)] disabled:cursor-not-allowed disabled:opacity-55"
            >
              <ArrowUpTrayIcon className="h-4 w-4" />
              Ajouter des images
            </button>
            <button
              type="button"
              onClick={() => addBlock({ id: `mood-keyword-${crypto.randomUUID()}`, type: "keyword", keyword: "Mot-clé", textColor: "#4B4550", fontSize: 18, x: 0, y: 0, w: 0, h: 0, rotation: 0, zIndex: 1 })}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-[var(--text-primary)]"
            >
              <PlusIcon className="h-4 w-4" />
              Ajouter un mot-clé
            </button>
            <button
              type="button"
              onClick={() => addBlock({ id: `mood-text-${crypto.randomUUID()}`, type: "text", text: "Une citation qui donne le ton", author: "", textColor: "#4B4550", fontSize: 28, x: 0, y: 0, w: 0, h: 0, rotation: 0, zIndex: 1 })}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-[var(--text-primary)]"
            >
              <ChatBubbleLeftRightIcon className="h-4 w-4" />
              Ajouter une citation
            </button>
            <button
              type="button"
              onClick={() => addBlock({ id: `mood-color-${crypto.randomUUID()}`, type: "color", color: signals.palette[0] ?? "#E9DDCF", label: "Couleur", usage: "", x: 0, y: 0, w: 0, h: 0, rotation: 0, zIndex: 1 })}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-[var(--text-primary)]"
            >
              <SwatchIcon className="h-4 w-4" />
              Ajouter une couleur
            </button>
            <button
              type="button"
              onClick={() => iconInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-[var(--text-primary)]"
            >
              <StarIcon className="h-4 w-4" />
              Ajouter un pictogramme
            </button>
            <button
              type="button"
              onClick={() => updateBlocks(autoArrange(board.blocks, board.layoutStyle))}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-[var(--text-primary)]"
            >
              <ArrowPathIcon className="h-4 w-4" />
              Réorganiser
            </button>
            <div className="group relative">
              <button type="button" className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-[var(--text-primary)]">
                <ArrowDownTrayIcon className="h-4 w-4" />
                Exporter
              </button>
              <div className="invisible absolute right-0 top-full z-30 mt-2 min-w-40 rounded-xl border border-[var(--border)] bg-[var(--card)] p-2 opacity-0 shadow-xl transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                <button type="button" onClick={() => void exportAsPng()} className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--tyash-subtle)]">PNG</button>
                <button type="button" onClick={() => void exportAsPdf()} className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--tyash-subtle)]">PDF</button>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple={slotsLeft > 1}
              onChange={(event) => {
                void handleFileUpload(event.currentTarget.files);
                event.currentTarget.value = "";
              }}
              className="sr-only"
            />
            <input
              ref={replaceInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => {
                void handleReplaceImage(event.currentTarget.files);
                event.currentTarget.value = "";
              }}
              className="sr-only"
            />
            <input
              ref={iconInputRef}
              type="file"
              accept="image/png"
              onChange={(event) => {
                void handleIconUpload(event.currentTarget.files);
                event.currentTarget.value = "";
              }}
              className="sr-only"
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {(["editorial", "bold"] as MoodboardLayoutStyle[]).map(
              (style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => changeStyle(style)}
                  className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.15em] transition ${
                    board.layoutStyle === style
                      ? "bg-[var(--tyash-primary)] text-[var(--tyash-text-on-primary)]"
                      : "border border-[var(--border)] bg-[var(--card)] text-[var(--text-primary)]"
                  }`}
                >
                  {style}
                </button>
              ),
            )}
            <label className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-xs font-black uppercase tracking-[0.15em] text-[var(--text-primary)]">
              Fond
              <input
                type="color"
                value={sanitizeHex(board.backgroundColor, "#F5E8C8")}
                onChange={(event) => commit({ ...board, backgroundColor: event.target.value })}
                className="h-6 w-8 cursor-pointer border-0 bg-transparent p-0"
                aria-label="Couleur de fond du moodboard"
              />
            </label>
          </div>

          {uploadState.message ? (
            <p
              className={`mt-4 text-sm leading-6 ${
                uploadState.status === "error" ? "text-[#9d5f46]" : "text-[var(--text-muted)]"
              }`}
            >
              {uploadState.message}
            </p>
          ) : null}
        </div>

        <div className="grid gap-5 px-5 py-6 sm:px-6 xl:grid-cols-[minmax(0,1.6fr)_20rem]">
          <div className="space-y-4">
            <div
              className="relative overflow-hidden rounded-[1.8rem] border border-[var(--border)] p-4 shadow-[0_20px_44px_rgba(210,189,152,0.14)]"
              style={{ background: getBoardBackground(board.backgroundColor) }}
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.42),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.2),transparent_36%)]" />
              <div
                ref={boardCanvasRef}
                className="relative aspect-[4/5] w-full touch-none rounded-[1.4rem] border border-[var(--surface-highlight)]/60 bg-white/20 p-2 backdrop-blur-[1.5px]"
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "copy";
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  void handleFileUpload(event.dataTransfer.files);
                }}
              >
                {board.blocks.length === 0 ? (
                  <div className="flex h-full items-center justify-center rounded-[1.2rem] border border-dashed border-[var(--surface-highlight)]/70 bg-white/30 px-6 text-center text-sm leading-7 text-[var(--text-primary)]">
                    Glisse tes images ici ou utilise les actions ci-dessus pour commencer ta composition.
                  </div>
                ) : null}

                {board.blocks
                  .slice()
                  .sort((left, right) => left.zIndex - right.zIndex)
                  .map((block) => (
                    <div
                      key={block.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`Sélectionner ${block.type === "image" ? block.altText || block.caption || "l’image" : "ce bloc"}`}
                      onClick={() => setSelectedBlockId(block.id)}
                      onPointerDown={(event) => beginInteraction(event, block, "move")}
                      onPointerMove={moveInteraction}
                      onPointerUp={endInteraction}
                      onPointerCancel={endInteraction}
                      className={`group/block absolute cursor-move overflow-hidden rounded-[1.15rem] border text-left transition ${
                        selectedBlock?.id === block.id
                          ? "border-[var(--tyash-primary)] ring-2 ring-[var(--tyash-focus-ring)]/25"
                          : "border-[var(--surface-highlight)]/70"
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
                          <SafeMoodboardImage
                            src={block.imageUrl}
                            alt={block.altText || block.caption || "Inspiration visuelle"}
                            className="h-full w-full object-cover"
                            objectPosition={`${block.cropX}% ${block.cropY}%`}
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
                        <div className="flex h-full flex-col justify-between px-4 py-4" style={{ color: sanitizeHex(block.textColor, "#4B4550") }}>
                          <span className="font-[family:var(--font-cormorant)] italic leading-[1.05]" style={{ fontSize: `${block.fontSize}px` }}>
                            {block.text}
                          </span>
                          {block.author ? (
                            <span className="uppercase tracking-[0.16em] opacity-70" style={{ fontSize: `${Math.max(10, block.fontSize * 0.45)}px` }}>
                              {block.author}
                            </span>
                          ) : null}
                        </div>
                      ) : null}

                      {block.type === "keyword" ? (
                        <AutoFitKeyword
                          color={sanitizeHex(block.textColor, "#4B4550")}
                          fontSize={block.fontSize}
                        >
                          {block.keyword}
                        </AutoFitKeyword>
                      ) : null}

                      {block.type === "icon" ? (
                        block.imageUrl ? (
                          <SafeMoodboardImage src={block.imageUrl} alt={block.altText || block.label || "Pictogramme"} className="h-full w-full bg-transparent object-contain p-2" />
                        ) : (
                          <div className="flex h-full flex-col items-center justify-center gap-2 bg-white/90 px-3 py-3" style={{ color: sanitizeHex(block.color, "#4B4550") }}>
                            <MoodboardIconGraphic name={block.icon} />
                            {block.label ? <span className="text-center text-[0.65rem] font-bold uppercase tracking-[0.14em]">{block.label}</span> : null}
                          </div>
                        )
                      ) : null}

                      {selectedBlock?.id === block.id ? (
                        <span
                          role="button"
                          aria-label="Redimensionner ce bloc"
                          onPointerDown={(event) => beginInteraction(event, block, "resize")}
                          onPointerMove={moveInteraction}
                          onPointerUp={endInteraction}
                          onPointerCancel={endInteraction}
                          className="absolute bottom-1 right-1 z-20 flex h-8 w-8 cursor-se-resize items-center justify-center rounded-full bg-[var(--card)] text-[var(--tyash-label-text)] shadow-md"
                        >
                          <CursorArrowRaysIcon className="h-4 w-4 rotate-90" />
                        </span>
                      ) : null}
                    </div>
                  ))}
              </div>
            </div>

          </div>

          <aside className="space-y-4">
            <div className="rounded-[1.4rem] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_16px_34px_rgba(210,189,152,0.1)]">
              <p className="text-[0.72rem] font-black uppercase tracking-[0.16em] text-[var(--tyash-label-text)]">
                Retours
              </p>
              <p className="mt-3 text-sm leading-7 text-[var(--text-primary)]">
                {board.feedback || "Le feedback intelligent s'affichera ici une fois la composition amorcee."}
              </p>
              <p className="mt-3 text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
                {imageCount}/{config.maxImages} blocs image
              </p>
            </div>

            <div className="rounded-[1.4rem] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_16px_34px_rgba(210,189,152,0.1)]">
              <p className="text-[0.72rem] font-black uppercase tracking-[0.16em] text-[var(--tyash-label-text)]">
                Bloc sélectionné
              </p>

              {selectedBlock ? (
                <div className="mt-4 space-y-4">
                  {selectedBlock.type === "image" ? (
                    <>
                      <label className="block space-y-2">
                        <span className="text-xs font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">
                          Legende
                        </span>
                        <input
                          type="text"
                          value={selectedBlock.caption}
                          onChange={(event) => patchSelectedBlock({ caption: event.target.value })}
                          className="h-11 w-full rounded-[0.9rem] border border-[var(--border)] bg-[var(--surface)] px-4 text-sm text-[var(--text-primary)]"
                        />
                      </label>
                      <label className="block space-y-2">
                        <span className="text-xs font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">
                          Texte alternatif
                        </span>
                        <textarea
                          value={selectedBlock.altText}
                          onChange={(event) => patchSelectedBlock({ altText: event.target.value })}
                          placeholder="Décris brièvement l’image"
                          className="min-h-20 w-full rounded-[0.9rem] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-primary)]"
                        />
                      </label>
                      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Recadrage</p>
                        <label className="mt-3 block text-xs text-[var(--text-muted)]">
                          Horizontal
                          <input type="range" min="0" max="100" value={selectedBlock.cropX} onChange={(event) => patchSelectedBlock({ cropX: Number(event.target.value) })} className="mt-1 w-full accent-[var(--tyash-primary)]" />
                        </label>
                        <label className="mt-2 block text-xs text-[var(--text-muted)]">
                          Vertical
                          <input type="range" min="0" max="100" value={selectedBlock.cropY} onChange={(event) => patchSelectedBlock({ cropY: Number(event.target.value) })} className="mt-1 w-full accent-[var(--tyash-primary)]" />
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={() => replaceInputRef.current?.click()}
                        className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-[var(--text-primary)]"
                      >
                        <ArrowUpTrayIcon className="h-4 w-4" />
                        Remplacer l’image
                      </button>
                    </>
                  ) : null}

                  {selectedBlock.type === "color" ? (
                    <>
                      <label className="block space-y-2">
                        <span className="text-xs font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">
                          Nom
                        </span>
                        <input
                          type="text"
                          value={selectedBlock.label}
                          onChange={(event) => patchSelectedBlock({ label: event.target.value })}
                          className="h-11 w-full rounded-[0.9rem] border border-[var(--border)] bg-[var(--surface)] px-4 text-sm text-[var(--text-primary)]"
                        />
                      </label>
                      <label className="block space-y-2">
                        <span className="text-xs font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">
                          HEX
                        </span>
                        <input
                          type="text"
                          value={selectedBlock.color}
                          onChange={(event) =>
                            patchSelectedBlock({ color: sanitizeHex(event.target.value, selectedBlock.color) })
                          }
                          className="h-11 w-full rounded-[0.9rem] border border-[var(--border)] bg-[var(--surface)] px-4 text-sm uppercase text-[var(--text-primary)]"
                        />
                      </label>
                      <label className="block space-y-2">
                        <span className="text-xs font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">
                          Usage
                        </span>
                        <textarea
                          value={selectedBlock.usage}
                          onChange={(event) => patchSelectedBlock({ usage: event.target.value })}
                          className="min-h-24 w-full rounded-[0.9rem] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-primary)]"
                        />
                      </label>
                    </>
                  ) : null}

                  {selectedBlock.type === "text" ? (
                    <>
                      <label className="block space-y-2">
                        <span className="text-xs font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">
                          Citation
                        </span>
                        <textarea
                          value={selectedBlock.text}
                          onChange={(event) => patchSelectedBlock({ text: event.target.value })}
                          className="min-h-28 w-full rounded-[0.9rem] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-primary)]"
                        />
                      </label>
                      <label className="block space-y-2">
                        <span className="text-xs font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">
                          Signature
                        </span>
                        <input
                          type="text"
                          value={selectedBlock.author}
                          onChange={(event) => patchSelectedBlock({ author: event.target.value })}
                          className="h-11 w-full rounded-[0.9rem] border border-[var(--border)] bg-[var(--surface)] px-4 text-sm text-[var(--text-primary)]"
                        />
                      </label>
                    </>
                  ) : null}

                  {selectedBlock.type === "keyword" ? (
                    <label className="block space-y-2">
                      <span className="text-xs font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">
                        Mot-cle
                      </span>
                      <input
                        type="text"
                        value={selectedBlock.keyword}
                        onChange={(event) => patchSelectedBlock({ keyword: event.target.value })}
                        className="h-11 w-full rounded-[0.9rem] border border-[var(--border)] bg-[var(--surface)] px-4 text-sm text-[var(--text-primary)]"
                      />
                    </label>
                  ) : null}

                  {selectedBlock.type === "text" || selectedBlock.type === "keyword" ? (
                    <div className="grid grid-cols-[1fr_5rem] gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
                      <label className="block space-y-2">
                        <span className="flex items-center justify-between text-xs font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">
                          Taille maximale <span>{selectedBlock.fontSize}px</span>
                        </span>
                        <input
                          type="range"
                          min="12"
                          max="72"
                          step="1"
                          value={selectedBlock.fontSize}
                          onChange={(event) => patchSelectedBlock({ fontSize: Number(event.target.value) })}
                          className="w-full accent-[var(--tyash-primary)]"
                        />
                      </label>
                      <label className="block space-y-2">
                        <span className="text-xs font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Couleur</span>
                        <input
                          type="color"
                          value={sanitizeHex(selectedBlock.textColor, "#4B4550")}
                          onChange={(event) => patchSelectedBlock({ textColor: event.target.value })}
                          className="h-9 w-full cursor-pointer rounded-lg border border-[var(--border)] bg-[var(--card)] p-1"
                        />
                      </label>
                      <p className="col-span-2 text-[0.68rem] leading-4 text-[var(--text-muted)]">
                        Si le mot est trop long, sa taille s’adapte automatiquement pour rester entièrement visible.
                      </p>
                    </div>
                  ) : null}

                  {selectedBlock.type === "icon" ? (
                    <>
                      {!selectedBlock.imageUrl ? (
                        <label className="block space-y-2">
                          <span className="text-xs font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Pictogramme</span>
                          <select value={selectedBlock.icon} onChange={(event) => patchSelectedBlock({ icon: event.target.value as typeof selectedBlock.icon })} className="h-11 w-full rounded-[0.9rem] border border-[var(--border)] bg-[var(--surface)] px-4 text-sm text-[var(--text-primary)]">
                            <option value="spark">Étincelle</option><option value="star">Étoile</option><option value="leaf">Feuille</option><option value="circle">Cercle</option><option value="wave">Vague</option>
                          </select>
                        </label>
                      ) : null}
                      <label className="block space-y-2">
                        <span className="text-xs font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Légende</span>
                        <input type="text" value={selectedBlock.label} onChange={(event) => patchSelectedBlock({ label: event.target.value })} className="h-11 w-full rounded-[0.9rem] border border-[var(--border)] bg-[var(--surface)] px-4 text-sm text-[var(--text-primary)]" />
                      </label>
                      {selectedBlock.imageUrl ? (
                        <label className="block space-y-2">
                          <span className="text-xs font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Texte alternatif</span>
                          <textarea value={selectedBlock.altText ?? ""} onChange={(event) => patchSelectedBlock({ altText: event.target.value })} className="min-h-20 w-full rounded-[0.9rem] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--text-primary)]" />
                        </label>
                      ) : <label className="block space-y-2">
                        <span className="text-xs font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">Couleur</span>
                        <input type="color" value={sanitizeHex(selectedBlock.color, "#4B4550")} onChange={(event) => patchSelectedBlock({ color: event.target.value })} className="h-11 w-full rounded-[0.9rem] border border-[var(--border)] bg-[var(--surface)] px-2" />
                      </label>}
                    </>
                  ) : null}

                  <label className="block space-y-2">
                    <span className="flex items-center justify-between text-xs font-black uppercase tracking-[0.16em] text-[var(--text-muted)]">
                      Rotation <span>{selectedBlock.rotation}°</span>
                    </span>
                    <input
                      type="range"
                      min="-7"
                      max="7"
                      step="1"
                      value={selectedBlock.rotation}
                      onChange={(event) => patchSelectedBlock({ rotation: Number(event.target.value) })}
                      className="w-full accent-[var(--tyash-primary)]"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => removeBlock(selectedBlock.id)}
                    className="inline-flex items-center gap-2 rounded-full border border-[#f1d6c8] bg-[var(--tyash-subtle)] px-4 py-2.5 text-xs font-black uppercase tracking-[0.14em] text-[#9d5f46]"
                  >
                    <TrashIcon className="h-4 w-4" />
                    Retirer ce bloc
                  </button>
                </div>
              ) : (
                <p className="mt-4 text-sm leading-7 text-[var(--text-muted)]">
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
