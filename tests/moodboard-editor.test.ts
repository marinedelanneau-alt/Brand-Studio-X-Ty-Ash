import { describe, expect, it } from "vitest";
import {
  autoArrange,
  getDefaultMoodboardAnswer,
  parseStoredMoodboardAnswer,
  serializeMoodboardAnswer,
  type MoodboardAnswer,
} from "../lib/moodboard";

describe("personal moodboard data", () => {
  it("starts empty instead of generating decorative blocks", () => {
    expect(getDefaultMoodboardAnswer().blocks).toEqual([]);
  });

  it("migrates legacy images with accessible crop defaults", () => {
    const legacy = `__moodboard__:${JSON.stringify({
      type: "moodboard",
      version: 1,
      layoutStyle: "editorial",
      ambiance: "",
      feedback: "",
      blocks: [
        {
          id: "legacy-image",
          type: "image",
          imageUrl: "https://example.com/image.jpg",
          caption: "Texture naturelle",
          x: 5,
          y: 5,
          w: 40,
          h: 30,
          rotation: 0,
          zIndex: 1,
        },
      ],
    })}`;

    const image = parseStoredMoodboardAnswer([legacy]).blocks[0];
    expect(image?.type).toBe("image");
    if (image?.type === "image") {
      expect(image.altText).toBe("Texture naturelle");
      expect(image.cropX).toBe(50);
      expect(image.cropY).toBe(50);
    }
  });

  it("removes the old automatic composition but preserves uploaded images", () => {
    const automaticSvg = "data:image/svg+xml;charset=UTF-8,%3Ctext%3EMOODBOARD%3C%2Ftext%3E";
    const legacy = `__moodboard__:${JSON.stringify({
      type: "moodboard",
      version: 2,
      layoutStyle: "editorial",
      ambiance: "Univers automatique",
      feedback: "",
      blocks: [
        { id: "generated", type: "image", imageUrl: automaticSvg, caption: "lumière", x: 2, y: 2, w: 30, h: 20, rotation: 0, zIndex: 1 },
        { id: "generated-word", type: "keyword", keyword: "créative", x: 35, y: 2, w: 20, h: 12, rotation: 0, zIndex: 2 },
        { id: "uploaded", type: "image", imageUrl: "https://example.com/my-photo.webp", caption: "Ma photo", x: 2, y: 30, w: 40, h: 25, rotation: 0, zIndex: 3 },
      ],
    })}`;

    const restored = parseStoredMoodboardAnswer([legacy]);
    expect(restored.blocks).toHaveLength(1);
    expect(restored.blocks[0]).toMatchObject({
      id: "uploaded",
      type: "image",
      imageUrl: "https://example.com/my-photo.webp",
    });
  });

  it("persists icons and manual coordinates", () => {
    const board: MoodboardAnswer = {
      ...getDefaultMoodboardAnswer("collage"),
      blocks: [
        {
          id: "icon-1",
          type: "icon",
          icon: "leaf",
          label: "Nature",
          color: "#557A5B",
          x: 17,
          y: 23,
          w: 24,
          h: 16,
          rotation: -2,
          zIndex: 1,
        },
      ],
    };

    const restored = parseStoredMoodboardAnswer([serializeMoodboardAnswer(board)]);
    expect(restored.version).toBe(2);
    expect(restored.blocks[0]).toMatchObject({
      type: "icon",
      icon: "leaf",
      x: 17,
      y: 23,
      w: 24,
      h: 16,
    });
  });

  it("reorganizes only when explicitly requested", () => {
    const board = parseStoredMoodboardAnswer([
      serializeMoodboardAnswer({
        ...getDefaultMoodboardAnswer(),
        blocks: [
          {
            id: "keyword-1",
            type: "keyword",
            keyword: "Sensible",
            x: 51,
            y: 47,
            w: 22,
            h: 14,
            rotation: 0,
            zIndex: 1,
          },
        ],
      }),
    ]);

    expect(board.blocks[0]).toMatchObject({ x: 51, y: 47 });
    expect(autoArrange(board.blocks, "grid")[0]).not.toMatchObject({ x: 51, y: 47 });
  });
});
