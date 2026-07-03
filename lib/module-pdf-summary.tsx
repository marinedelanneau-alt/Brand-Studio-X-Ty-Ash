import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { ModuleSummaryCard } from "@/lib/module-summary";
import type { ModuleShareData } from "@/lib/get-module-share-data";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FBF6ED",
    color: "#4B4550",
    fontFamily: "Helvetica",
    padding: 42,
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
    fontSize: 34,
    lineHeight: 1.05,
    marginTop: 18,
  },
  subtitle: {
    color: "#6F645B",
    fontSize: 12,
    lineHeight: 1.5,
    marginTop: 12,
  },
  metaRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 22,
  },
  metaItem: {
    backgroundColor: "#FFFDF9",
    border: "1 solid #EADFCA",
    borderRadius: 8,
    padding: 12,
    width: "32%",
  },
  label: {
    color: "#7A7087",
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: 1.3,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  value: {
    color: "#4B4550",
    fontSize: 11,
    lineHeight: 1.45,
  },
  section: {
    backgroundColor: "#FFFDF9",
    border: "1 solid #EADFCA",
    borderRadius: 10,
    marginTop: 18,
    padding: 18,
  },
  sectionTitle: {
    color: "#332D35",
    fontSize: 17,
    marginBottom: 12,
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
    padding: 12,
    width: "48%",
  },
  bodyText: {
    color: "#5F544A",
    fontSize: 10.5,
    lineHeight: 1.55,
  },
  conclusion: {
    color: "#5F544A",
    fontSize: 12,
    lineHeight: 1.6,
  },
  footer: {
    borderTop: "1 solid #EADFCA",
    color: "#7A7087",
    fontSize: 8,
    letterSpacing: 1.2,
    marginTop: "auto",
    paddingTop: 16,
    textTransform: "uppercase",
  },
});

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export function ModulePdfSummary({
  summary,
  shareData,
}: {
  summary: ModuleSummaryCard;
  shareData: ModuleShareData;
}) {
  return (
    <Document
      title={`Resume ${shareData.moduleTitle} - ${shareData.brandName}`}
      author="Brand Studio"
      subject="Resume de module Brand Studio"
    >
      <Page size="A4" style={styles.page}>
        <Text style={styles.eyebrow}>Brand Studio · Resume de module</Text>
        <Text style={styles.title}>{shareData.moduleTitle}</Text>
        <Text style={styles.subtitle}>{shareData.brandName}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.label}>Generation</Text>
            <Text style={styles.value}>{formatDate(shareData.completedAt)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.label}>Progression</Text>
            <Text style={styles.value}>{shareData.progress}%</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.label}>Mots cles</Text>
            <Text style={styles.value}>{shareData.keywords.join(", ")}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Synthese automatique</Text>
          <Text style={styles.bodyText}>{summary.insight}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conclusion</Text>
          <Text style={styles.conclusion}>
            {`${shareData.shareSentence} Tu disposes maintenant d'une base plus claire pour avancer dans la construction de ton identite de marque.`}
          </Text>
        </View>

        <Text style={styles.footer}>
          Brand Studio · Document personnel genere depuis ton espace de travail
        </Text>
      </Page>
    </Document>
  );
}
