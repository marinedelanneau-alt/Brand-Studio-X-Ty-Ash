import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import {
  getActionPeriodLabel,
  type CommunicationAction,
} from "@/lib/communication-action-shared";

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
    lineHeight: 1.1,
    marginTop: 18,
  },
  subtitle: {
    color: "#6F645B",
    fontSize: 12,
    lineHeight: 1.6,
    marginTop: 12,
  },
  stats: {
    flexDirection: "row",
    gap: 10,
    marginTop: 24,
  },
  stat: {
    backgroundColor: "#FFFFFF",
    border: "1 solid #EADFCA",
    borderRadius: 8,
    padding: 12,
    width: "31%",
  },
  statValue: {
    color: "#2F2A36",
    fontSize: 22,
    fontWeight: 700,
  },
  statLabel: {
    color: "#6F645B",
    fontSize: 9,
    marginTop: 4,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    color: "#CF7430",
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 1.6,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  action: {
    backgroundColor: "#FFFFFF",
    border: "1 solid #EADFCA",
    borderRadius: 8,
    marginBottom: 10,
    padding: 14,
  },
  actionTitle: {
    color: "#2F2A36",
    fontSize: 14,
    fontWeight: 700,
  },
  meta: {
    color: "#7A7087",
    fontSize: 8.5,
    lineHeight: 1.5,
    marginTop: 6,
  },
  text: {
    color: "#5F544A",
    fontSize: 10,
    lineHeight: 1.6,
    marginTop: 8,
  },
});

function sortActions(actions: CommunicationAction[]) {
  return [...actions].sort((left, right) => {
    const leftDate = left.start_date ?? left.target_month ?? left.target_quarter ?? "9999";
    const rightDate = right.start_date ?? right.target_month ?? right.target_quarter ?? "9999";
    return leftDate.localeCompare(rightDate);
  });
}

function ActionBlock({ action }: { action: CommunicationAction }) {
  return (
    <View style={styles.action} wrap={false}>
      <Text style={styles.actionTitle}>{action.title}</Text>
      <Text style={styles.meta}>
        {getActionPeriodLabel(action)} · {action.objective || "Objectif à préciser"} ·{" "}
        {action.action_type || "Type à préciser"} · {action.calculated_priority || "À planifier"} ·{" "}
        {action.status}
      </Text>
      {action.first_step ? (
        <Text style={styles.text}>Première étape : {action.first_step}</Text>
      ) : null}
      {action.description ? <Text style={styles.text}>{action.description}</Text> : null}
    </View>
  );
}

export async function renderCommunicationActionPdf(input: {
  brandName: string;
  actions: CommunicationAction[];
}) {
  const priorityCount = input.actions.filter(
    (action) => action.calculated_priority === "À lancer en priorité",
  ).length;
  const prepCount = input.actions.filter(
    (action) => action.calculated_priority === "À préparer",
  ).length;
  const completedCount = input.actions.filter((action) => action.status === "Terminée").length;
  const objectives = Array.from(
    new Set(input.actions.map((action) => action.objective).filter(Boolean)),
  ).slice(0, 4);

  const document = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.eyebrow}>Brand Studio · Plan d&apos;action communication</Text>
        <Text style={styles.title}>Feuille de route communication de {input.brandName}</Text>
        <Text style={styles.subtitle}>
          Actions classées chronologiquement pour faire connaître, activer et développer la marque.
        </Text>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{priorityCount}</Text>
            <Text style={styles.statLabel}>actions prioritaires</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{prepCount}</Text>
            <Text style={styles.statLabel}>actions à préparer</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{completedCount}</Text>
            <Text style={styles.statLabel}>actions terminées</Text>
          </View>
        </View>

        {objectives.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Objectifs prioritaires</Text>
            <Text style={styles.text}>{objectives.join(" · ")}</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          {sortActions(input.actions).map((action) => (
            <ActionBlock key={action.id} action={action} />
          ))}
        </View>
      </Page>
    </Document>
  );

  return renderToBuffer(document);
}
