import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type {
  ModuleSummaryCard,
  ModuleSummaryColor,
  ModuleSubmoduleSummary,
  ModuleSummaryHighlight,
} from "@/lib/module-summary";
import type { ModuleShareData } from "@/lib/get-module-share-data";
import { toPlainText } from "@/lib/plain-text";

Font.registerHyphenationCallback((word) => [word]);

const palette = {
  canvas: "#F7F1E8",
  paper: "#FFFDF9",
  ink: "#29242B",
  body: "#5E554E",
  quiet: "#85796E",
  line: "#E7DCCB",
  accent: "#7A2D46",
  accentPale: "#F5E4EB",
  white: "#FFFFFF",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: palette.canvas,
    color: palette.ink,
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingBottom: 62,
    paddingHorizontal: 44,
    paddingTop: 42,
  },
  runningHeader: {
    alignItems: "center",
    borderBottom: `0.7 solid ${palette.line}`,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 26,
    paddingBottom: 10,
  },
  wordmark: {
    color: palette.ink,
    fontSize: 8.5,
    fontWeight: 700,
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  runningTitle: {
    color: palette.quiet,
    fontSize: 8,
  },
  hero: {
    backgroundColor: palette.ink,
    borderRadius: 18,
    minHeight: 238,
    padding: 30,
  },
  eyebrow: {
    color: "#EDC4D1",
    fontSize: 8.5,
    fontWeight: 700,
    letterSpacing: 2.1,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: palette.white,
    fontSize: 31,
    fontWeight: 700,
    lineHeight: 1.12,
    marginTop: 22,
    maxWidth: 420,
  },
  brandName: {
    color: "#F5E4EB",
    fontSize: 12,
    marginTop: 9,
  },
  heroRule: {
    backgroundColor: palette.accent,
    height: 3,
    marginTop: 25,
    width: 38,
  },
  heroStatement: {
    color: "#F8F3ED",
    fontSize: 12,
    lineHeight: 1.55,
    marginTop: 14,
    maxWidth: 430,
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  metaItem: {
    backgroundColor: palette.paper,
    border: `0.7 solid ${palette.line}`,
    borderRadius: 10,
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  metaLabel: {
    color: palette.quiet,
    fontSize: 6.8,
    fontWeight: 700,
    letterSpacing: 1.1,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  metaValue: {
    color: palette.ink,
    fontSize: 9.2,
    fontWeight: 700,
    lineHeight: 1.35,
  },
  section: {
    marginTop: 30,
  },
  sectionHeading: {
    borderBottom: `0.7 solid ${palette.line}`,
    marginBottom: 13,
    paddingBottom: 9,
  },
  sectionIndex: {
    color: palette.accent,
    fontSize: 7.5,
    fontWeight: 700,
    letterSpacing: 1.5,
    marginBottom: 5,
    textTransform: "uppercase",
  },
  sectionTitle: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: 700,
  },
  sectionIntro: {
    color: palette.body,
    fontSize: 9.5,
    lineHeight: 1.5,
    marginTop: 5,
  },
  takeaway: {
    backgroundColor: palette.paper,
    border: `0.7 solid ${palette.line}`,
    borderRadius: 9,
    marginBottom: 9,
    paddingBottom: 12,
    paddingHorizontal: 14,
    paddingTop: 11,
  },
  takeawayTop: {
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 6,
  },
  takeawayMarker: {
    backgroundColor: palette.accent,
    borderRadius: 2,
    height: 4,
    marginRight: 8,
    width: 14,
  },
  takeawayLabel: {
    color: palette.ink,
    flexShrink: 1,
    fontSize: 10,
    fontWeight: 700,
    lineHeight: 1.35,
  },
  answer: {
    color: palette.body,
    fontSize: 10.5,
    lineHeight: 1.55,
    orphans: 2,
    widows: 2,
  },
  context: {
    color: palette.quiet,
    fontSize: 8.2,
    fontStyle: "italic",
    lineHeight: 1.4,
    marginTop: 7,
  },
  paletteRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 2,
  },
  colorItem: {
    alignItems: "center",
    backgroundColor: palette.white,
    border: `0.7 solid ${palette.line}`,
    borderRadius: 8,
    flexDirection: "row",
    maxWidth: 150,
    paddingHorizontal: 7,
    paddingVertical: 5,
  },
  swatch: {
    border: `0.7 solid ${palette.line}`,
    borderRadius: 4,
    flexDirection: "row",
    height: 18,
    marginRight: 6,
    overflow: "hidden",
    width: 18,
  },
  halfSwatch: { height: 18, width: 9 },
  colorText: { flexShrink: 1 },
  colorName: { color: palette.ink, fontSize: 7.8, fontWeight: 700 },
  colorValue: { color: palette.quiet, fontSize: 6.7, marginTop: 1 },
  chapter: {
    marginBottom: 18,
  },
  chapterHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    marginBottom: 4,
  },
  chapterNumber: {
    color: palette.accent,
    fontSize: 9,
    fontWeight: 700,
    marginRight: 9,
    paddingTop: 2,
    width: 18,
  },
  chapterTitle: {
    color: palette.ink,
    flexShrink: 1,
    fontSize: 13,
    fontWeight: 700,
    lineHeight: 1.35,
  },
  detail: {
    borderLeft: `1.2 solid ${palette.line}`,
    marginLeft: 8,
    paddingBottom: 8,
    paddingLeft: 19,
    paddingTop: 7,
  },
  detailLabel: {
    color: palette.accent,
    fontSize: 7.5,
    fontWeight: 700,
    letterSpacing: 0.5,
    lineHeight: 1.35,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  detailValue: {
    color: palette.body,
    fontSize: 9.7,
    lineHeight: 1.55,
    orphans: 2,
    widows: 2,
  },
  closing: {
    backgroundColor: palette.accentPale,
    borderRadius: 12,
    marginTop: 22,
    padding: 19,
  },
  closingTitle: {
    color: palette.accent,
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: 1.3,
    marginBottom: 7,
    textTransform: "uppercase",
  },
  closingText: {
    color: palette.ink,
    fontSize: 11,
    lineHeight: 1.55,
  },
  footer: {
    bottom: 20,
    color: palette.quiet,
    fontSize: 7.4,
    left: 44,
    position: "absolute",
    right: 44,
  },
  footerLine: {
    backgroundColor: palette.line,
    height: 0.7,
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date non disponible";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function sanitizePdfText(value: string) {
  return toPlainText(value)
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\uFE0F\u200D]/gu, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2060\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeValue(value: string) {
  return sanitizePdfText(value).toLocaleLowerCase("fr-FR");
}

function removeRepeatedHighlights(
  recaps: ModuleSubmoduleSummary[],
  summary: ModuleSummaryCard,
) {
  const featuredValues = new Set(
    summary.keyTakeaways.map((item) => normalizeValue(item.value)).filter(Boolean),
  );

  return recaps
    .map((recap) => ({
      ...recap,
      highlights: recap.highlights.filter(
        (highlight) => !featuredValues.has(normalizeValue(highlight.value)),
      ),
    }))
    .filter((recap) => recap.highlights.length > 0);
}

function PdfPalette({ colors }: { colors: ModuleSummaryColor[] }) {
  return (
    <View style={styles.paletteRow}>
      {colors.map((color, index) => {
        const gradient = color.value.split("→").map((part) => part.trim());

        return (
          <View key={`${color.name}-${color.value}-${index}`} style={styles.colorItem} wrap={false}>
            <View style={styles.swatch}>
              {gradient.length === 2 ? (
                <>
                  <View style={[styles.halfSwatch, { backgroundColor: gradient[0] }]} />
                  <View style={[styles.halfSwatch, { backgroundColor: gradient[1] }]} />
                </>
              ) : (
                <View style={{ backgroundColor: color.value, height: 18, width: 18 }} />
              )}
            </View>
            <View style={styles.colorText}>
              <Text style={styles.colorName}>{sanitizePdfText(color.name)}</Text>
              <Text style={styles.colorValue}>{sanitizePdfText(color.value)}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function PdfAnswerTable({ table }: { table: NonNullable<ModuleSummaryHighlight["table"]> }) {
  const width = `${100 / table.columns.length}%`;
  return (
    <View style={{ marginTop: 8, borderTop: "1 solid #E7DCCB", borderLeft: "1 solid #E7DCCB" }}>
      <View style={{ flexDirection: "row", backgroundColor: "#F5E4EB" }} wrap={false} minPresenceAhead={45}>
        {table.columns.map((column, index) => (
          <View key={index} style={{ width, padding: 7, borderRight: "1 solid #E7DCCB", borderBottom: "1 solid #E7DCCB" }}>
            <Text style={{ fontSize: 8, fontWeight: 700, color: "#29242B" }}>{sanitizePdfText(column)}</Text>
          </View>
        ))}
      </View>
      {table.rows.map((row, rowIndex) => (
        <View key={rowIndex} style={{ flexDirection: "row", backgroundColor: rowIndex % 2 ? "#F7F1E8" : "#FFFDF9" }} wrap={false}>
          {row.map((cell, columnIndex) => (
            <View key={columnIndex} style={{ width, padding: 7, borderRight: "1 solid #E7DCCB", borderBottom: "1 solid #E7DCCB" }}>
              <Text style={{ fontSize: 8.5, lineHeight: 1.4, color: "#5E554E" }}>{sanitizePdfText(cell) || "—"}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function SectionHeading({
  index,
  title,
  intro,
}: {
  index: string;
  title: string;
  intro: string;
}) {
  return (
    <View style={styles.sectionHeading} minPresenceAhead={90}>
      <Text style={styles.sectionIndex}>{index}</Text>
      <Text style={styles.sectionTitle}>{sanitizePdfText(title)}</Text>
      <Text style={styles.sectionIntro}>{sanitizePdfText(intro)}</Text>
    </View>
  );
}

export function ModulePdfSummary({
  summary,
  shareData,
}: {
  summary: ModuleSummaryCard;
  shareData: ModuleShareData;
}) {
  const detailedRecaps = removeRepeatedHighlights(summary.submoduleRecaps, summary);

  return (
    <Document
      title={`Résumé ${sanitizePdfText(shareData.moduleTitle)} — ${sanitizePdfText(shareData.brandName)}`}
      author="Brand Studio"
      subject="Synthèse personnelle de fin de module"
      language="fr-FR"
    >
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.runningHeader} fixed>
          <Text style={styles.wordmark}>Brand Studio</Text>
          <Text style={styles.runningTitle}>Synthèse de fin de module</Text>
        </View>

        <View style={styles.hero} wrap={false}>
          <Text style={styles.eyebrow}>Carnet de marque · Module terminé</Text>
          <Text style={styles.heroTitle}>{sanitizePdfText(shareData.moduleTitle)}</Text>
          <Text style={styles.brandName}>{sanitizePdfText(shareData.brandName)}</Text>
          <View style={styles.heroRule} />
          <Text style={styles.heroStatement}>{sanitizePdfText(summary.hero || shareData.shareSentence)}</Text>
        </View>

        <View style={styles.metaRow} wrap={false}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Finalisé le</Text>
            <Text style={styles.metaValue}>{formatDate(shareData.completedAt)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Progression</Text>
            <Text style={styles.metaValue}>{shareData.progress} %</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Repères</Text>
            <Text style={styles.metaValue}>{sanitizePdfText(shareData.keywords.join(" · "))}</Text>
          </View>
        </View>

        {summary.keyTakeaways.length > 0 ? (
          <View style={styles.section}>
            <SectionHeading
              index="01 · L'essentiel"
              title="Les décisions à retenir"
              intro="Une lecture rapide des éléments qui structurent désormais ta marque."
            />
            {summary.keyTakeaways.map((item) => (
              <View key={item.id} style={styles.takeaway} wrap={false}>
                <View style={styles.takeawayTop} minPresenceAhead={28}>
                  <View style={styles.takeawayMarker} />
                  <Text style={styles.takeawayLabel}>{sanitizePdfText(item.label)}</Text>
                </View>
                {item.colors?.length ? (
                  <PdfPalette colors={item.colors} />
                ) : (
                  <Text style={styles.answer}>{sanitizePdfText(item.value)}</Text>
                )}
                {sanitizePdfText(item.context) ? (
                  <Text style={styles.context}>{sanitizePdfText(item.context)}</Text>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        {detailedRecaps.length > 0 ? (
          <View style={styles.section}>
            <SectionHeading
              index="02 · Le carnet"
              title="Tes réponses, par étape"
              intro="Le détail utile de ton cheminement, sans répéter les décisions déjà mises en avant."
            />
            {detailedRecaps.map((submodule) => (
              <View key={submodule.id} style={styles.chapter}>
                <View style={styles.chapterHeader} minPresenceAhead={55}>
                  <Text style={styles.chapterNumber}>{String(submodule.position).padStart(2, "0")}</Text>
                  <Text style={styles.chapterTitle}>{sanitizePdfText(submodule.title)}</Text>
                </View>
                {submodule.highlights.map((item, index) => (
                  <View key={`${item.label}-${index}`} style={styles.detail} wrap={Boolean(item.table)}>
                    <Text style={styles.detailLabel} minPresenceAhead={24}>{sanitizePdfText(item.label)}</Text>
                    {item.table ? <PdfAnswerTable table={item.table} /> : item.colors?.length ? (
                      <PdfPalette colors={item.colors} />
                    ) : (
                      <Text style={styles.detailValue}>{sanitizePdfText(item.value)}</Text>
                    )}
                  </View>
                ))}
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.closing} minPresenceAhead={90}>
          <Text style={styles.closingTitle}>Et maintenant ?</Text>
          <Text style={styles.closingText}>
            {sanitizePdfText(`${shareData.shareSentence} Garde cette synthèse comme point de repère : elle t'aidera à rester cohérente dans tes prochaines décisions de marque.`)}
          </Text>
        </View>

        <View style={styles.footer} fixed>
          <View style={styles.footerLine} />
          <View style={styles.footerRow}>
            <Text>Document personnel · {sanitizePdfText(shareData.brandName)}</Text>
            <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
          </View>
        </View>
      </Page>
    </Document>
  );
}
