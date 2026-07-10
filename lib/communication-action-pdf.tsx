import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import {
  ACTION_STATUSES,
  getActionPeriodLabel,
  type ActionStatus,
  type CommunicationAction,
} from "@/lib/communication-action-shared";

const STATUS_COLORS: Record<ActionStatus, string> = {
  "Idée": "#F1CC56",
  "À préparer": "#E8A957",
  "Planifiée": "#CF7430",
  "En cours": "#739273",
  "Terminée": "#56765E",
  "En pause": "#9A8C9F",
};

const MONTHS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
] as const;

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FBF6ED",
    color: "#4B4550",
    fontFamily: "Helvetica",
    padding: 30,
  },
  header: {
    borderBottom: "1 solid #EADFCA",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 16,
  },
  eyebrow: {
    color: "#CF7430",
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  title: {
    color: "#332D35",
    fontSize: 25,
    lineHeight: 1.1,
    marginTop: 8,
  },
  subtitle: {
    color: "#6F645B",
    fontSize: 9,
    marginTop: 7,
  },
  yearBadge: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    border: "1 solid #EADFCA",
    borderRadius: 10,
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  yearLabel: {
    color: "#7A7087",
    fontSize: 7,
    fontWeight: 700,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  year: {
    color: "#CF7430",
    fontSize: 22,
    fontWeight: 700,
    marginTop: 3,
  },
  months: {
    flexDirection: "row",
    gap: 5,
    marginTop: 12,
  },
  month: {
    backgroundColor: "#FFFFFF",
    border: "1 solid #EADFCA",
    borderRadius: 6,
    flexBasis: 0,
    flexGrow: 1,
    paddingHorizontal: 4,
    paddingVertical: 6,
    textAlign: "center",
  },
  monthActive: {
    backgroundColor: "#FFF1D5",
    border: "1 solid #E8A957",
  },
  monthName: {
    color: "#6F645B",
    fontSize: 6.5,
    fontWeight: 700,
    textTransform: "uppercase",
  },
  monthCount: {
    color: "#CF7430",
    fontSize: 8,
    fontWeight: 700,
    marginTop: 2,
  },
  board: {
    flexDirection: "row",
    gap: 7,
    marginTop: 12,
  },
  column: {
    backgroundColor: "#F7F0E6",
    border: "1 solid #EADFCA",
    borderRadius: 9,
    flexGrow: 1,
    flexBasis: 0,
    minHeight: 570,
    padding: 7,
  },
  columnHeader: {
    borderRadius: 6,
    marginBottom: 7,
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  columnTitle: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  count: {
    color: "#FFFFFF",
    fontSize: 7,
    marginTop: 2,
  },
  card: {
    backgroundColor: "#FFFFFF",
    border: "1 solid #EADFCA",
    borderRadius: 7,
    marginBottom: 7,
    padding: 8,
  },
  cardPeriod: {
    color: "#CF7430",
    fontSize: 6.5,
    fontWeight: 700,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  cardTitle: {
    color: "#2F2A36",
    fontSize: 9,
    fontWeight: 700,
    lineHeight: 1.25,
    marginTop: 4,
  },
  cardMeta: {
    color: "#7A7087",
    fontSize: 6.5,
    lineHeight: 1.35,
    marginTop: 4,
  },
  cardStep: {
    backgroundColor: "#FFF8E8",
    borderRadius: 4,
    color: "#5F544A",
    fontSize: 6.8,
    lineHeight: 1.35,
    marginTop: 6,
    padding: 5,
  },
  empty: {
    color: "#9A9088",
    fontSize: 7,
    padding: 7,
    textAlign: "center",
  },
  footer: {
    bottom: 14,
    color: "#9A9088",
    fontSize: 6.5,
    left: 30,
    position: "absolute",
    right: 30,
    textAlign: "right",
  },
});

function sortActions(actions: CommunicationAction[]) {
  return [...actions].sort((left, right) => {
    const leftDate = left.start_date ?? left.target_month ?? left.target_quarter ?? "9999";
    const rightDate = right.start_date ?? right.target_month ?? right.target_quarter ?? "9999";
    return leftDate.localeCompare(rightDate) || left.sort_order - right.sort_order;
  });
}

function getActionMonthIndex(action: CommunicationAction, year: number) {
  const rawDate = action.start_date ?? action.target_month;
  const match = rawDate?.match(/^(\d{4})-(\d{2})/);

  if (!match || Number(match[1]) !== year) {
    return -1;
  }

  const monthIndex = Number(match[2]) - 1;
  return monthIndex >= 0 && monthIndex < MONTHS.length ? monthIndex : -1;
}

function getPdfPeriodLabel(action: CommunicationAction, year: number) {
  if (action.start_date) {
    return getActionPeriodLabel(action);
  }

  if (action.target_month) {
    const match = action.target_month.match(/^(\d{4})-(\d{2})$/);
    const monthIndex = match ? Number(match[2]) - 1 : -1;

    if (match && monthIndex >= 0 && monthIndex < MONTHS.length) {
      return `${MONTHS[monthIndex]} ${match[1]}`;
    }
  }

  if (action.target_quarter) {
    return `${action.target_quarter} ${year}`;
  }

  return "Mois à définir";
}

function KanbanCard({ action, year }: { action: CommunicationAction; year: number }) {
  return (
    <View style={styles.card} wrap={false}>
      <Text style={styles.cardPeriod}>{getPdfPeriodLabel(action, year)}</Text>
      <Text style={styles.cardTitle}>{action.title}</Text>
      <Text style={styles.cardMeta}>
        {[action.action_type, action.objective, action.calculated_priority]
          .filter(Boolean)
          .join(" · ")}
      </Text>
      {action.first_step ? (
        <Text style={styles.cardStep}>Première étape : {action.first_step}</Text>
      ) : null}
    </View>
  );
}

export async function renderCommunicationActionPdf(input: {
  brandName: string;
  actions: CommunicationAction[];
}) {
  const year = new Date().getFullYear();
  const monthlyActionCounts = MONTHS.map(
    (_, monthIndex) =>
      input.actions.filter((action) => getActionMonthIndex(action, year) === monthIndex)
        .length,
  );

  const document = (
    <Document title={`Feuille de route annuelle ${year} - ${input.brandName}`}>
      <Page size="A3" orientation="landscape" style={styles.page}>
        <View style={styles.header} fixed>
          <View>
            <Text style={styles.eyebrow}>Brand Studio · Plan d&apos;action communication</Text>
            <Text style={styles.title}>Kanban annuel de {input.brandName}</Text>
            <Text style={styles.subtitle}>
              Une vue d&apos;ensemble des actions de communication, de l&apos;idée à la réalisation.
            </Text>
          </View>
          <View style={styles.yearBadge}>
            <Text style={styles.yearLabel}>Feuille de route</Text>
            <Text style={styles.year}>{year}</Text>
          </View>
        </View>

        <View style={styles.months} fixed>
          {MONTHS.map((month, monthIndex) => {
            const actionCount = monthlyActionCounts[monthIndex];

            return (
              <View
                key={month}
                style={[styles.month, actionCount > 0 ? styles.monthActive : {}]}
              >
                <Text style={styles.monthName}>{month}</Text>
                <Text style={styles.monthCount}>{actionCount}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.board}>
          {ACTION_STATUSES.map((status) => {
            const statusActions = sortActions(
              input.actions.filter((action) => action.status === status),
            );

            return (
              <View key={status} style={styles.column}>
                <View
                  style={[styles.columnHeader, { backgroundColor: STATUS_COLORS[status] }]}
                  fixed
                >
                  <Text style={styles.columnTitle}>{status}</Text>
                  <Text style={styles.count}>
                    {statusActions.length} action{statusActions.length > 1 ? "s" : ""}
                  </Text>
                </View>
                {statusActions.length > 0 ? (
                  statusActions.map((action) => (
                    <KanbanCard key={action.id} action={action} year={year} />
                  ))
                ) : (
                  <Text style={styles.empty}>Aucune action</Text>
                )}
              </View>
            );
          })}
        </View>

        <Text style={styles.footer} fixed>
          Généré avec Brand Studio · {input.actions.length} action
          {input.actions.length > 1 ? "s" : ""}
        </Text>
      </Page>
    </Document>
  );

  return renderToBuffer(document);
}
