import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { AdminUserView } from "./admin-user-insights";
import { parseStoredSpectrumAnswer } from "./spectrum";
import { parseIndexedAnswerItems } from "./exercise-types";
import { sanitizePdfText } from "./module-pdf-summary";
import { TYASH_PAPER } from "./tyash-paper";
import { TyashPaperGrid } from "./tyash-paper-pdf";

const styles = StyleSheet.create({ page: { backgroundColor: TYASH_PAPER.background, padding: 42, fontFamily: "Helvetica", color: "#332d35", fontSize: 10 }, header: { fontSize: 9, color: "#7a2d46", marginBottom: 10 }, title: { fontSize: 21, marginBottom: 10 }, submodule: { fontSize: 12, marginTop: 18, marginBottom: 8 }, question: { fontSize: 10, marginTop: 10, marginBottom: 5, fontFamily: "Helvetica-Bold" }, answer: { fontSize: 10, lineHeight: 1.5, marginBottom: 7 }, origin: { fontSize: 8, color: "#6e626a", marginBottom: 3 }, footer: { position: "absolute", bottom: 22, left: 42, fontSize: 8, color: "#6e626a" } });

function readableAnswer(values: string[], type: string) {
  if (type === "spectrum") {
    const answer = parseStoredSpectrumAnswer(values);
    return answer ? `${answer.leftLabel} / ${answer.rightLabel} : ${answer.score}/100` : "Non renseigné";
  }
  const indexed = parseIndexedAnswerItems(values);
  return indexed.length ? indexed.map(v => v.value).join("\n") : values.join("\n");
}

export function TyashQuestionnairePdf({ user }: { user: AdminUserView }) {
  return <Document title={`Brief vidéo TYASH — ${user.company}`} author="TYASH" language="fr-FR">{user.moduleProgress.map(moduleItem => {
    const answers = user.answers.filter(a => a.moduleId === moduleItem.id);
    return <Page key={moduleItem.id} size="A4" style={styles.page} wrap><TyashPaperGrid /><Text style={styles.header} fixed>BRAND STUDIO × TYASH · COMPTE-RENDU DU QUESTIONNAIRE</Text><Text style={styles.title}>{sanitizePdfText(moduleItem.title)}</Text><Text>{sanitizePdfText(user.company)} · {sanitizePdfText(user.name)}</Text>{answers.length ? [...Map.groupBy(answers, a => a.submoduleTitle)].map(([title, items]) => <View key={title}><Text style={styles.submodule} minPresenceAhead={60}>{sanitizePdfText(title)}</Text>{items.map(item => <View key={item.exerciseId}><Text style={styles.question} minPresenceAhead={30}>{sanitizePdfText(item.exerciseTitle)}</Text>{item.origin === "prefill" ? <Text style={styles.origin}>Information préparée par TYASH</Text> : null}<Text style={styles.answer}>{sanitizePdfText(readableAnswer(item.values, item.exerciseType))}</Text></View>)}</View>) : <Text style={styles.answer}>Aucune réponse enregistrée dans ce module.</Text>}<Text style={styles.footer} render={({ pageNumber, totalPages }) => `TYASH · Brief vidéo · ${pageNumber} / ${totalPages}`} fixed /></Page>;
  })}</Document>;
}
