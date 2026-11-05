import { Document, Font, Image, Page, Svg, Line, Circle, Path, StyleSheet, Text, View } from "@react-pdf/renderer";
import path from "node:path";
import type { GeneratedBrandGuide } from "./brand-guide";
import type { BrandGuideData } from "./brand-guide-pdf-data";
import type { WorkspaceModule } from "./training-types";
import { buildBrandStudioNotebookData } from "./brand-studio-notebook-data";
import { notebookText, type NotebookAnswer } from "./tyash-module-notebook-data";

// Brand Studio owns its configuration. TYASH's generator and configuration are
// intentionally untouched; both documents reuse the exact existing font files.
export const BRAND_STUDIO_NOTEBOOK = {
  name: "BRAND STUDIO", title: "TON CARNET DE PROJET",
  paper: "#F4F0DF", grid: "#E5DFC9", ink: "#111110", accent: "#991D25",
  body: "#34332D", muted: "#746F62", line: "#C9C2AF",
};
const C = BRAND_STUDIO_NOTEBOOK;
const font = (name: string) => path.join(process.cwd(), "public", "fonts", name);
Font.register({ family: "BrandStudioNotebookDisplay", src: font("tyash-archivo-display.ttf") });
Font.register({ family: "BrandStudioNotebookEditorial", src: font("tyash-instrument-serif-italic.ttf"), fontStyle: "italic" });
Font.register({ family: "BrandStudioNotebookBody", fonts: [
  { src: font("inter-400.woff"), fontWeight: 400 }, { src: font("inter-600.woff"), fontWeight: 600 },
] });
const S = StyleSheet.create({
  page: { backgroundColor: C.paper, color: C.ink, fontFamily: "BrandStudioNotebookBody", fontSize: 10, paddingTop: 78, paddingHorizontal: 48, paddingBottom: 68 },
  header: { position: "absolute", top: 34, left: 48, right: 48, flexDirection: "row", justifyContent: "space-between" },
  micro: { fontSize: 6.6, fontWeight: 600, letterSpacing: 1.45, textTransform: "uppercase" },
  footer: { position: "absolute", bottom: 28, left: 48, right: 48, borderTopWidth: 0.5, borderTopColor: C.line, paddingTop: 9, flexDirection: "row", justifyContent: "space-between", color: C.muted, fontSize: 6.5 },
  title: { fontFamily: "BrandStudioNotebookDisplay", fontSize: 60, lineHeight: 0.98, textTransform: "uppercase", marginTop: 20 },
  heading: { fontFamily: "BrandStudioNotebookDisplay", fontSize: 35, lineHeight: 1.05, textTransform: "uppercase" },
  quote: { fontFamily: "BrandStudioNotebookEditorial", fontStyle: "italic", fontSize: 32, lineHeight: 1.15, color: C.accent },
  body: { fontSize: 10.3, lineHeight: 1.65, color: C.body, orphans: 3, widows: 3 },
  question: { fontSize: 10.5, fontWeight: 600, lineHeight: 1.5, marginBottom: 8 },
  label: { fontSize: 8, letterSpacing: 2, color: C.accent, fontWeight: 600 },
  answer: { marginBottom: 22, paddingBottom: 18, borderBottomWidth: 0.5, borderBottomColor: C.line },
  section: { paddingBottom: 16, marginBottom: 24, borderBottomWidth: 0.8, borderBottomColor: C.ink },
  missing: { fontFamily: "BrandStudioNotebookEditorial", fontStyle: "italic", color: C.muted, fontSize: 14 },
});
const hyphenation = (word: string) => word.length > 35 ? word.match(/.{1,18}/gu) ?? [word] : [word];
const textProps = { hyphenationCallback: hyphenation };

function Furniture({ name, section }: { name: string; section: string }) {
  const footerLabel = (value: string, limit: number) => value.length > limit ? `${value.slice(0, limit - 1)}…` : value;
  return <>
    <Svg fixed width={596} height={842} style={{ position: "absolute", left: 0, top: 0 }}>
      {Array.from({ length: 27 }, (_, i) => <Line key={`v${i}`} x1={i * 23} y1={0} x2={i * 23} y2={842} stroke={C.grid} strokeWidth={0.35} opacity={0.5} />)}
      {Array.from({ length: 38 }, (_, i) => <Line key={`h${i}`} x1={0} y1={i * 23} x2={596} y2={i * 23} stroke={C.grid} strokeWidth={0.35} opacity={0.5} />)}
    </Svg>
    <View fixed style={S.header}><Text style={S.micro}>{C.name}</Text><Text style={[S.micro, { color: C.accent }]}>CARNET DE PROJET</Text></View>
    <View fixed style={S.footer}>
      <Text {...textProps} style={{ maxWidth: 405 }}>{footerLabel(notebookText(name), 44)} / {footerLabel(notebookText(section), 66)}</Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  </>;
}

function Flourish() {
  return <Svg width={499} height={48} style={{ marginTop: 24 }} viewBox="0 0 500 48"><Path d="M 0 27 C 75 18, 110 38, 190 24 S 290 14, 345 28 S 415 31, 453 20 S 487 20, 478 29 S 448 22, 470 18 S 490 17, 500 17" stroke={C.accent} strokeWidth={1.6} fill="none" /></Svg>;
}

function Spectrum({ answer }: { answer: NotebookAnswer }) {
  const spectrum = answer.spectrum!;
  const x = 12 + (spectrum.score ?? 50) * 4.7;
  return <View wrap={false}>
    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 9 }}>
      <Text {...textProps} style={{ maxWidth: 225, fontSize: 9 }}>{spectrum.left}</Text>
      <Text {...textProps} style={{ maxWidth: 225, fontSize: 9, textAlign: "right" }}>{spectrum.right}</Text>
    </View>
    <Svg width="100%" height={31} viewBox="0 0 500 31">
      <Line x1={12} y1={12} x2={482} y2={12} stroke={C.line} strokeWidth={2} />
      {[0, 25, 50, 75, 100].map(n => <Line key={n} x1={12 + n * 4.7} y1={8} x2={12 + n * 4.7} y2={16} stroke={C.muted} strokeWidth={0.6} />)}
      {spectrum.score !== null && <><Line x1={12} y1={12} x2={x} y2={12} stroke={C.accent} strokeWidth={2} /><Circle cx={x} cy={12} r={4.5} fill={C.accent} /></>}
    </Svg>
    <Text style={{ color: C.accent, fontSize: 8 }}>{spectrum.score === null ? "Non renseigné" : `Position choisie : ${spectrum.score}/100`}</Text>
  </View>;
}

function Answer({ answer }: { answer: NotebookAnswer }) {
  if (answer.spectrum) return <View style={S.answer}>
    <View wrap={false}><Text {...textProps} style={S.question}>{answer.question}</Text><Spectrum answer={answer} /></View>
    {answer.value ? <Text {...textProps} style={[S.body, { marginTop: 10 }]}>{answer.value}</Text> : null}
  </View>;
  const textLength = answer.value.length + (answer.table?.rows.flat().join("").length ?? 0);
  return <View style={S.answer} wrap={textLength > 1200}>
    <Text {...textProps} style={S.question} minPresenceAhead={36}>{answer.question}</Text>
    {!answer.answered ? <Text style={S.missing}>Non renseigné</Text> : answer.table ? <View>
      {answer.table.rows.map((row, index) => <View key={index} style={{ marginBottom: 12 }}>
        {row.map((cell, column) => <Text {...textProps} key={column} style={S.body}>{notebookText(answer.table!.columns[column])} : {notebookText(cell)}</Text>)}
      </View>)}
    </View> : <Text {...textProps} style={S.body}>{answer.value}</Text>}
  </View>;
}

export function BrandStudioNotebook({ guide, data, modules }: { guide: GeneratedBrandGuide; data: BrandGuideData; modules?: WorkspaceModule[] }) {
  const notebook = buildBrandStudioNotebookData(guide, data, modules);
  const groups: Array<{ scope: string; sections: Array<{ section: typeof notebook.sections[number]; index: number }> }> = [];
  notebook.sections.forEach((section, index) => {
    if (groups.at(-1)?.scope !== section.scope) groups.push({ scope: section.scope, sections: [] });
    groups.at(-1)!.sections.push({ section, index });
  });
  const name = notebookText(guide.brandName);
  const date = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric", timeZone: "Europe/Paris" }).format(new Date(guide.generatedAt));
  return <Document title={`Carnet de projet — ${name}`} author="Brand Studio" subject="Réponses et éléments stratégiques du projet" language="fr-FR">
    <Page size="A4" style={S.page}>
      <Furniture name={name} section="Carnet de projet" />
      <Text style={[S.label, { marginTop: 24 }]}>BRAND STUDIO — CARNET DE PROJET</Text>
      <Text style={S.title}>TON CARNET{"\n"}DE PROJET</Text>
      <Text {...textProps} style={{ fontSize: 17, lineHeight: 1.35, marginTop: 27 }}>{name}</Text>
      <View style={{ marginTop: 36 }}><Text style={S.quote}>Ce qui te rend unique</Text><Text style={S.quote}>mérite d’être remarqué.</Text></View>
      <Flourish />
      <View style={{ marginTop: 28, paddingTop: 13, borderTopWidth: 0.7, borderTopColor: C.ink, flexDirection: "row", gap: 24 }}>
        {[["PROJET", name], ["GÉNÉRÉ LE", date], ["PÉRIMÈTRE", modules?.length ? `${modules.length} modules` : "Synthèse stratégique"]].map(([label, value]) => <View key={label} style={{ flex: 1 }}>
          <Text style={[S.micro, { color: C.muted, marginBottom: 6 }]}>{label}</Text><Text {...textProps} style={{ fontSize: 9, lineHeight: 1.4 }}>{value}</Text>
        </View>)}
      </View>
    </Page>

    {groups.map((group, groupIndex) => <Page key={groupIndex} size="A4" style={S.page} wrap>
      <Furniture name={name} section={group.scope} />
      {group.sections.map(({ section, index }) => <View key={section.id} style={{ marginBottom: 28 }}>
      <View wrap={(section.answers[0]?.value.length ?? 0) > 1200}>
      <View style={S.section} wrap={false} minPresenceAhead={section.answers[0]?.spectrum ? 145 : 90}>
        <Text {...textProps} style={[S.label, { marginBottom: 11 }]}>{String(index + 1).padStart(2, "0")} — {section.scope}</Text>
        <Text {...textProps} style={[S.heading, { fontSize: section.title.length > 48 ? 28 : 35 }]}>{section.title}</Text>
      </View>
      {section.answers[0] ? <Answer answer={section.answers[0]} /> : null}
      </View>
      {section.answers.slice(1).map(answer => <Answer key={answer.id} answer={answer} />)}
      {section.id === "visual" ? <View>{data.palette.map(color => <View wrap={false} key={color.id} style={{ flexDirection: "row", gap: 14, marginBottom: 18 }}>
        <View style={{ width: 42, height: 42, backgroundColor: color.hex, borderWidth: 0.5, borderColor: C.line }} />
        <View style={{ flex: 1 }}><Text style={S.question}>{color.name} — {color.hex}</Text><Text {...textProps} style={S.body}>{color.usage}</Text></View>
      </View>)}</View> : null}
      {section.id === "moodboard" ? data.moodboard.map(item => <View key={item.id} style={{ marginBottom: 22 }}>
        {item.imageUrl ? <View wrap={false}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={item.imageUrl} style={{ width: "100%", height: 220, objectFit: "contain" }} />
        </View> : item.type === "color" ? <View style={{ height: 54, backgroundColor: item.color }} /> : null}
        <Text {...textProps} style={S.question}>{notebookText(item.label)}</Text>
        {item.description ? <Text {...textProps} style={S.body}>{notebookText(item.description)}</Text> : null}
      </View>) : null}
      </View>)}
    </Page>)}

    <Page size="A4" style={S.page} wrap>
      <Furniture name={name} section="Bilan du projet" />
      <Text style={[S.label, { marginBottom: 16 }]}>LE POINT SUR VOTRE PARCOURS</Text>
      <Text style={S.heading}>LE BILAN DE TON PROJET</Text>
      <Text style={[S.quote, { marginTop: 24 }]}>À relire, à compléter, à faire évoluer.</Text>
      {notebook.hasQuestionnaire ? <>
        <View style={{ flexDirection: "row", gap: 32, marginTop: 34, marginBottom: 24 }}>
          {[[notebook.answered, "RÉPONSES RENSEIGNÉES"], [notebook.total - notebook.answered, "ÉLÉMENTS À COMPLÉTER"]].map(([count, label]) => <View key={label} style={{ flex: 1 }}>
            <Text style={{ fontFamily: "BrandStudioNotebookDisplay", fontSize: 48, color: C.accent }}>{count}</Text><Text style={S.micro}>{label}</Text>
          </View>)}
        </View>
        {notebook.progress.map(module => <View wrap={false} key={module.id} style={{ paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: C.line }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 20 }}><Text {...textProps} style={[S.question, { flex: 1 }]}>{module.title}</Text><Text style={{ fontSize: 9 }}>{module.answered} / {module.total}</Text></View>
          <View style={{ height: 3, backgroundColor: C.grid, marginTop: 6 }}><View style={{ height: 3, width: `${Math.max(0, Math.min(module.completionPercent, 100))}%`, backgroundColor: C.accent }} /></View>
        </View>)}
      </> : <Text style={[S.body, { marginTop: 30 }]}>Les données de progression ne sont pas disponibles dans cet export. Aucun nombre de réponses n’est estimé.</Text>}
      <View style={{ marginTop: 36 }}><Text style={S.quote}>Ce qui te rend unique</Text><Text style={S.quote}>mérite d’être remarqué.</Text></View>
    </Page>
  </Document>;
}
