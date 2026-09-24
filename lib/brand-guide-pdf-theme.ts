import type { TextStyle } from "@react-pdf/stylesheet";

export type BrandGuidePdfTheme = {
  page: { width: number; height: number; marginTop: number; marginRight: number; marginBottom: number; marginLeft: number };
  grid: { columns: number; gutter: number };
  colors: { background: string; paper: string; text: string; mutedText: string; border: string; accent: string };
  typography: Record<"display" | "h1" | "h2" | "h3" | "body" | "small" | "label" | "quote", TextStyle>;
  spacing: Record<"xs" | "sm" | "md" | "lg" | "xl", number>;
};

export const brandGuidePdfTheme: BrandGuidePdfTheme = {
  page: { width: 595.28, height: 841.89, marginTop: 58, marginRight: 52, marginBottom: 52, marginLeft: 52 },
  grid: { columns: 12, gutter: 12 },
  colors: { background: "#F7F1E8", paper: "#FFFDFC", text: "#282329", mutedText: "#756B64", border: "#D9CFC3", accent: "#7A2D46" },
  typography: {
    display: { fontFamily: "Source Serif 4", fontSize: 48, lineHeight: 1.02 },
    h1: { fontFamily: "Source Serif 4", fontSize: 31, lineHeight: 1.08 },
    h2: { fontFamily: "Source Serif 4", fontSize: 19, lineHeight: 1.18 },
    h3: { fontFamily: "Inter", fontSize: 12, fontWeight: 600, lineHeight: 1.3 },
    body: { fontFamily: "Inter", fontSize: 10.5, lineHeight: 1.55 },
    small: { fontFamily: "Inter", fontSize: 8.5, lineHeight: 1.4 },
    label: { fontFamily: "Inter", fontSize: 8, fontWeight: 600, letterSpacing: 1.3 },
    quote: { fontFamily: "Source Serif 4", fontSize: 23, lineHeight: 1.28 },
  },
  spacing: { xs: 6, sm: 12, md: 20, lg: 32, xl: 52 },
};
