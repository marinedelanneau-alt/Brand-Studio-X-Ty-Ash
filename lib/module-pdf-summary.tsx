import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { ModuleSummaryCard } from "@/lib/module-summary";
import type { ModuleShareData } from "@/lib/get-module-share-data";

const colors = {
  background: "#FBF6ED",
  paper: "#FFFDF9",
  card: "#FFFFFF",
  text: "#332D35",
  muted: "#6F645B",
  soft: "#7A7087",
  border: "#EADFCA",
  accent: "#CF7430",
  accentSoft: "#FFF2DF",
  gold: "#F1CC56",
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.background,
    color: colors.text,
    fontFamily: "Helvetica",
    padding: 38,
  },
  hero: {
    backgroundColor: colors.paper,
    border: `1 solid ${colors.border}`,
    borderRadius: 16,
    padding: 22,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 2.4,
    textTransform: "uppercase",
  },
  title: {
    color: colors.text,
    fontSize: 35,
    lineHeight: 1.05,
    marginTop: 16,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 1.5,
    marginTop: 10,
  },
  introSentence: {
    color: colors.muted,
    fontSize: 11.5,
    lineHeight: 1.55,
    marginTop: 16,
    maxWidth: 430,
  },
  metaRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },
  metaItem: {
    backgroundColor: colors.card,
    border: `1 solid ${colors.border}`,
    borderRadius: 10,
    padding: 12,
    width: "32%",
  },
  metaItemAccent: {
    backgroundColor: colors.accentSoft,
    border: `1 solid ${colors.gold}`,
    borderRadius: 10,
    padding: 12,
    width: "32%",
  },
  label: {
    color: colors.soft,
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: 1.4,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  value: {
    color: colors.text,
    fontSize: 11,
    fontWeight: 700,
    lineHeight: 1.45,
  },
  section: {
    backgroundColor: colors.paper,
    border: `1 solid ${colors.border}`,
    borderRadius: 14,
    marginTop: 18,
    padding: 18,
  },
  sectionEyebrow: {
    color: colors.accent,
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: 1.8,
    marginBottom: 5,
    textTransform: "uppercase",
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: 700,
    marginBottom: 14,
  },
  answerRow: {
    backgroundColor: colors.card,
    border: `1 solid ${colors.border}`,
    borderLeft: `5 solid ${colors.accent}`,
    borderRadius: 10,
    marginBottom: 10,
    padding: 13,
  },
  answerLabel: {
    color: colors.text,
    fontSize: 11,
    fontWeight: 700,
    lineHeight: 1.45,
    marginBottom: 4,
  },
  answerText: {
    color: colors.muted,
    fontSize: 10.8,
    lineHeight: 1.6,
  },
  submoduleCard: {
    backgroundColor: colors.card,
    border: `1 solid ${colors.border}`,
    borderRadius: 10,
    marginBottom: 12,
    padding: 13,
  },
  submoduleHeader: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 9,
  },
  submoduleNumber: {
    backgroundColor: colors.accentSoft,
    borderRadius: 12,
    color: colors.accent,
    fontSize: 9,
    fontWeight: 700,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  submoduleTitle: {
    color: colors.text,
    fontSize: 12.5,
    fontWeight: 700,
    lineHeight: 1.35,
  },
  detailRow: {
    borderTop: `1 solid ${colors.border}`,
    marginTop: 8,
    paddingTop: 8,
  },
  detailLabel: {
    color: colors.accent,
    fontSize: 8.5,
    fontWeight: 700,
    letterSpacing: 0.6,
    marginBottom: 3,
    textTransform: "uppercase",
  },
  detailValue: {
    color: colors.muted,
    fontSize: 10,
    lineHeight: 1.55,
  },
  conclusion: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 1.6,
  },
  footer: {
    borderTop: `1 solid ${colors.border}`,
    color: colors.soft,
    fontSize: 8,
    letterSpacing: 1.2,
    marginTop: "auto",
    paddingTop: 14,
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
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Brand Studio · Resume de module</Text>
          <Text style={styles.title}>{shareData.moduleTitle}</Text>
          <Text style={styles.subtitle}>{shareData.brandName}</Text>
          <Text style={styles.introSentence}>
            {summary.hero || shareData.shareSentence}
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.label}>Generation</Text>
              <Text style={styles.value}>{formatDate(shareData.completedAt)}</Text>
            </View>
            <View style={styles.metaItemAccent}>
              <Text style={styles.label}>Progression</Text>
              <Text style={styles.value}>{shareData.progress}%</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.label}>Mots cles</Text>
              <Text style={styles.value}>{shareData.keywords.join(", ")}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>Reponses principales</Text>
          <Text style={styles.sectionTitle}>Ce que tu viens de construire</Text>
          {summary.keyTakeaways.map((item) => (
            <View key={item.id} style={styles.answerRow} wrap={false}>
              <Text style={styles.answerLabel}>{item.label}</Text>
              <Text style={styles.answerText}>{item.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>Detail</Text>
          <Text style={styles.sectionTitle}>Resume par sous-module</Text>
          {summary.submoduleRecaps.map((submodule) => (
            <View key={submodule.id} style={styles.submoduleCard}>
              <View style={styles.submoduleHeader}>
                <Text style={styles.submoduleNumber}>{submodule.position}</Text>
                <Text style={styles.submoduleTitle}>{submodule.title}</Text>
              </View>
              {submodule.highlights.map((item, index) => (
                <View key={`${item.label}-${index}`} style={styles.detailRow} wrap={false}>
                  <Text style={styles.detailLabel}>{item.label}</Text>
                  <Text style={styles.detailValue}>{item.value}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>Suite</Text>
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
