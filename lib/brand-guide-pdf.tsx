import { Document, Font, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { GeneratedBrandGuide, GuideMoodboardItem } from "./brand-guide";
import { createBrandGuideData, type BrandGuideData, type PdfField } from "./brand-guide-pdf-data";

Font.registerHyphenationCallback((word) => [word]);

const BRAND = {
  ink: "#29242C",
  text: "#544B45",
  muted: "#81756B",
  paper: "#FAF6EF",
  white: "#FFFFFF",
  line: "#DDD2C4",
  orange: "#CF7430",
  peach: "#EDC8AA",
  butter: "#F1CC56",
};

const S = StyleSheet.create({
  page: { backgroundColor: BRAND.paper, color: BRAND.ink, fontFamily: "Helvetica", paddingTop: 58, paddingRight: 52, paddingBottom: 52, paddingLeft: 52 },
  cover: { padding: 0, backgroundColor: BRAND.paper },
  coverTop: { paddingTop: 48, paddingHorizontal: 52 },
  brandMark: { fontSize: 9, fontWeight: 700, letterSpacing: 3.2, color: BRAND.ink },
  coverRule: { height: 1, backgroundColor: BRAND.line, marginTop: 18 },
  coverBody: { flexGrow: 1, paddingHorizontal: 52, paddingTop: 66, position: "relative" },
  coverKicker: { color: BRAND.orange, fontSize: 10, fontWeight: 700, letterSpacing: 2.4, marginBottom: 22 },
  coverTitle: { fontWeight: 700, color: BRAND.ink, lineHeight: 0.96, maxWidth: 450 },
  coverBaseline: { color: BRAND.text, fontSize: 17, lineHeight: 1.35, marginTop: 24, maxWidth: 390 },
  coverShape: { position: "absolute", right: 0, bottom: 0, width: 185, height: 250, backgroundColor: BRAND.peach, borderTopLeftRadius: 96 },
  coverCircle: { position: "absolute", right: 82, bottom: 64, width: 92, height: 92, borderRadius: 46, backgroundColor: BRAND.butter },
  coverImage: { position: "absolute", right: 42, top: 52, width: 190, height: 225, objectFit: "cover", borderRadius: 4 },
  coverPalette: { position: "absolute", right: 52, bottom: 40, flexDirection: "row", gap: 6 },
  coverSwatch: { width: 28, height: 28, borderRadius: 14 },
  coverFooter: { height: 64, paddingHorizontal: 52, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTop: `1 solid ${BRAND.line}` },
  small: { color: BRAND.muted, fontSize: 8.5, letterSpacing: 0.4 },
  header: { position: "absolute", top: 24, left: 52, right: 52, flexDirection: "row", justifyContent: "space-between", borderBottom: `1 solid ${BRAND.line}`, paddingBottom: 9 },
  headerText: { color: BRAND.muted, fontSize: 7.5, letterSpacing: 1.1, textTransform: "uppercase" },
  footer: { position: "absolute", bottom: 22, left: 52, right: 52, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  footerText: { color: BRAND.muted, fontSize: 7.5, letterSpacing: 0.7 },
  pageNumber: { color: BRAND.orange, fontSize: 8, fontWeight: 700 },
  chapterNo: { color: BRAND.orange, fontSize: 9, fontWeight: 700, letterSpacing: 2.2, marginBottom: 10 },
  chapterTitle: { color: BRAND.ink, fontSize: 31, lineHeight: 1.05, marginBottom: 24 },
  intro: { color: BRAND.text, fontSize: 12, lineHeight: 1.55, maxWidth: 420, marginBottom: 22 },
  tocTitle: { fontSize: 34, color: BRAND.ink, marginBottom: 34 },
  tocRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  tocNo: { width: 34, color: BRAND.orange, fontSize: 9, fontWeight: 700 },
  tocName: { color: BRAND.ink, fontSize: 14 },
  tocDots: { flexGrow: 1, marginHorizontal: 10, borderBottom: `1 dotted ${BRAND.line}` },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  column: { width: "48%" },
  field: { borderTop: `1 solid ${BRAND.line}`, paddingTop: 11, marginBottom: 18 },
  fieldLabel: { color: BRAND.orange, fontSize: 7.5, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 7 },
  body: { color: BRAND.text, fontSize: 10.5, lineHeight: 1.55 },
  statement: { backgroundColor: BRAND.white, borderLeft: `4 solid ${BRAND.orange}`, padding: 22, marginBottom: 18 },
  statementText: { color: BRAND.ink, fontSize: 17, lineHeight: 1.35 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  pill: { border: `1 solid ${BRAND.line}`, borderRadius: 14, paddingVertical: 7, paddingHorizontal: 11 },
  pillText: { color: BRAND.text, fontSize: 9 },
  languageColumn: { width: "48%", padding: 18, backgroundColor: BRAND.white, borderRadius: 5 },
  languageAvoid: { backgroundColor: "#F4EEE8" },
  languageItem: { flexDirection: "row", gap: 8, marginBottom: 9 },
  languageSymbol: { color: BRAND.orange, fontSize: 10, width: 12 },
  quote: { paddingVertical: 34, paddingHorizontal: 30, borderTop: `1 solid ${BRAND.line}`, borderBottom: `1 solid ${BRAND.line}` },
  quoteText: { color: BRAND.ink, fontSize: 22, lineHeight: 1.3, textAlign: "center" },
  paletteRow: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  colorCard: { width: "31%", backgroundColor: BRAND.white, borderRadius: 4, overflow: "hidden", marginBottom: 6 },
  colorSwatch: { height: 92 },
  colorBody: { padding: 12 },
  colorName: { fontSize: 11, color: BRAND.ink, fontWeight: 700, marginBottom: 5 },
  colorMeta: { fontSize: 8.5, color: BRAND.muted, lineHeight: 1.45 },
  moodboard: { height: 430, position: "relative", overflow: "hidden", borderRadius: 5 },
  moodItem: { position: "absolute", overflow: "hidden", borderRadius: 4, backgroundColor: BRAND.white },
  moodImage: { width: "100%", height: "100%", objectFit: "cover" },
  moodText: { width: "100%", height: "100%", justifyContent: "center", alignItems: "center", padding: 10 },
  moodLabel: { fontSize: 10, fontWeight: 700, textAlign: "center" },
  checklist: { width: "48%", backgroundColor: BRAND.white, borderRadius: 5, padding: 16 },
  checkRow: { flexDirection: "row", gap: 9, marginBottom: 9 },
  checkBox: { width: 10, height: 10, border: `1 solid ${BRAND.orange}`, marginTop: 2 },
  summaryHero: { backgroundColor: BRAND.ink, color: BRAND.white, padding: 26, borderRadius: 5, marginBottom: 18 },
  summaryName: { fontSize: 26, marginBottom: 7 },
  summaryBaseline: { fontSize: 12, color: BRAND.peach, lineHeight: 1.4 },
});

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(value));
}

function titleSize(name: string) {
  if (name.length > 48) return 30;
  if (name.length > 32) return 36;
  if (name.length > 20) return 43;
  return 52;
}

function PageChrome({ data, chapter }: { data: BrandGuideData; chapter: string }) {
  return <>
    <View fixed style={S.header}><Text style={S.headerText}>{data.brandName}</Text><Text style={S.headerText}>{chapter}</Text></View>
    <View fixed style={S.footer}><Text style={S.footerText}>Guide de Marque · Brand Studio</Text><Text style={S.pageNumber} render={({ pageNumber }) => String(pageNumber).padStart(2, "0")} /></View>
  </>;
}

function ChapterHeading({ number, title, intro }: { number: string; title: string; intro?: string }) {
  return <View wrap={false}><Text style={S.chapterNo}>{number}</Text><Text style={S.chapterTitle}>{title}</Text>{intro ? <Text style={S.intro}>{intro}</Text> : null}</View>;
}

function Field({ item, statement = false }: { item: PdfField; statement?: boolean }) {
  if (statement) return <View wrap={false} style={S.statement}><Text style={S.fieldLabel}>{item.label}</Text><Text style={S.statementText}>{item.value}</Text></View>;
  return <View wrap={false} style={S.field}><Text style={S.fieldLabel}>{item.label}</Text><Text style={S.body}>{item.value}</Text></View>;
}

function FieldsPage({ data, chapter, number, fields, intro }: { data: BrandGuideData; chapter: string; number: string; fields: PdfField[]; intro?: string }) {
  return <Page size="A4" style={S.page} wrap><PageChrome data={data} chapter={chapter}/><ChapterHeading number={number} title={chapter} intro={intro}/><View style={S.grid}>{fields.map((item, index) => <View key={`${item.label}-${index}`} style={S.column}><Field item={item}/></View>)}</View></Page>;
}

function contrastFor(hex: string) {
  const value = hex.replace("#", "");
  const channels = [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16));
  const luminance = (channels[0] * 299 + channels[1] * 587 + channels[2] * 114) / 1000;
  return luminance > 145 ? "Texte sombre conseillé" : "Texte clair conseillé";
}

function PalettePage({ data, number }: { data: BrandGuideData; number: string }) {
  return <Page size="A4" style={S.page}><PageChrome data={data} chapter="Univers visuel"/><ChapterHeading number={number} title="Univers visuel" intro={data.ambiance}/><View style={S.paletteRow}>{data.palette.map((color) => <View wrap={false} key={color.id} style={S.colorCard}><View style={[S.colorSwatch, { backgroundColor: color.hex }]}/><View style={S.colorBody}><Text style={S.colorName}>{color.name}</Text><Text style={S.colorMeta}>{color.hex} · {color.role === "primary" ? "Principale" : "Secondaire"}</Text>{color.usage ? <Text style={S.colorMeta}>{color.usage}</Text> : null}<Text style={S.colorMeta}>{contrastFor(color.hex)}</Text></View></View>)}</View></Page>;
}

function MoodboardItem({ item }: { item: GuideMoodboardItem }) {
  const style = { left: `${item.x}%`, top: `${item.y}%`, width: `${item.width}%`, height: `${item.height}%`, transform: `rotate(${item.rotation}deg)`, backgroundColor: item.type === "color" ? item.color : BRAND.white };
  return <View style={[S.moodItem, style]}>{item.imageUrl && (item.type === "image" || item.type === "icon") ? (
    // eslint-disable-next-line jsx-a11y/alt-text -- React PDF Image has no alt prop.
    <Image src={item.imageUrl} style={S.moodImage}/>
  ) : <View style={S.moodText}><Text style={[S.moodLabel, { color: item.type === "color" ? BRAND.white : item.textColor || BRAND.ink, fontSize: Math.min(item.fontSize || 10, 22) }]}>{item.label}</Text></View>}</View>;
}

function MoodboardPage({ data, number }: { data: BrandGuideData; number: string }) {
  return <Page size="A4" orientation="landscape" style={S.page}><PageChrome data={data} chapter="Moodboard"/><ChapterHeading number={number} title="Planche d’inspiration"/><View style={[S.moodboard, { backgroundColor: data.moodboardBackground }]}>{data.moodboard.slice().sort((a,b) => a.zIndex - b.zIndex).map((item) => <MoodboardItem key={item.id} item={item}/>)}</View></Page>;
}

function BrandGuideDocument({ data }: { data: BrandGuideData }) {
  const coverImage = data.moodboard.find((item) => item.type === "image" && item.imageUrl)?.imageUrl;
  const palette = data.palette.slice(0, 5);
  const chapterNo = (id: string) => data.chapters.find((chapter) => chapter.id === id)?.number || "";
  return <Document title={`Guide de marque — ${data.brandName}`} author="Brand Studio" subject={`Guide de marque de ${data.brandName}`} language="fr-FR">
    <Page size="A4" style={[S.cover]}>
      <View style={S.coverTop}><Text style={S.brandMark}>BRAND STUDIO</Text><View style={S.coverRule}/></View>
      <View style={S.coverBody}><Text style={S.coverKicker}>GUIDE DE MARQUE</Text><Text style={[S.coverTitle, { fontSize: titleSize(data.brandName) }]}>{data.brandName}</Text>{data.baseline ? <Text style={S.coverBaseline}>{data.baseline}</Text> : null}<View style={S.coverShape}/><View style={S.coverCircle}/>{coverImage ? (
        // eslint-disable-next-line jsx-a11y/alt-text -- React PDF Image has no alt prop.
        <Image src={coverImage} style={S.coverImage}/>
      ) : null}<View style={S.coverPalette}>{palette.map((color) => <View key={color.id} style={[S.coverSwatch, { backgroundColor: color.hex }]}/>)}</View></View>
      <View style={S.coverFooter}><Text style={S.small}>{formatDate(data.generatedAt)}</Text><Text style={S.small}>Créé avec Brand Studio</Text></View>
    </Page>
    <Page size="A4" style={S.page}><PageChrome data={data} chapter="Sommaire"/><Text style={S.tocTitle}>Sommaire</Text>{data.chapters.map((chapter) => <View key={chapter.id} style={S.tocRow}><Text style={S.tocNo}>{chapter.number}</Text><Text style={S.tocName}>{chapter.title}</Text><View style={S.tocDots}/></View>)}</Page>
    {data.foundations.length ? <FieldsPage data={data} chapter="Fondations" number={chapterNo("foundations")} fields={data.foundations} intro="Les repères essentiels qui donnent du sens et une direction durable à la marque."/> : null}
    {data.positioning.length ? <Page size="A4" style={S.page}><PageChrome data={data} chapter="Positionnement"/><ChapterHeading number={chapterNo("positioning")} title="Positionnement" intro="La place que la marque choisit d’occuper dans l’esprit de ses clients."/>{data.positioning.map((item, index) => <Field key={item.label} item={item} statement={index === data.positioning.length - 1}/>)}</Page> : null}
    {data.personality.length ? <FieldsPage data={data} chapter="Personnalité" number={chapterNo("personality")} fields={data.personality} intro="Une fiche d’identité pour maintenir une présence cohérente, reconnaissable et humaine."/> : null}
    {(data.language.use.length || data.language.avoid.length) ? <Page size="A4" style={S.page}><PageChrome data={data} chapter="Langage"/><ChapterHeading number={chapterNo("language")} title="Langage" intro="Des repères simples pour écrire avec la bonne tonalité."/><View style={S.grid}><View style={S.languageColumn}><Text style={S.fieldLabel}>Mots à utiliser</Text>{data.language.use.map((word) => <View key={word} style={S.languageItem}><Text style={S.languageSymbol}>+</Text><Text style={S.body}>{word}</Text></View>)}</View><View style={[S.languageColumn, S.languageAvoid]}><Text style={S.fieldLabel}>Mots à éviter</Text>{data.language.avoid.map((word) => <View key={word} style={S.languageItem}><Text style={S.languageSymbol}>−</Text><Text style={S.body}>{word}</Text></View>)}</View></View></Page> : null}
    {data.messages.length ? <Page size="A4" style={S.page}><PageChrome data={data} chapter="Messages"/><ChapterHeading number={chapterNo("messages")} title="Messages" intro="Les formulations centrales à préserver sur tous les points de contact."/>{data.messages.map((item, index) => index === 0 ? <View key={item.label} style={S.quote}><Text style={S.fieldLabel}>{item.label}</Text><Text style={S.quoteText}>{item.value}</Text></View> : <Field key={item.label} item={item} statement/>)}</Page> : null}
    {data.palette.length || data.ambiance ? <PalettePage data={data} number={chapterNo("visual")}/> : null}
    {data.moodboard.length ? <MoodboardPage data={data} number={chapterNo("moodboard")}/> : null}
    {data.summary.length ? <Page size="A4" style={S.page}><PageChrome data={data} chapter="Synthèse"/><ChapterHeading number={chapterNo("summary")} title="Ta marque en un coup d’œil"/><View style={S.summaryHero}><Text style={S.summaryName}>{data.brandName}</Text>{data.baseline ? <Text style={S.summaryBaseline}>{data.baseline}</Text> : null}</View><View style={S.grid}>{data.summary.map((item) => <View key={item.label} style={S.column}><Field item={item}/></View>)}</View></Page> : null}
  </Document>;
}

async function preloadMoodboardImages(data: BrandGuideData) {
  const moodboard = await Promise.all(data.moodboard.map(async (item) => {
    if (!item.imageUrl || item.imageUrl.startsWith("data:")) return item;
    try {
      const response = await fetch(item.imageUrl, { signal: AbortSignal.timeout(8_000) });
      if (!response.ok) return { ...item, imageUrl: undefined };
      const type = response.headers.get("content-type") || "image/jpeg";
      const bytes = Buffer.from(await response.arrayBuffer());
      return { ...item, imageUrl: `data:${type};base64,${bytes.toString("base64")}` };
    } catch {
      return { ...item, imageUrl: undefined };
    }
  }));
  return { ...data, moodboard };
}

export async function renderBrandGuidePdf(guide: GeneratedBrandGuide) {
  const data = await preloadMoodboardImages(createBrandGuideData(guide));
  return renderToBuffer(<BrandGuideDocument data={data}/>);
}
