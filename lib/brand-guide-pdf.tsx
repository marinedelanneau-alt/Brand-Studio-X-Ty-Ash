import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { GeneratedBrandGuide, GuideColor } from "@/lib/brand-guide";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FBF6ED",
    color: "#4B4550",
    fontFamily: "Helvetica",
    padding: 42,
  },
  cover: {
    justifyContent: "space-between",
  },
  eyebrow: {
    color: "#CF7430",
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  title: {
    color: "#332D35",
    fontSize: 42,
    lineHeight: 1,
    marginTop: 28,
  },
  subtitle: {
    color: "#6F645B",
    fontSize: 16,
    lineHeight: 1.5,
    marginTop: 20,
  },
  date: {
    color: "#7A7087",
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 1.5,
    marginTop: 18,
    textTransform: "uppercase",
  },
  section: {
    border: "1 solid #EADFCA",
    backgroundColor: "#FFFDF9",
    borderRadius: 10,
    marginBottom: 16,
    padding: 20,
  },
  sectionTitle: {
    color: "#3F3945",
    fontSize: 24,
    marginTop: 8,
    marginBottom: 14,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  card: {
    backgroundColor: "#FFFFFF",
    border: "1 solid #EADFCA",
    borderRadius: 7,
    marginBottom: 10,
    padding: 12,
    width: "48%",
  },
  cardWide: {
    backgroundColor: "#FFFFFF",
    border: "1 solid #EADFCA",
    borderRadius: 7,
    marginBottom: 10,
    padding: 12,
    width: "100%",
  },
  label: {
    color: "#7A7087",
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: 1.2,
    marginBottom: 7,
    textTransform: "uppercase",
  },
  text: {
    color: "#5F544A",
    fontSize: 10.5,
    lineHeight: 1.55,
  },
  introText: {
    color: "#625850",
    fontSize: 12,
    lineHeight: 1.65,
  },
  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },
  colorCard: {
    backgroundColor: "#FFFFFF",
    border: "1 solid #EADFCA",
    borderRadius: 7,
    marginBottom: 10,
    overflow: "hidden",
    width: "31%",
  },
  swatch: {
    height: 50,
  },
  swatchBody: {
    padding: 10,
  },
  checklistItem: {
    color: "#5F544A",
    fontSize: 10,
    lineHeight: 1.45,
    marginBottom: 5,
  },
  summaryPage: {
    backgroundColor: "#FFFFFF",
  },
  moodboardFrame: {
    backgroundColor: "#F5EEE4",
    border: "1 solid #EADFCA",
    borderRadius: 9,
    height: 225,
    marginTop: 12,
    overflow: "hidden",
    padding: 8,
    position: "relative",
  },
  moodboardItem: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    border: "1 solid rgba(255,255,255,0.8)",
    borderRadius: 6,
    justifyContent: "center",
    overflow: "hidden",
    position: "absolute",
  },
  moodboardImage: {
    height: "100%",
    objectFit: "cover",
    width: "100%",
  },
  moodboardText: {
    color: "#4B4550",
    fontSize: 8,
    fontWeight: 700,
    padding: 8,
    textAlign: "center",
  },
});

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function solidColor(color: GuideColor) {
  if (color.hex.startsWith("#")) {
    return color.hex;
  }

  return "#EAD9C8";
}

function getPdfTheme(guide: GeneratedBrandGuide) {
  const colors = [
    ...guide.visualUniverse.palette.primary,
    ...guide.visualUniverse.palette.secondary,
  ];
  const solidHex = colors.map((color) => color.hex).find((hex) => hex.startsWith("#"));

  if (!solidHex) {
    return {
      background: "#FFFFFF",
      surface: "#FFFFFF",
      card: "#FFFFFF",
      border: "#E7E2DA",
      accent: "#4B4550",
      text: "#2F2A33",
    };
  }

  const accent = normalizeHex(solidHex) ?? "#4B4550";

  return {
    background: mixHex(accent, "#FFFFFF", 0.91),
    surface: mixHex(accent, "#FFFFFF", 0.97),
    card: "#FFFFFF",
    border: mixHex(accent, "#FFFFFF", 0.72),
    accent,
    text: "#2F2A33",
  };
}

function normalizeHex(value: string) {
  const match = value.trim().match(/^#?([0-9a-fA-F]{6})$/);
  return match ? `#${match[1].toUpperCase()}` : null;
}

function hexToRgb(value: string) {
  const normalized = normalizeHex(value);
  if (!normalized) return null;
  return {
    red: Number.parseInt(normalized.slice(1, 3), 16),
    green: Number.parseInt(normalized.slice(3, 5), 16),
    blue: Number.parseInt(normalized.slice(5, 7), 16),
  };
}

function rgbToHex(red: number, green: number, blue: number) {
  return `#${[red, green, blue]
    .map((channel) => Math.round(channel).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

function mixHex(base: string, target: string, targetRatio: number) {
  const baseRgb = hexToRgb(base);
  const targetRgb = hexToRgb(target);
  if (!baseRgb || !targetRgb) return target;

  return rgbToHex(
    baseRgb.red * (1 - targetRatio) + targetRgb.red * targetRatio,
    baseRgb.green * (1 - targetRatio) + targetRgb.green * targetRatio,
    baseRgb.blue * (1 - targetRatio) + targetRgb.blue * targetRatio,
  );
}

function Card({
  label,
  value,
  theme,
  wide = false,
}: {
  label: string;
  value: string;
  theme: ReturnType<typeof getPdfTheme>;
  wide?: boolean;
}) {
  return (
    <View
      style={[
        wide ? styles.cardWide : styles.card,
        { backgroundColor: theme.card, borderColor: theme.border },
      ]}
    >
      <Text style={[styles.label, { color: theme.accent }]}>{label}</Text>
      <Text style={[styles.text, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

function Section({
  eyebrow,
  title,
  theme,
  children,
}: {
  eyebrow: string;
  title: string;
  theme: ReturnType<typeof getPdfTheme>;
  children: React.ReactNode;
}) {
  return (
    <View
      style={[
        styles.section,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
      wrap={false}
    >
      <Text style={[styles.eyebrow, { color: theme.accent }]}>{eyebrow}</Text>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      {children}
    </View>
  );
}

function Checklist({
  title,
  items,
  theme,
}: {
  title: string;
  items: string[];
  theme: ReturnType<typeof getPdfTheme>;
}) {
  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.label, { color: theme.accent }]}>{title}</Text>
      {items.map((item) => (
        <Text key={item} style={[styles.checklistItem, { color: theme.text }]}>
          - {item}
        </Text>
      ))}
    </View>
  );
}

function Palette({
  colors,
  theme,
}: {
  colors: GuideColor[];
  theme: ReturnType<typeof getPdfTheme>;
}) {
  if (colors.length === 0) {
    return (
      <Card
        wide
        theme={theme}
        label="Palette"
        value="Aperçu neutre. Palette ou intention visuelle à compléter dans le module Palette de couleurs."
      />
    );
  }

  return (
    <View style={styles.colorRow}>
      {colors.map((color) => (
        <View key={color.id} style={[styles.colorCard, { borderColor: theme.border }]}>
          <View style={[styles.swatch, { backgroundColor: solidColor(color) }]} />
          <View style={styles.swatchBody}>
            <Text style={styles.label}>{color.name}</Text>
            <Text style={styles.text}>{color.hex}</Text>
            <Text style={styles.text}>{color.usage}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function MoodboardComposition({ guide }: { guide: GeneratedBrandGuide }) {
  const items = guide.visualUniverse.moodboard;

  if (items.length === 0) {
    return <Card wide theme={getPdfTheme(guide)} label="Moodboard" value="Moodboard à compléter." />;
  }

  return (
    <View style={styles.moodboardFrame}>
      {items.slice().sort((left, right) => left.zIndex - right.zIndex).map((item) => (
        <View
          key={item.id}
          style={[
            styles.moodboardItem,
            {
              left: `${item.x}%`,
              top: `${item.y}%`,
              width: `${item.width}%`,
              height: `${item.height}%`,
              backgroundColor: item.type === "color" ? item.color : "#FFFFFF",
              transform: `rotate(${item.rotation}deg)`,
            },
          ]}
        >
          {(item.type === "image" || item.type === "icon") && item.imageUrl ? (
            // eslint-disable-next-line jsx-a11y/alt-text -- React PDF Image has no alt prop.
            <Image src={item.imageUrl} style={styles.moodboardImage} />
          ) : (
            <Text style={[styles.moodboardText, item.type === "color" ? { color: "#FFFFFF" } : {}]}>
              {item.type === "icon" ? `${item.description === "circle" ? "○" : item.description === "wave" ? "∿" : "✦"} ` : ""}
              {item.label}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}

function BrandGuidePdfDocument({ guide }: { guide: GeneratedBrandGuide }) {
  const colors = [
    ...guide.visualUniverse.palette.primary,
    ...guide.visualUniverse.palette.secondary,
  ];
  const theme = getPdfTheme(guide);

  return (
    <Document
      title={`Guide de Marque - ${guide.brandName}`}
      author="Brand Studio"
      subject="Guide de marque genere automatiquement"
    >
      <Page
        size="A4"
        orientation="landscape"
        style={[styles.page, styles.cover, { backgroundColor: theme.background, color: theme.text }]}
      >
        <View>
          <Text style={[styles.eyebrow, { color: theme.accent }]}>Brand Studio</Text>
          <Text style={[styles.title, { color: theme.text }]}>{guide.cover.title}</Text>
          <Text style={[styles.subtitle, { color: theme.text }]}>{guide.cover.subtitle}</Text>
        </View>
        <View>
          <Palette colors={colors.slice(0, 6)} theme={theme} />
          <Text style={[styles.subtitle, { color: theme.text }]}>{guide.cover.introLine}</Text>
          <Text style={[styles.date, { color: theme.accent }]}>Généré le {formatDate(guide.generatedAt)}</Text>
        </View>
      </Page>

      <Page size="A4" orientation="landscape" style={[styles.page, { backgroundColor: theme.background, color: theme.text }]}>
        <Section eyebrow="Introduction" title="Comment utiliser ce guide" theme={theme}>
          <Text style={[styles.introText, { color: theme.text }]}>{guide.introduction}</Text>
        </Section>
        <Section eyebrow="01" title="ADN de marque" theme={theme}>
          <View style={styles.grid}>
            <Card label="Activite" value={guide.dna.activity} theme={theme} />
            <Card label="Raison d'être" value={guide.dna.essence} theme={theme} />
            <Card label="Mission" value={guide.dna.mission} theme={theme} />
            <Card label="Vision" value={guide.dna.vision} theme={theme} />
            <Card label="Promesse" value={guide.dna.promise} theme={theme} />
            <Card label="Valeurs" value={guide.dna.values.join(", ")} theme={theme} />
          </View>
        </Section>
        <Section eyebrow="02" title="Positionnement" theme={theme}>
          <View style={styles.grid}>
            <Card label="Contexte client" value={guide.positioning.context} theme={theme} />
            <Card label="Positionnement final" value={guide.positioning.finalPositioning} theme={theme} />
          </View>
        </Section>
      </Page>

      <Page size="A4" orientation="landscape" style={[styles.page, { backgroundColor: theme.background, color: theme.text }]}>
        <Section eyebrow="03" title="Personnalite de marque" theme={theme}>
          <View style={styles.grid}>
            <Card label="Persona incarne" value={guide.personality.persona} theme={theme} />
            <Card label="Traits dominants" value={guide.personality.traits.join(", ")} theme={theme} />
            <Card label="Posture relationnelle" value={guide.personality.relationship} theme={theme} />
            <Card label="Ton de voix" value={guide.personality.tone} theme={theme} />
            <Card label="Vocabulaire à privilégier" value={guide.personality.wordsToUse.join(", ")} theme={theme} />
            <Card label="Vocabulaire à éviter" value={guide.personality.wordsToAvoid.join(", ")} theme={theme} />
          </View>
        </Section>
        <Section eyebrow="04" title="Baseline" theme={theme}>
          <View style={styles.grid}>
            <Card label="Baseline finale" value={guide.baselineSection.final} theme={theme} />
            <Checklist title="Usages recommandes" items={guide.baselineSection.recommendedUses} theme={theme} />
          </View>
        </Section>
      </Page>

      <Page size="A4" orientation="landscape" style={[styles.page, { backgroundColor: theme.background, color: theme.text }]}>
        <Section eyebrow="05" title="Univers visuel" theme={theme}>
          <Palette colors={colors} theme={theme} />
          <View style={styles.grid}>
            <Card label="Ambiance generale" value={guide.visualUniverse.ambiance} theme={theme} />
            <Card label="Elements graphiques" value={guide.visualUniverse.graphicElements} theme={theme} />
          </View>
          <MoodboardComposition guide={guide} />
        </Section>
      </Page>

      <Page size="A4" orientation="landscape" style={[styles.page, { backgroundColor: theme.background, color: theme.text }]}>
        <Section eyebrow="06" title="Regles d'application" theme={theme}>
          <View style={styles.grid}>
            <Checklist title="Reseaux sociaux" items={guide.applicationRules.social} theme={theme} />
            <Checklist title="Site web" items={guide.applicationRules.website} theme={theme} />
            <Checklist title="Presentations" items={guide.applicationRules.presentations} theme={theme} />
            <Checklist title="Documents commerciaux" items={guide.applicationRules.salesDocs} theme={theme} />
          </View>
        </Section>
        <Section eyebrow="07" title="Checklists" theme={theme}>
          <View style={styles.grid}>
            <Checklist title="Avant publication d'un visuel" items={guide.checklists.visual} theme={theme} />
            <Checklist title="Avant rédaction d'un contenu" items={guide.checklists.editorial} theme={theme} />
            <Checklist title="Avant creation d'un support" items={guide.checklists.support} theme={theme} />
            <Checklist title="Avant evolution de la marque" items={guide.checklists.evolution} theme={theme} />
          </View>
        </Section>
      </Page>

      <Page size="A4" orientation="landscape" style={[styles.page, styles.summaryPage, { backgroundColor: theme.background, color: theme.text }]}>
        <Section eyebrow="Synthèse express" title={`${guide.brandName} en une page`} theme={theme}>
          <View style={styles.grid}>
            <Card label="Mission en 1 phrase" value={guide.expressSummary.mission} theme={theme} />
            <Card label="Positionnement en 1 phrase" value={guide.expressSummary.positioning} theme={theme} />
            <Card label="Ton en 3 mots" value={guide.expressSummary.tone.join(", ")} theme={theme} />
            <Card label="Palette principale" value={guide.expressSummary.palette.join(", ")} theme={theme} />
            <Card label="Promesse" value={guide.expressSummary.promise} theme={theme} />
            <Card label="Baseline" value={guide.expressSummary.baseline} theme={theme} />
          </View>
        </Section>
      </Page>
    </Document>
  );
}

export async function renderBrandGuidePdf(guide: GeneratedBrandGuide) {
  return renderToBuffer(<BrandGuidePdfDocument guide={guide} />);
}
