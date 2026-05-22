import {
  Document,
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

function Card({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <View style={wide ? styles.cardWide : styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.text}>{value}</Text>
    </View>
  );
}

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section} wrap={false}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Checklist({ title, items }: { title: string; items: string[] }) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{title}</Text>
      {items.map((item) => (
        <Text key={item} style={styles.checklistItem}>
          - {item}
        </Text>
      ))}
    </View>
  );
}

function Palette({ colors }: { colors: GuideColor[] }) {
  if (colors.length === 0) {
    return (
      <Card
        wide
        label="Palette"
        value="Palette ou intention visuelle a completer dans le module Palette de couleurs."
      />
    );
  }

  return (
    <View style={styles.colorRow}>
      {colors.map((color) => (
        <View key={color.id} style={styles.colorCard}>
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

function BrandGuidePdfDocument({ guide }: { guide: GeneratedBrandGuide }) {
  const colors = [
    ...guide.visualUniverse.palette.primary,
    ...guide.visualUniverse.palette.secondary,
  ];

  return (
    <Document
      title={`Guide de Marque - ${guide.brandName}`}
      author="Brand Studio"
      subject="Guide de marque genere automatiquement"
    >
      <Page size="A4" style={[styles.page, styles.cover]}>
        <View>
          <Text style={styles.eyebrow}>Brand Studio</Text>
          <Text style={styles.title}>{guide.cover.title}</Text>
          <Text style={styles.subtitle}>{guide.cover.subtitle}</Text>
        </View>
        <View>
          <Palette colors={colors.slice(0, 6)} />
          <Text style={styles.subtitle}>{guide.cover.introLine}</Text>
          <Text style={styles.date}>Genere le {formatDate(guide.generatedAt)}</Text>
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <Section eyebrow="Introduction" title="Comment utiliser ce guide">
          <Text style={styles.introText}>{guide.introduction}</Text>
        </Section>
        <Section eyebrow="01" title="ADN de marque">
          <View style={styles.grid}>
            <Card label="Activite" value={guide.dna.activity} />
            <Card label="Raison d'etre" value={guide.dna.essence} />
            <Card label="Mission" value={guide.dna.mission} />
            <Card label="Vision" value={guide.dna.vision} />
            <Card label="Promesse" value={guide.dna.promise} />
            <Card label="Valeurs" value={guide.dna.values.join(", ")} />
          </View>
        </Section>
        <Section eyebrow="02" title="Positionnement">
          <View style={styles.grid}>
            <Card label="Cible principale" value={guide.positioning.target} />
            <Card label="Contexte client" value={guide.positioning.context} />
            <Card label="Probleme resolu" value={guide.positioning.problem} />
            <Card label="Differenciation" value={guide.positioning.differentiation} />
            <Card label="Positionnement final" value={guide.positioning.finalPositioning} />
            <Card label="Pitch" value={guide.positioning.pitch} />
          </View>
        </Section>
      </Page>

      <Page size="A4" style={styles.page}>
        <Section eyebrow="03" title="Personnalite de marque">
          <View style={styles.grid}>
            <Card label="Persona incarne" value={guide.personality.persona} />
            <Card label="Traits dominants" value={guide.personality.traits.join(", ")} />
            <Card label="Posture relationnelle" value={guide.personality.relationship} />
            <Card label="Ton de voix" value={guide.personality.tone} />
            <Card label="Vocabulaire a privilegier" value={guide.personality.wordsToUse.join(", ")} />
            <Card label="Vocabulaire a eviter" value={guide.personality.wordsToAvoid.join(", ")} />
          </View>
        </Section>
        <Section eyebrow="04" title="Baseline">
          <View style={styles.grid}>
            <Card label="Baseline finale" value={guide.baselineSection.final} />
            <Checklist title="Usages recommandes" items={guide.baselineSection.recommendedUses} />
          </View>
        </Section>
        <Section eyebrow="05" title="Univers visuel">
          <Palette colors={colors} />
          <View style={styles.grid}>
            <Card label="Ambiance generale" value={guide.visualUniverse.ambiance} />
            <Card label="Elements graphiques" value={guide.visualUniverse.graphicElements} />
          </View>
        </Section>
      </Page>

      <Page size="A4" style={styles.page}>
        <Section eyebrow="06" title="Regles d'application">
          <View style={styles.grid}>
            <Checklist title="Reseaux sociaux" items={guide.applicationRules.social} />
            <Checklist title="Site web" items={guide.applicationRules.website} />
            <Checklist title="Presentations" items={guide.applicationRules.presentations} />
            <Checklist title="Documents commerciaux" items={guide.applicationRules.salesDocs} />
          </View>
        </Section>
        <Section eyebrow="07" title="Checklists">
          <View style={styles.grid}>
            <Checklist title="Avant publication d'un visuel" items={guide.checklists.visual} />
            <Checklist title="Avant redaction d'un contenu" items={guide.checklists.editorial} />
            <Checklist title="Avant creation d'un support" items={guide.checklists.support} />
            <Checklist title="Avant evolution de la marque" items={guide.checklists.evolution} />
          </View>
        </Section>
      </Page>

      <Page size="A4" style={[styles.page, styles.summaryPage]}>
        <Section eyebrow="Synthese express" title={`${guide.brandName} en une page`}>
          <View style={styles.grid}>
            <Card label="Mission en 1 phrase" value={guide.expressSummary.mission} />
            <Card label="Positionnement en 1 phrase" value={guide.expressSummary.positioning} />
            <Card label="Ton en 3 mots" value={guide.expressSummary.tone.join(", ")} />
            <Card label="Palette principale" value={guide.expressSummary.palette.join(", ")} />
            <Card label="Promesse" value={guide.expressSummary.promise} />
            <Card label="Baseline" value={guide.expressSummary.baseline} />
          </View>
        </Section>
      </Page>
    </Document>
  );
}

export async function renderBrandGuidePdf(guide: GeneratedBrandGuide) {
  return renderToBuffer(<BrandGuidePdfDocument guide={guide} />);
}
