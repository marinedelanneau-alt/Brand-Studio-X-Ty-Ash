import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { PersonaCv } from "@/lib/persona-summary";

const styles = StyleSheet.create({
  page: { padding: 42, backgroundColor: "#fffaf2", color: "#403845", fontFamily: "Helvetica" },
  eyebrow: { fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "#cf7430", fontWeight: 700 },
  title: { marginTop: 10, fontSize: 32, fontWeight: 700 },
  subtitle: { marginTop: 6, fontSize: 11, color: "#756a70" },
  grid: { marginTop: 24, flexDirection: "row", flexWrap: "wrap", gap: 10 },
  card: { width: "48%", padding: 13, border: "1 solid #eadfca", borderRadius: 8, backgroundColor: "#ffffff" },
  label: { fontSize: 8, letterSpacing: 1.2, textTransform: "uppercase", color: "#8a7080", fontWeight: 700 },
  value: { marginTop: 6, fontSize: 10.5, lineHeight: 1.5 },
  quote: { marginTop: 18, padding: 14, borderLeft: "3 solid #cf7430", backgroundColor: "#fff3df", fontSize: 12, lineHeight: 1.5, fontStyle: "italic" },
  section: { marginTop: 20 },
  sectionTitle: { paddingBottom: 6, borderBottom: "1 solid #eadfca", fontSize: 15, fontWeight: 700 },
  entry: { marginTop: 10 },
  entryLabel: { fontSize: 9, color: "#8a7080", fontWeight: 700 },
  entryValue: { marginTop: 3, fontSize: 10, lineHeight: 1.45 },
  footer: { position: "absolute", bottom: 22, left: 42, right: 42, textAlign: "center", fontSize: 8, color: "#8a817a" },
});

export function PersonaPdf({ persona, projectName }: { persona: PersonaCv; projectName: string }) {
  const highlights = [["Profil", persona.profile], ["Traits dominants", persona.traits], ["Ton de voix", persona.tone], ["Valeurs incarnées", persona.values], ["Manière d'interagir", persona.interactions]].filter(([, value]) => value);
  return <Document title={`Fiche persona - ${persona.firstName || projectName}`}>
    <Page size="A4" style={styles.page} wrap>
      <Text style={styles.eyebrow}>Brand Studio • Fiche persona complète</Text>
      <Text style={styles.title}>{persona.firstName || "Persona de marque"}</Text>
      <Text style={styles.subtitle}>{projectName} — Le CV de la personnalité de marque</Text>
      <View style={styles.grid}>{highlights.map(([label, value]) => <View key={label} style={styles.card}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View>)}</View>
      {persona.quote ? <Text style={styles.quote}>« {persona.quote} »</Text> : null}
      {persona.sections.map((section) => <View key={section.title} style={styles.section} wrap={false}><Text style={styles.sectionTitle}>{section.title}</Text>{section.entries.map((entry) => <View key={`${entry.label}-${entry.value}`} style={styles.entry}><Text style={styles.entryLabel}>{entry.label}</Text><Text style={styles.entryValue}>{entry.value}</Text></View>)}</View>)}
      <Text fixed style={styles.footer}>Créé avec Brand Studio</Text>
    </Page>
  </Document>;
}
