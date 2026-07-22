import { Document, Font, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import path from "node:path";
import type { GeneratedBrandGuide, GuideMoodboardItem } from "./brand-guide";
import { createBrandGuideData, validateBrandGuideData, type BrandGuideData, type BrandValueData, type PdfField } from "./brand-guide-pdf-data";
import { composeMoodboard, getAccessibleTextColor, selectCoverLayout, selectEditorialLayout } from "./brand-guide-editorial-layout";
import { brandGuidePdfTheme as THEME } from "./brand-guide-pdf-theme";

Font.registerHyphenationCallback((word) => [word]);
const fontFile = (name: string) => path.join(process.cwd(), "public", "fonts", name);
Font.register({ family: "Inter", fonts: [
  { src: fontFile("inter-400.woff"), fontWeight: 400 },
  { src: fontFile("inter-600.woff"), fontWeight: 600 },
] });
Font.register({ family: "Source Serif 4", fonts: [
  { src: fontFile("source-serif-4-400.woff"), fontWeight: 400 },
  { src: fontFile("source-serif-4-600.woff"), fontWeight: 600 },
] });

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
  page: { backgroundColor: THEME.colors.background, color: THEME.colors.text, fontFamily: "Inter", paddingTop: THEME.page.marginTop, paddingRight: THEME.page.marginRight, paddingBottom: THEME.page.marginBottom, paddingLeft: THEME.page.marginLeft },
  cover: { padding: 0, backgroundColor: BRAND.paper },
  coverTop: { paddingTop: 48, paddingHorizontal: 52 },
  brandMark: { fontSize: 9, fontWeight: 700, letterSpacing: 3.2, color: BRAND.ink },
  coverRule: { height: 1, backgroundColor: BRAND.line, marginTop: 18 },
  coverBody: { flexGrow: 1, paddingHorizontal: 52, paddingTop: 66, position: "relative" },
  coverKicker: { color: BRAND.orange, fontSize: 10, fontWeight: 700, letterSpacing: 2.4, marginBottom: 22 },
  coverTitle: { fontFamily: "Source Serif 4", fontWeight: 600, color: BRAND.ink, lineHeight: 1.02, maxWidth: 315 },
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
  chapterTitle: { ...THEME.typography.h1, color: BRAND.ink, marginBottom: 24 },
  intro: { color: BRAND.text, fontSize: 12, lineHeight: 1.55, maxWidth: 420, marginBottom: 22 },
  tocTitle: { fontSize: 34, color: BRAND.ink, marginBottom: 34 },
  tocRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  tocNo: { width: 34, color: BRAND.orange, fontSize: 9, fontWeight: 700 },
  tocName: { color: BRAND.ink, fontSize: 14 },
  tocPage: { width: 22, textAlign: "right", color: BRAND.muted, fontSize: 9 },
  tocDots: { flexGrow: 1, marginHorizontal: 10, borderBottom: `1 dotted ${BRAND.line}` },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  column: { width: "48%" },
  field: { borderTop: `1 solid ${BRAND.line}`, paddingTop: 11, marginBottom: 18 },
  fieldLabel: { color: BRAND.orange, fontSize: 7.5, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 7 },
  body: { color: BRAND.text, fontSize: 10.5, lineHeight: 1.55 },
  statement: { backgroundColor: BRAND.white, borderLeft: `4 solid ${BRAND.orange}`, padding: 22, marginBottom: 18 },
  statementText: { fontFamily: "Source Serif 4", color: BRAND.ink, fontSize: 19, lineHeight: 1.35 },
  valueCard: { width: "48%", borderTop: `3 solid ${BRAND.orange}`, paddingTop: 12, marginBottom: 18 },
  valueName: { color: BRAND.ink, fontSize: 16, fontWeight: 700, marginBottom: 10 },
  valueSection: { marginBottom: 8 },
  valueLabel: { color: BRAND.muted, fontSize: 7, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 3 },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  pill: { border: `1 solid ${BRAND.line}`, borderRadius: 14, paddingVertical: 7, paddingHorizontal: 11 },
  pillText: { color: BRAND.text, fontSize: 9 },
  languageColumn: { width: "48%", paddingTop: 16, borderTop: `3 solid ${BRAND.orange}` },
  languageAvoid: { borderTopColor: BRAND.ink },
  languageItem: { flexDirection: "row", gap: 8, marginBottom: 9 },
  languageSymbol: { color: BRAND.orange, fontSize: 10, width: 12 },
  quote: { paddingVertical: 34, paddingHorizontal: 30, borderTop: `1 solid ${BRAND.line}`, borderBottom: `1 solid ${BRAND.line}` },
  quoteText: { ...THEME.typography.quote, color: BRAND.ink, textAlign: "center" },
  lockup: { flexDirection: "row", alignItems: "center" },
  lockupLogoLarge: { width: 72, height: 54, objectFit: "contain", marginRight: 16 },
  lockupLogoMedium: { width: 44, height: 34, objectFit: "contain", marginRight: 11 },
  lockupLogoSmall: { width: 18, height: 14, objectFit: "contain", marginRight: 7 },
  lockupNameLarge: { fontFamily: "Source Serif 4", fontWeight: 600, lineHeight: 1.02, maxWidth: 300 },
  lockupNameMedium: { fontFamily: "Source Serif 4", fontSize: 25, fontWeight: 600 },
  lockupNameSmall: { fontFamily: "Inter", fontSize: 7.5, fontWeight: 600, letterSpacing: 0.5 },
  paletteRow: { flexDirection: "row", height: 225, marginTop: 12 },
  colorCard: { flexGrow: 1, minWidth: 82, overflow: "hidden" },
  colorSwatch: { height: 150 },
  colorBody: { paddingTop: 12, paddingRight: 8 },
  colorName: { fontSize: 11, color: BRAND.ink, fontWeight: 700, marginBottom: 5 },
  colorMeta: { fontSize: 8.5, color: BRAND.muted, lineHeight: 1.45 },
  moodboard: { height: 375, position: "relative", overflow: "hidden", borderRadius: 5 },
  moodItem: { position: "absolute", overflow: "hidden", borderRadius: 4, backgroundColor: BRAND.white },
  moodImage: { width: "100%", height: "100%", objectFit: "cover" },
  moodText: { width: "100%", height: "100%", justifyContent: "center", alignItems: "center", padding: 10 },
  moodLabel: { fontSize: 10, fontWeight: 700, textAlign: "center" },
  checklist: { width: "48%", backgroundColor: BRAND.white, borderRadius: 5, padding: 16 },
  checkRow: { flexDirection: "row", gap: 9, marginBottom: 9 },
  checkBox: { width: 10, height: 10, border: `1 solid ${BRAND.orange}`, marginTop: 2 },
  summaryHero: { borderTop: `4 solid ${BRAND.orange}`, paddingTop: 18, paddingBottom: 24, marginBottom: 18 },
  summaryName: { fontSize: 26, marginBottom: 7 },
  summaryBaseline: { fontSize: 12, color: BRAND.peach, lineHeight: 1.4 },
});

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(value));
}

export function getCoverTitleFontSize(name: string) {
  const longestWord = Math.max(...name.split(/\s+/).map((word) => word.length));
  if (name.length > 44 || longestWord > 18) return 30;
  if (name.length > 30 || longestWord > 14) return 34;
  if (name.length >= 20) return 40;
  return 48;
}

function PageChrome({ data, chapter }: { data: BrandGuideData; chapter: string }) {
  return <>
    <View fixed style={S.header}><PdfBrandLockup data={data} size="small"/><Text style={S.headerText}>{chapter}</Text></View>
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

function PdfBrandLockup({ data, size, showBaseline = false }: { data: BrandGuideData; size: "large" | "medium" | "small"; showBaseline?: boolean }) {
  const logoStyle = size === "large" ? S.lockupLogoLarge : size === "medium" ? S.lockupLogoMedium : S.lockupLogoSmall;
  const nameStyle = size === "large" ? [S.lockupNameLarge, { fontSize: getCoverTitleFontSize(data.brandName) }] : size === "medium" ? S.lockupNameMedium : S.lockupNameSmall;
  return <View style={S.lockup}>{data.logoUrl ? <Image src={data.logoUrl} style={logoStyle}/> : null}<View><Text style={nameStyle}>{data.brandName}</Text>{showBaseline && data.baseline ? <Text style={S.coverBaseline}>{data.baseline}</Text> : null}</View></View>;
}

function EditorialFields({ items }: { items: PdfField[] }) {
  const layout = selectEditorialLayout(items);
  if (layout === "manifesto") return <Field item={items[0]} statement/>;
  return <View style={S.grid}>{items.map((item, index) => <View key={item.label} wrap={false} style={layout === "profile" && index === 0 ? { width: "100%", marginBottom: 20 } : S.column}><Field item={item}/></View>)}</View>;
}

function FoundationStory({ items }: { items: PdfField[] }) {
  const mission = items.find((item) => item.label === "Mission");
  const supporting = items.filter((item) => item !== mission);
  return <View>{mission ? <View wrap={false} style={[S.quote, { marginBottom: 30 }]}><Text style={S.fieldLabel}>Mission</Text><Text style={[S.quoteText, { textAlign: "left" }]}>{mission.value}</Text></View> : null}<View style={S.grid}>{supporting.map((item) => <View key={item.label} style={S.column}><Field item={item}/></View>)}</View></View>;
}

function PdfBrandValue({ value }: { value: BrandValueData }) {
  const details = [
    ["Ce que cette valeur signifie", value.meaning],
    ["Dans la pratique", value.concreteApplication],
    ["Dans la communication", value.communicationExpression],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));
  return <View wrap={false} style={S.valueCard}><Text style={S.valueName}>{value.name}</Text>{details.map(([label, text]) => <View key={label} style={S.valueSection}><Text style={S.valueLabel}>{label}</Text><Text style={S.body}>{text}</Text></View>)}</View>;
}

function contrastFor(hex: string) {
  return getAccessibleTextColor(hex) === BRAND.ink ? "Texte sombre conseillé" : "Texte clair conseillé";
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
  const composition = composeMoodboard(data.moodboard);
  return <Page size="A4" orientation="landscape" style={S.page}><PageChrome data={data} chapter="Moodboard"/><ChapterHeading number={number} title="Planche d’inspiration"/><View style={[S.moodboard, { backgroundColor: data.moodboardBackground }]}>{composition.map((item) => <MoodboardItem key={item.id} item={item}/>)}</View></Page>;
}

function BrandGuideDocument({ data }: { data: BrandGuideData }) {
  const palette = data.palette.slice(0, 5);
  const coverLayout = selectCoverLayout(data);
  const coverImage = coverLayout === "logo-image" ? data.moodboard.find((item) => item.type === "image" && item.imageUrl)?.imageUrl : undefined;
  const chapterNo = (id: string) => data.chapters.find((chapter) => chapter.id === id)?.number || "";
  return <Document title={`Guide de marque — ${data.brandName}`} author="Brand Studio" subject={`Guide de marque de ${data.brandName}`} language="fr-FR">
    <Page size="A4" style={[S.cover]}>
      <View style={S.coverTop}><Text style={S.brandMark}>BRAND STUDIO</Text><View style={S.coverRule}/></View>
      <View style={S.coverBody}><Text style={S.coverKicker}>GUIDE DE MARQUE</Text><PdfBrandLockup data={data} size="large" showBaseline/>{coverImage ? <Image src={coverImage} style={S.coverImage}/> : <View style={S.coverShape}/>}<View style={S.coverPalette}>{palette.map((color) => <View key={color.id} style={[S.coverSwatch, { backgroundColor: color.hex }]}/>)}</View></View>
      <View style={S.coverFooter}><Text style={S.small}>Version 1.0 · {formatDate(data.generatedAt)}</Text><Text style={S.small}>Créé avec Brand Studio</Text></View>
    </Page>
    <Page size="A4" style={S.page}><PageChrome data={data} chapter="Sommaire"/><Text style={S.tocTitle}>Sommaire</Text><Text style={S.intro}>Ce guide rassemble les décisions stratégiques, verbales et visuelles de {data.brandName}. Utilise-le comme référence avant toute création de contenu ou de support.</Text>{data.chapters.map((chapter) => <View key={chapter.id} style={S.tocRow}><Text style={S.tocNo}>{chapter.number}</Text><Text style={S.tocName}>{chapter.title}</Text><View style={S.tocDots}/><Text style={S.tocPage}>{chapter.page}</Text></View>)}</Page>
    {data.foundations.length ? <Page size="A4" style={S.page}><PageChrome data={data} chapter="Fondations"/><ChapterHeading number={chapterNo("foundations")} title="Fondations" intro="Les repères essentiels qui donnent du sens et une direction durable à la marque."/><FoundationStory items={data.foundations}/></Page> : null}
    {data.values.length ? <Page size="A4" style={S.page}><PageChrome data={data} chapter="Valeurs"/><ChapterHeading number={chapterNo("values")} title="Valeurs incarnées" intro="Des principes traduits en comportements et en signes reconnaissables."/><View style={S.grid}>{data.values.map((value) => <PdfBrandValue key={value.name} value={value}/>)}</View></Page> : null}
    {data.positioning.length ? <Page size="A4" style={S.page}><PageChrome data={data} chapter={data.combinePositioningAndMessages ? "Positionnement & messages" : "Positionnement"}/><ChapterHeading number={chapterNo("positioning")} title="Positionnement" intro="La place que la marque choisit d’occuper dans l’esprit de ses clients."/><EditorialFields items={data.positioning}/>{data.combinePositioningAndMessages ? <View wrap={false}><Text style={[S.chapterTitle, { fontSize: 20, marginTop: 8, marginBottom: 14 }]}>Messages essentiels</Text><EditorialFields items={data.messages}/></View> : null}</Page> : null}
    {(data.personality.length || data.language.use.length || data.language.avoid.length) ? <Page size="A4" style={S.page}><PageChrome data={data} chapter="Personnalité & langage"/><ChapterHeading number={chapterNo("voice")} title="Personnalité & langage" intro="Une identité claire et des repères concrets pour prendre la parole."/>{data.personality[0] ? <View style={[S.quote, { marginBottom: 26 }]}><Text style={S.fieldLabel}>{data.personality[0].label}</Text><Text style={[S.quoteText, { textAlign: "left" }]}>{data.personality[0].value}</Text></View> : null}<View style={S.grid}>{data.personality.slice(1).map((item) => <View key={item.label} style={S.column}><Field item={item}/></View>)}</View>{(data.language.use.length || data.language.avoid.length) ? <View style={[S.grid, { marginTop: 12 }]}><View style={S.languageColumn}><Text style={S.fieldLabel}>À privilégier</Text>{data.language.use.map((word) => <View key={word} style={S.languageItem}><Text style={S.languageSymbol}>+</Text><Text style={S.body}>{word}</Text></View>)}</View><View style={[S.languageColumn, S.languageAvoid]}><Text style={S.fieldLabel}>À éviter</Text>{data.language.avoid.map((word) => <View key={word} style={S.languageItem}><Text style={S.languageSymbol}>−</Text><Text style={S.body}>{word}</Text></View>)}</View></View> : null}</Page> : null}
    {data.messages.length && !data.combinePositioningAndMessages ? <Page size="A4" style={S.page}><PageChrome data={data} chapter="Messages"/><ChapterHeading number={chapterNo("messages")} title="Messages" intro="Les formulations centrales à préserver sur tous les points de contact."/>{data.messages.map((item, index) => index === 0 ? <View key={item.label} style={S.quote}><Text style={S.fieldLabel}>{item.label}</Text><Text style={S.quoteText}>{item.value}</Text></View> : <Field key={item.label} item={item} statement/>)}</Page> : null}
    {data.palette.length || data.ambiance ? <PalettePage data={data} number={chapterNo("visual")}/> : null}
    {data.moodboard.length ? <MoodboardPage data={data} number={chapterNo("moodboard")}/> : null}
    {data.summary.length ? <Page size="A4" style={S.page}><PageChrome data={data} chapter="Synthèse"/><ChapterHeading number={chapterNo("summary")} title="Ta marque en un coup d’œil"/><View style={S.summaryHero}><PdfBrandLockup data={data} size="medium" showBaseline/></View><EditorialFields items={data.summary.filter((item) => item.label !== "Baseline")}/></Page> : null}
  </Document>;
}

export async function prepareMoodboardAssets(data: BrandGuideData) {
  async function loadDataUrl(url?: string) {
    if (!url || url.startsWith("data:")) return url;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(8_000) });
      if (!response.ok) return undefined;
      const type = response.headers.get("content-type") || "image/png";
      const bytes = Buffer.from(await response.arrayBuffer());
      return `data:${type};base64,${bytes.toString("base64")}`;
    } catch { return undefined; }
  }
  const moodboard = await Promise.all(data.moodboard.map(async (item) => {
    if (!item.imageUrl || item.imageUrl.startsWith("data:")) return item;
    return { ...item, imageUrl: await loadDataUrl(item.imageUrl) };
  }));
  return { ...data, logoUrl: await loadDataUrl(data.logoUrl), moodboard: moodboard.filter((item) => item.type !== "image" || Boolean(item.imageUrl)) };
}

export async function renderBrandGuidePdf(guide: GeneratedBrandGuide) {
  const data = await prepareMoodboardAssets(createBrandGuideData(guide));
  const consistency = validateBrandGuideData(data);
  if (!consistency.valid) {
    if (process.env.NODE_ENV !== "production") console.error("Brand guide identity conflict", consistency);
    throw new Error(`Brand guide identity conflict: ${consistency.conflicts.join(", ")}`);
  }
  if (process.env.NODE_ENV !== "production") {
    console.info("Brand guide generation report", {
      brandName: data.brandName,
      renderedSections: data.chapters.map((chapter) => chapter.id),
      skippedSections: ["foundations", "positioning", "voice", "messages", "visual", "moodboard", "summary"].filter((id) => !data.chapters.some((chapter) => chapter.id === id)),
      missingImages: guide.visualUniverse.moodboard.filter((item) => item.imageUrl).length - data.moodboard.filter((item) => item.imageUrl).length,
      pageCount: Math.max(2, ...data.chapters.map((chapter) => chapter.page)),
      detectedBrandNames: consistency.detectedBrandNames,
      warnings: consistency.warnings,
    });
  }
  return renderToBuffer(<BrandGuideDocument data={data}/>);
}
