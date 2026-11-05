import { Document, Font, Page, Path, Svg, Line, Circle, StyleSheet, Text as PdfText, View } from "@react-pdf/renderer";
import type { ComponentProps } from "react";
import path from "node:path";
import type { WorkspaceModule } from "./training-types";
import type { ModuleShareData } from "./get-module-share-data";
import type { ModuleSummaryCard } from "./module-summary";
import { buildTyashNotebookData, notebookText, type NotebookAnswer } from "./tyash-module-notebook-data";

const font = (name: string) => path.join(process.cwd(), "public", "fonts", name);
Font.register({ family: "TyashDisplay", src: font("tyash-archivo-display.ttf") });
Font.register({ family: "TyashEditorial", src: font("tyash-instrument-serif-italic.ttf"), fontStyle: "italic" });
Font.register({ family: "TyashBody", fonts: [{ src: font("inter-400.woff"), fontWeight: 400 }, { src: font("inter-600.woff"), fontWeight: 600 }] });

const C = { paper: "#F4F0DF", grid: "#E5DFC9", ink: "#111110", accent: "#991D25", body: "#34332D", muted: "#746F62", line: "#C9C2AF" };
function Text(props: ComponentProps<typeof PdfText>) {
  return <PdfText hyphenationCallback={word => word.length > 40 ? word.match(/.{1,20}/gu) ?? [word] : [word]} {...props} />;
}
const S = StyleSheet.create({
  page: { backgroundColor: C.paper, fontFamily: "TyashBody", fontSize: 10, color: C.ink, paddingTop: 78, paddingHorizontal: 48, paddingBottom: 66 },
  header: { position: "absolute", top: 34, left: 48, right: 48, flexDirection: "row", justifyContent: "space-between" },
  micro: { fontSize: 6.6, letterSpacing: 1.45, fontWeight: 600, textTransform: "uppercase" },
  footer: { position: "absolute", bottom: 28, left: 48, right: 48, borderTopWidth: 0.5, borderTopColor: C.line, paddingTop: 9, flexDirection: "row", justifyContent: "space-between", color: C.muted, fontSize: 6.5 },
  coverTitle: { fontFamily: "TyashDisplay", fontSize: 62, lineHeight: 0.98, textTransform: "uppercase", marginTop: 20 },
  coverLabel: { fontSize: 8, letterSpacing: 2.2, color: C.accent, fontWeight: 600, marginTop: 24 },
  project: { fontSize: 17, lineHeight: 1.35, marginTop: 27, maxWidth: 435 },
  quote: { fontFamily: "TyashEditorial", fontStyle: "italic", color: C.accent, fontSize: 32, lineHeight: 1.15 },
  meta: { borderTopWidth: 0.7, borderTopColor: C.ink, paddingTop: 13, marginTop: 28, flexDirection: "row", gap: 32 },
  metaLabel: { fontSize: 6.5, letterSpacing: 1.3, color: C.muted, marginBottom: 6 },
  metaValue: { fontSize: 9, lineHeight: 1.4 },
  sectionHead: { borderBottomWidth: 0.8, borderBottomColor: C.ink, paddingBottom: 16, marginBottom: 24 },
  sectionIndex: { color: C.accent, fontSize: 8, letterSpacing: 2, fontWeight: 600, marginBottom: 11 },
  sectionTitle: { fontFamily: "TyashDisplay", fontSize: 35, lineHeight: 1.05, textTransform: "uppercase" },
  question: { fontSize: 10.5, fontWeight: 600, lineHeight: 1.5, marginBottom: 8 },
  answer: { fontSize: 10.3, lineHeight: 1.65, color: C.body, orphans: 3, widows: 3 },
  answerBlock: { marginBottom: 22, paddingBottom: 18, borderBottomWidth: 0.5, borderBottomColor: C.line },
  unanswered: { fontFamily: "TyashEditorial", fontStyle: "italic", fontSize: 14, color: C.muted },
  metric: { fontFamily: "TyashDisplay", fontSize: 48, color: C.accent, lineHeight: 1 },
  conclusionRow: { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 0.5, borderBottomColor: C.line, paddingVertical: 13 },
});

function PaperGrid() {
  return <Svg fixed width={596} height={842} style={{ position: "absolute", top: 0, left: 0 }}>
    {Array.from({ length: 27 }, (_, i) => <Line key={`v${i}`} x1={i * 23} y1={0} x2={i * 23} y2={842} stroke={C.grid} strokeWidth={0.35} opacity={0.5} />)}
    {Array.from({ length: 38 }, (_, i) => <Line key={`h${i}`} x1={0} y1={i * 23} x2={596} y2={i * 23} stroke={C.grid} strokeWidth={0.35} opacity={0.5} />)}
  </Svg>;
}

function Furniture({ shareData }: { shareData: ModuleShareData }) {
  return <>
    <PaperGrid />
    <View fixed style={S.header}><Text style={S.micro}>BRAND STUDIO × TYASH</Text><Text style={[S.micro, { color: C.accent }]}>CARNET DE PROJET</Text></View>
    <View fixed style={S.footer}><Text style={{ maxWidth: 410 }}>{notebookText(shareData.brandName)}  /  {notebookText(shareData.moduleTitle)}</Text><Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} /></View>
  </>;
}

function Spectrum({ answer }: { answer: NotebookAnswer }) {
  const spectrum = answer.spectrum!;
  const x = 12 + (spectrum.score ?? 50) / 100 * 470;
  return <View wrap={false} style={{ marginTop: 3, width: "100%" }}>
    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 9 }}><Text style={{ fontSize: 9, maxWidth: 225 }}>{spectrum.left}</Text><Text style={{ fontSize: 9, maxWidth: 225, textAlign: "right" }}>{spectrum.right}</Text></View>
    <Svg width="100%" height={31} viewBox="0 0 500 31">
      <Line x1={12} y1={12} x2={482} y2={12} stroke={C.line} strokeWidth={2} />
      {[0, 25, 50, 75, 100].map(n => <Line key={n} x1={12 + n * 4.7} y1={8} x2={12 + n * 4.7} y2={16} stroke={C.muted} strokeWidth={0.6} />)}
      {spectrum.score !== null && <><Line x1={12} y1={12} x2={x} y2={12} stroke={C.accent} strokeWidth={2} /><Circle cx={x} cy={12} r={4.5} fill={C.accent} /></>}
    </Svg>
    <Text style={{ fontSize: 8, color: spectrum.score === null ? C.muted : C.accent }}>{spectrum.score === null ? "Non renseigné" : `Position choisie : ${spectrum.score}/100`}</Text>
  </View>;
}

function Answer({ answer }: { answer: NotebookAnswer }) {
  return <View style={S.answerBlock} wrap={!answer.spectrum}>
    <Text style={S.question} minPresenceAhead={answer.spectrum ? 0 : 36}>{answer.question}</Text>
    {answer.spectrum ? <Spectrum answer={answer} /> : !answer.answered ? <Text style={S.unanswered}>Non renseigné</Text> : answer.table ? <View>{answer.table.rows.map((row, i) => <View key={i} style={{ marginBottom: 12 }}>{row.map((cell, j) => <Text key={j} style={S.answer}>{notebookText(answer.table!.columns[j])} : {notebookText(cell) || "Non renseigné"}</Text>)}</View>)}</View> : <Text style={S.answer}>{answer.value}</Text>}
  </View>;
}

export function TyashModuleNotebook({ module, summary, shareData }: { module: WorkspaceModule; summary: ModuleSummaryCard; shareData: ModuleShareData }) {
  const data = buildTyashNotebookData(module, summary);
  const date = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric", timeZone: "Europe/Paris" }).format(new Date(shareData.completedAt));
  const title = notebookText(shareData.moduleTitle);
  return <Document title={`Carnet de projet — ${title} — ${notebookText(shareData.brandName)}`} author="Brand Studio × TYASH" subject="Réponses personnelles au module" language="fr-FR">
    <Page size="A4" style={S.page}>
      <Furniture shareData={shareData} />
      <Text style={S.coverLabel}>CARNET DE PROJET</Text>
      <Text style={[S.coverTitle, { fontSize: title.length > 100 ? 30 : title.length > 55 ? 38 : title.length > 35 ? 46 : 62 }]}>{title}</Text>
      <Text style={S.project}>{notebookText(shareData.brandName)}</Text>
      <View style={{ marginTop: 36 }}><Text style={S.quote}>Ce qui te rend unique</Text><Text style={S.quote}>mérite d’être remarqué.</Text></View>
      <Svg width={500} height={48} style={{ marginTop: 26 }} viewBox="0 0 500 48"><Path d="M 0 27 C 75 18, 110 38, 190 24 S 290 14, 345 28 S 415 31, 453 20 S 487 20, 478 29 S 448 22, 470 18 S 490 17, 500 17" stroke={C.accent} strokeWidth={1.6} fill="none" /></Svg>
      <View style={S.meta}><View><Text style={S.metaLabel}>PROJET</Text><Text style={[S.metaValue, { maxWidth: 230 }]}>{notebookText(shareData.brandName)}</Text></View><View><Text style={S.metaLabel}>GÉNÉRÉ LE</Text><Text style={S.metaValue}>{date}</Text></View><View><Text style={S.metaLabel}>MODULE</Text><Text style={S.metaValue}>{String(module.position).padStart(2, "0")}</Text></View></View>
      <View style={{ marginTop: 36, borderLeftWidth: 1.5, borderLeftColor: C.accent, paddingLeft: 13 }}><Text style={[S.micro, { color: C.accent, marginBottom: 8 }]}>UN POINT DE DÉPART, À TON IMAGE</Text><Text style={[S.answer, { maxWidth: 410 }]}>Ce carnet rassemble les réponses renseignées dans ce module. Les éléments encore ouverts restent signalés, pour y revenir au fil du projet.</Text></View>
    </Page>
    <Page size="A4" style={S.page} wrap>
      <Furniture shareData={shareData} />
      {data.sections.map((section, index) => <View key={section.id} style={{ marginBottom: 28 }}>
      <View style={S.sectionHead} minPresenceAhead={80}><Text style={S.sectionIndex}>{String(index + 1).padStart(2, "0")} / {String(data.sections.length).padStart(2, "0")} — {title}</Text><Text style={S.sectionTitle}>{section.title}</Text></View>
      {section.answers.length ? section.answers.map(answer => <Answer key={answer.id} answer={answer} />) : <Text style={S.unanswered}>Aucun exercice à renseigner dans cette étape.</Text>}
      </View>)}
    </Page>
    <Page size="A4" style={S.page}>
      <Furniture shareData={shareData} />
      <Text style={S.sectionIndex}>LE POINT SUR CE MODULE</Text><Text style={S.sectionTitle}>LE BILAN DU MODULE.</Text>
      <Text style={[S.quote, { marginTop: 9, marginBottom: 28 }]}>À relire, à compléter, à partager.</Text>
      <View style={{ flexDirection: "row", gap: 32, borderTopWidth: 0.7, borderTopColor: C.ink, borderBottomWidth: 0.7, borderBottomColor: C.ink, paddingVertical: 19, marginBottom: 21 }}>
        <View><Text style={S.metric}>{data.answered}/{data.total}</Text><Text style={[S.micro, { marginTop: 8 }]}>RÉPONSES RENSEIGNÉES</Text></View><View><Text style={S.metric}>{data.total - data.answered}</Text><Text style={[S.micro, { marginTop: 8 }]}>À COMPLÉTER</Text></View><View><Text style={S.metric}>{data.sliders}</Text><Text style={[S.micro, { marginTop: 8 }]}>CURSEURS POSITIONNÉS</Text></View>
      </View>
      {data.sections.map((section, i) => <View key={section.id} style={S.conclusionRow} wrap={false}><Text style={{ fontSize: 9, maxWidth: 350 }}>{String(i + 1).padStart(2, "0")}  {section.title}</Text><Text style={{ fontSize: 8.5, color: C.muted }}>{section.answered} / {section.answers.length}</Text></View>)}
      <Text style={[S.answer, { marginTop: 23 }]}>Ce bilan décrit uniquement les informations renseignées. Il ne constitue ni une recommandation ni une validation stratégique.</Text>
      <View style={{ marginTop: 34 }}><Text style={S.quote}>Ce qui te rend unique</Text><Text style={S.quote}>mérite d’être remarqué.</Text></View>
    </Page>
  </Document>;
}
