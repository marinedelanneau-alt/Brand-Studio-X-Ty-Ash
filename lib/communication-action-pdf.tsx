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

type MonthRange = {
  start: number;
  end: number;
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#FBF6ED",
    color: "#4B4550",
    fontFamily: "Helvetica",
    padding: 30,
    paddingBottom: 28,
  },
  header: {
    borderBottom: "1 solid #EADFCA",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 14,
  },
  eyebrow: {
    color: "#7A2D46",
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
    color: "#7A2D46",
    fontSize: 22,
    fontWeight: 700,
    marginTop: 3,
  },
  months: {
    flexDirection: "row",
    gap: 4,
    marginTop: 12,
  },
  month: {
    backgroundColor: "#FFFFFF",
    border: "1 solid #EADFCA",
    borderRadius: 6,
    flexBasis: 0,
    flexGrow: 1,
    paddingHorizontal: 3,
    paddingVertical: 6,
    textAlign: "center",
  },
  monthActive: {
    backgroundColor: "#F5E4EB",
    border: "1 solid #E8D1DC",
  },
  monthName: {
    color: "#6F645B",
    fontSize: 6.3,
    fontWeight: 700,
    textTransform: "uppercase",
  },
  monthCount: {
    color: "#7A2D46",
    fontSize: 8,
    fontWeight: 700,
    marginTop: 2,
  },
  sectionTitle: {
    color: "#7A2D46",
    fontSize: 7,
    fontWeight: 700,
    letterSpacing: 1.3,
    marginBottom: 7,
    marginTop: 13,
    textTransform: "uppercase",
  },
  roadmap: {
    border: "1 solid #EADFCA",
    borderRadius: 8,
    overflow: "hidden",
  },
  actionRow: {
    backgroundColor: "#F8F1E7",
    borderBottom: "1 solid #EADFCA",
    height: 52,
    position: "relative",
  },
  grid: {
    bottom: 0,
    flexDirection: "row",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  gridCell: {
    borderRight: "1 solid #EADFCA",
    flexBasis: 0,
    flexGrow: 1,
  },
  actionBar: {
    borderRadius: 6,
    bottom: 5,
    paddingHorizontal: 8,
    paddingVertical: 6,
    position: "absolute",
    top: 5,
  },
  actionTitle: {
    color: "#FFFFFF",
    fontSize: 8.2,
    fontWeight: 700,
    lineHeight: 1.2,
  },
  actionMeta: {
    color: "#FFFFFF",
    fontSize: 6.2,
    lineHeight: 1.2,
    marginTop: 3,
    opacity: 0.92,
  },
  undatedList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  undatedCard: {
    backgroundColor: "#FFFFFF",
    border: "1 solid #EADFCA",
    borderRadius: 7,
    padding: 8,
    width: "24%",
  },
  undatedLabel: {
    color: "#7A2D46",
    fontSize: 6.2,
    fontWeight: 700,
    textTransform: "uppercase",
  },
  undatedTitle: {
    color: "#2F2A36",
    fontSize: 8.5,
    fontWeight: 700,
    marginTop: 4,
  },
  undatedMeta: {
    color: "#7A7087",
    fontSize: 6.2,
    marginTop: 4,
  },
  empty: {
    color: "#9A9088",
    fontSize: 8,
    padding: 18,
    textAlign: "center",
  },
  footer: {
    bottom: 12,
    color: "#9A9088",
    fontSize: 6.5,
    left: 30,
    position: "absolute",
    right: 30,
    textAlign: "right",
  },
});

function getActionMonthRange(
  action: CommunicationAction,
  year: number,
): MonthRange | null {
  const rawDate = action.start_date ?? action.target_month;
  const dateMatch = rawDate?.match(/^(\d{4})-(\d{2})/);

  if (dateMatch) {
    if (Number(dateMatch[1]) !== year) {
      return null;
    }

    const monthIndex = Number(dateMatch[2]) - 1;
    return monthIndex >= 0 && monthIndex < MONTHS.length
      ? { start: monthIndex, end: monthIndex }
      : null;
  }

  const quarterMatch = action.target_quarter?.match(/^T([1-4])$/i);

  if (!quarterMatch) {
    return null;
  }

  const firstMonthIndex = (Number(quarterMatch[1]) - 1) * 3;
  return { start: firstMonthIndex, end: firstMonthIndex + 2 };
}

function getPdfPeriodLabel(
  action: CommunicationAction,
  year: number,
  range: MonthRange,
) {
  if (action.start_date) {
    return getActionPeriodLabel(action);
  }

  if (range.start === range.end) {
    return `${MONTHS[range.start]} ${year}`;
  }

  return `${MONTHS[range.start]} – ${MONTHS[range.end]} ${year}`;
}

function sortScheduledActions(
  entries: Array<{ action: CommunicationAction; range: MonthRange }>,
) {
  return [...entries].sort(
    (left, right) =>
      left.range.start - right.range.start ||
      left.range.end - right.range.end ||
      left.action.sort_order - right.action.sort_order,
  );
}

function RoadmapRow({
  action,
  range,
  year,
}: {
  action: CommunicationAction;
  range: MonthRange;
  year: number;
}) {
  const left = `${(range.start / MONTHS.length) * 100}%`;
  const width = `${((range.end - range.start + 1) / MONTHS.length) * 100}%`;

  return (
    <View style={styles.actionRow} wrap={false}>
      <View style={styles.grid}>
        {MONTHS.map((month) => (
          <View key={month} style={styles.gridCell} />
        ))}
      </View>
      <View
        style={[
          styles.actionBar,
          {
            backgroundColor: STATUS_COLORS[action.status],
            left,
            width,
          },
        ]}
      >
        <Text style={styles.actionTitle}>{action.title}</Text>
        <Text style={styles.actionMeta}>
          {getPdfPeriodLabel(action, year, range)} · {action.status} · {action.calculated_priority}
        </Text>
      </View>
    </View>
  );
}

export async function renderCommunicationActionPdf(input: {
  brandName: string;
  actions: CommunicationAction[];
  year?: number;
}) {
  const year = input.year ?? new Date().getFullYear();
  const scheduledActions = sortScheduledActions(
    input.actions.flatMap((action) => {
      const range = getActionMonthRange(action, year);
      return range ? [{ action, range }] : [];
    }),
  );
  const scheduledIds = new Set(scheduledActions.map(({ action }) => action.id));
  const undatedActions = input.actions.filter((action) => !scheduledIds.has(action.id));
  const monthlyActionCounts = MONTHS.map(
    (_, monthIndex) =>
      scheduledActions.filter(
        ({ range }) => monthIndex >= range.start && monthIndex <= range.end,
      ).length,
  );

  const document = (
    <Document title={`Feuille de route annuelle ${year} - ${input.brandName}`}>
      <Page size="A3" orientation="landscape" style={styles.page}>
        <View style={styles.header} fixed>
          <View>
            <Text style={styles.eyebrow}>Brand Studio · Plan d&apos;action communication</Text>
            <Text style={styles.title}>Kanban annuel de {input.brandName}</Text>
            <Text style={styles.subtitle}>
              Chaque action s&apos;étend visuellement sur tous les mois concernés.
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

        <Text style={styles.sectionTitle}>Planning annuel</Text>
        <View style={styles.roadmap}>
          {scheduledActions.length > 0 ? (
            scheduledActions.map(({ action, range }) => (
              <RoadmapRow key={action.id} action={action} range={range} year={year} />
            ))
          ) : (
            <Text style={styles.empty}>Aucune action planifiée pour {year}</Text>
          )}
        </View>

        {undatedActions.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Actions à planifier</Text>
            <View style={styles.undatedList}>
              {undatedActions.map((action) => (
                <View key={action.id} style={styles.undatedCard} wrap={false}>
                  <Text style={styles.undatedLabel}>{action.status}</Text>
                  <Text style={styles.undatedTitle}>{action.title}</Text>
                  <Text style={styles.undatedMeta}>
                    {[action.action_type, action.objective, action.calculated_priority]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        <Text style={styles.footer} fixed>
          Généré avec Brand Studio · {input.actions.length} action
          {input.actions.length > 1 ? "s" : ""}
        </Text>
      </Page>
    </Document>
  );

  return renderToBuffer(document);
}
