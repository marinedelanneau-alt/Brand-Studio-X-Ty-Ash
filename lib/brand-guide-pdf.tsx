import { Document, Font, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import path from "node:path";
import type { GeneratedBrandGuide, GuideMoodboardItem } from "./brand-guide";
import { createBrandGuideData, validateBrandGuideData, type BrandGuideData, type BrandValueData } from "./brand-guide-pdf-data";
import { composeEditorialPages, type EditorialComposition, type EditorialPagePlan } from "./brand-guide-editorial-composer";
import { fitTextToBox, getPositioningLayout, selectApplicationMessage, validateGeneratedGuide } from "./brand-guide-layout";
import {
  buildBrandVisualIdentity,
  createBrandGuideTheme,
  getAccessibleTextColor,
  generateTint,
  type BrandGuideTheme,
  type BrandVisualIdentity,
} from "./brand-visual-identity";
import { BRAND_GUIDE_TYPOGRAPHY as TYPE, selectEditorialTextStyle } from "./brand-guide-typography-scale";

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

const A4 = { width: 595.28, height: 841.89, margin: 48, content: 499.28 };

function createStyles(theme: BrandGuideTheme) {
  const { colors, typography, layout } = theme;
  return StyleSheet.create({
    page: { backgroundColor: colors.background, color: colors.text, fontFamily: typography.bodyFont, padding: A4.margin },
    pageDark: { backgroundColor: colors.primary, color: getAccessibleTextColor(colors.primary), fontFamily: typography.bodyFont, padding: A4.margin },
    pageAccent: { backgroundColor: colors.accent, color: getAccessibleTextColor(colors.accent), fontFamily: typography.bodyFont, padding: A4.margin },
    tiny: { fontSize: TYPE.label, letterSpacing: 1.2, textTransform: "uppercase" },
    label: { fontSize: TYPE.label, fontWeight: 600, letterSpacing: 1.4, textTransform: "uppercase" },
    body: { fontSize: TYPE.body, lineHeight: 1.48 },
    small: { fontSize: TYPE.caption, lineHeight: 1.42 },
    display: { fontFamily: typography.displayFont, fontSize: TYPE.coverTitle, fontWeight: typography.headingWeight, lineHeight: 1 },
    h1: { fontFamily: typography.headingFont, fontSize: TYPE.chapterTitle, fontWeight: typography.headingWeight, lineHeight: 1.08 },
    h2: { fontFamily: typography.headingFont, fontSize: TYPE.sectionTitle, fontWeight: typography.headingWeight, lineHeight: 1.15 },
    quote: { fontFamily: typography.displayFont, fontSize: TYPE.editorialLarge, lineHeight: 1.2 },
    rule: { height: layout.lineWidth, backgroundColor: colors.accent },
    footer: { position: "absolute", bottom: 24, left: A4.margin, right: A4.margin, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    logoSmall: { width: 28, height: 20, objectFit: "contain" },
    logoMedium: { width: 112, height: 76, objectFit: "contain" },
    logoLarge: { width: 160, height: 110, objectFit: "contain" },
  });
}

type RenderContext = {
  data: BrandGuideData;
  identity: BrandVisualIdentity;
  theme: BrandGuideTheme;
  composition: EditorialComposition;
  styles: ReturnType<typeof createStyles>;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(new Date(value));
}

export function getCoverTitleFontSize(name: string) {
  return selectEditorialTextStyle({ text: name, role: "cover" }).fontSize;
}

function BrandLockup({ context, size = "medium", light = false, baseline = false }: {
  context: RenderContext;
  size?: "small" | "medium" | "large";
  light?: boolean;
  baseline?: boolean;
}) {
  const { data, styles, theme } = context;
  const imageStyle = size === "large" ? styles.logoLarge : size === "medium" ? styles.logoMedium : styles.logoSmall;
  const nameSize = size === "large" ? getCoverTitleFontSize(data.brandName) : size === "medium" ? TYPE.editorialMedium : TYPE.label;
  return (
    <View style={{ flexDirection: size === "small" ? "row" : "column", alignItems: size === "small" ? "center" : "flex-start" }}>
      {data.logoUrl ? (
        <View wrap={false} style={[imageStyle, { overflow: "hidden", backgroundColor: "#FFFFFF", padding: size === "small" ? 2 : 6 }, size === "small" ? { marginRight: 8 } : { marginBottom: 18 }]}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={data.logoUrl} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </View>
      ) : null}
      <View>
        <Text style={{ fontFamily: context.theme.typography.displayFont, fontSize: nameSize, lineHeight: 0.98, color: light ? "#FFFFFF" : theme.colors.text }}>
          {data.brandName}
        </Text>
        {baseline && data.baseline ? <Text style={[styles.small, { marginTop: 10, color: light ? "#FFFFFF" : theme.colors.mutedText }]}>{data.baseline}</Text> : null}
      </View>
    </View>
  );
}

function PageFooter({ context, plan, light = false }: { context: RenderContext; plan: EditorialPagePlan; light?: boolean }) {
  const { styles, theme } = context;
  const color = light ? "#FFFFFF" : theme.colors.mutedText;
  return (
    <View fixed style={styles.footer}>
      <Text style={[styles.tiny, { color }]}>Brand Studio · Guide de marque</Text>
      <Text style={[styles.tiny, { color }]}>{String(plan.pageNumber).padStart(2, "0")}</Text>
    </View>
  );
}

function ChapterMarker({ context, plan, light = false }: { context: RenderContext; plan: EditorialPagePlan; light?: boolean }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 34 }}>
      <Text style={[context.styles.label, { color: light ? "#FFFFFF" : context.theme.colors.accent }]}>{plan.number} — {plan.chapter}</Text>
      <View style={{ width: 64, height: context.theme.layout.lineWidth, backgroundColor: light ? "#FFFFFF" : context.theme.colors.accent }} />
    </View>
  );
}

function CoverPage({ context, plan }: { context: RenderContext; plan: EditorialPagePlan }) {
  const { data, identity, theme, styles } = context;
  const image = identity.moodboard.images[0]?.imageUrl;
  const isDark = plan.variant === "image" || plan.variant === "collage" || plan.variant === "chromatic";
  const pageStyle = isDark ? styles.pageDark : styles.page;
  const textColor = isDark ? getAccessibleTextColor(theme.colors.primary) : theme.colors.text;
  return (
    <Page size="A4" style={[pageStyle, { padding: 0 }]}>
      {plan.variant === "image" && image ? (
        <>
          <View style={{ position: "absolute", top: 0, left: 0, width: A4.width, height: A4.height, overflow: "hidden" }}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={image} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </View>
          <View style={{ position: "absolute", top: 0, left: 0, width: A4.width, height: A4.height, backgroundColor: theme.colors.primary, opacity: 0.62 }} />
        </>
      ) : null}
      {plan.variant === "chromatic" ? (
        <View style={{ position: "absolute", right: 0, top: 0, width: 205, height: A4.height, backgroundColor: theme.colors.secondary }} />
      ) : null}
      {plan.variant === "collage" ? (
        <>
          <View style={{ position: "absolute", right: -26, top: 80, width: 250, height: 330, backgroundColor: theme.colors.secondary, transform: "rotate(7deg)" }} />
          <View style={{ position: "absolute", right: 76, bottom: 62, width: 190, height: 270, backgroundColor: theme.colors.accent, transform: "rotate(-5deg)" }} />
          <View style={{ position: "absolute", right: 28, top: 310, width: 110, height: 110, borderRadius: 55, backgroundColor: generateTint(theme.colors.primary, 64) }} />
        </>
      ) : null}
      <View style={{ position: "absolute", top: 52, left: 48, right: 48, flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={[styles.tiny, { color: textColor }]}>Guide de marque</Text>
        <Text style={[styles.tiny, { color: textColor }]}>Édition {formatDate(data.generatedAt)}</Text>
      </View>
      <View wrap={false} style={{ position: "absolute", left: 48, right: 48, top: plan.variant === "minimal-premium" ? 270 : 220, height: 260 }}>
        <BrandLockup context={context} size={plan.variant === "collage" || plan.variant === "chromatic" ? "medium" : "large"} light={isDark} baseline />
      </View>
      <View style={{ position: "absolute", left: 48, bottom: 54, flexDirection: "row", alignItems: "center" }}>
        {data.palette.slice(0, 6).map((color, index) => <View key={color.id} style={{ width: index === 0 ? 64 : 28, height: 10, backgroundColor: color.hex }} />)}
      </View>
      <Text style={[styles.tiny, { position: "absolute", right: 48, bottom: 52, color: textColor }]}>Créé avec Brand Studio</Text>
    </Page>
  );
}

function ContentsPage({ context, plan }: { context: RenderContext; plan: EditorialPagePlan }) {
  const { styles, theme, composition } = context;
  return (
    <Page size="A4" style={styles.page}>
      <Text style={[styles.display, { maxWidth: 390 }]}>Le territoire de la marque</Text>
      <View style={{ marginTop: 50 }}>
        {composition.contents.map((item, index) => (
          <View key={item.title} style={{ flexDirection: "row", paddingVertical: 13, borderTop: `${index === 0 ? theme.layout.lineWidth : 0.5} solid ${theme.colors.border}` }}>
            <Text style={[styles.label, { width: 38, color: theme.colors.accent }]}>{item.number}</Text>
            <View style={{ flexGrow: 1, maxWidth: 390 }}>
              <Text style={styles.h2}>{item.title}</Text>
              <Text style={[styles.small, { color: theme.colors.mutedText, marginTop: 4 }]}>{item.description}</Text>
            </View>
            <Text style={[styles.label, { width: 28, textAlign: "right" }]}>{String(item.page).padStart(2, "0")}</Text>
          </View>
        ))}
      </View>
      <PageFooter context={context} plan={plan} />
    </Page>
  );
}

function FoundationsPage({ context, plan }: { context: RenderContext; plan: EditorialPagePlan }) {
  const { data, styles, theme } = context;
  const mission = data.foundations.find((item) => item.label === "Mission");
  const others = data.foundations.filter((item) => item !== mission);
  return (
    <Page size="A4" style={styles.page}>
      <ChapterMarker context={context} plan={plan} />
      <Text style={[styles.h1, { maxWidth: 420 }]}>Ce qui donne une direction à la marque.</Text>
      {mission ? <Text style={[styles.quote, { marginTop: 48, maxWidth: 455, color: theme.colors.primary }]}>{mission.value}</Text> : null}
      <View style={{ flexDirection: "row", marginTop: 64, gap: 30 }}>
        {others.map((item, index) => (
          <View key={item.label} style={{ width: `${100 / Math.max(others.length, 1) - 3}%`, paddingTop: 12, borderTop: `${index === 0 ? theme.layout.lineWidth : 1} solid ${index === 0 ? theme.colors.accent : theme.colors.border}` }}>
            <Text style={[styles.label, { color: theme.colors.mutedText }]}>{item.label}</Text>
            <Text style={[styles.body, { marginTop: 12 }]}>{item.value}</Text>
          </View>
        ))}
      </View>
      <PageFooter context={context} plan={plan} />
    </Page>
  );
}

function ManifestoPage({ context, plan }: { context: RenderContext; plan: EditorialPagePlan }) {
  const mission = context.data.foundations.find((item) => item.label === "Mission")?.value || "";
  const light = getAccessibleTextColor(context.theme.colors.primary) === "#FFFFFF";
  return (
    <Page size="A4" style={context.styles.pageDark}>
      <Text style={[context.styles.label, { color: light ? "#FFFFFF" : context.theme.colors.text }]}>Notre mission</Text>
      <View style={{ flexGrow: 1, justifyContent: "center" }}>
        <Text style={[context.styles.display, { fontSize: selectEditorialTextStyle({ text: mission, role: "statement" }).fontSize, color: light ? "#FFFFFF" : context.theme.colors.text }]}>{mission}</Text>
      </View>
      <PageFooter context={context} plan={plan} light={light} />
    </Page>
  );
}

function ValueStory({ context, value, index, width }: { context: RenderContext; value: BrandValueData; index: number; width: string }) {
  const { styles, theme } = context;
  return (
    <View wrap={false} style={{ width, minHeight: 410, marginBottom: 20, padding: 14, backgroundColor: theme.colors.surface, borderTop: `2 solid ${theme.colors.accent}` }}>
      <View style={{ flexDirection: "row", alignItems: "baseline" }}>
        <Text style={{ fontFamily: theme.typography.displayFont, fontSize: TYPE.editorialLarge, color: theme.colors.accent, marginRight: 14 }}>{String(index + 1).padStart(2, "0")}</Text>
        <Text style={styles.h2}>{value.name}</Text>
      </View>
      {value.meaning ? <View style={{ marginTop: 10 }}><Text style={[styles.label, { color: theme.colors.mutedText }]}>Sens</Text><Text style={[styles.body, { marginTop: 6 }]}>{value.meaning}</Text></View> : null}
      <View style={{ flexDirection: "column", gap: 16, marginTop: 16 }}>
        {value.concreteApplication ? <View style={{ width: "100%" }}><Text style={[styles.label, { color: theme.colors.mutedText }]}>Dans la pratique</Text><Text style={[styles.body, { marginTop: 6 }]}>{value.concreteApplication}</Text></View> : null}
        {value.communicationExpression ? <View style={{ width: "100%" }}><Text style={[styles.label, { color: theme.colors.mutedText }]}>Dans la communication</Text><Text style={[styles.body, { marginTop: 6 }]}>{value.communicationExpression}</Text></View> : null}
      </View>
    </View>
  );
}

function ValuesPage({ context, plan, occurrence }: { context: RenderContext; plan: EditorialPagePlan; occurrence: number }) {
  const longValues = context.data.values.some((value) => [value.meaning, value.concreteApplication, value.communicationExpression].join("").length > 280);
  const batchSize = longValues ? 1 : 3;
  const values = context.data.values.slice(occurrence * batchSize, occurrence * batchSize + batchSize);
  return (
    <Page size="A4" style={context.styles.page}>
      <ChapterMarker context={context} plan={plan} />
      <Text style={[context.styles.h1, { marginBottom: 34 }]}>Des valeurs qui guident chaque choix.</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
        {values.map((value, index) => <ValueStory key={value.id || value.name} context={context} value={value} index={index + occurrence * batchSize} width={values.length === 3 ? "31%" : values.length === 2 ? "48%" : "100%"} />)}
      </View>
      <PageFooter context={context} plan={plan} />
    </Page>
  );
}

function PositioningPage({ context, plan }: { context: RenderContext; plan: EditorialPagePlan }) {
  const { data, styles, theme } = context;
  const statement = data.positioning.find((item) => item.label.includes("final")) || data.positioning.at(-1);
  const contextField = data.positioning.find((item) => item !== statement);
  const layout = getPositioningLayout(statement?.value || "", contextField?.value || "");
  const statementFit = fitTextToBox({ text: statement?.value || "", width: layout.columns ? 390 : 282, height: layout.columns ? 220 : 360, minFontSize: 15, maxFontSize: Math.min(22, layout.statementFontSize), lineHeight: 1.2 });
  return (
    <Page size="A4" style={styles.page}>
      <ChapterMarker context={context} plan={plan} />
      <View wrap={false} style={{ flexDirection: layout.columns ? "column" : "row", minHeight: 520 }}>
        <View style={{ width: layout.columns ? "100%" : "36%", paddingRight: layout.columns ? 0 : 28, marginBottom: layout.columns ? 24 : 0, justifyContent: "space-between" }}>
          <Text style={[styles.h1, { fontSize: TYPE.editorialLarge }]}>La place que la marque choisit d’occuper.</Text>
          {contextField ? <View style={{ marginTop: layout.columns ? 18 : 0 }}><Text style={[styles.label, { color: theme.colors.mutedText }]}>{contextField.label}</Text><Text style={[styles.body, { marginTop: 10, fontSize: Math.max(10, Math.min(TYPE.bodyLarge, layout.contextFontSize)) }]}>{contextField.value}</Text></View> : null}
        </View>
        <View wrap={false} style={{ width: layout.columns ? "100%" : "64%", minHeight: layout.columns ? 220 : 430, backgroundColor: theme.colors.primary, padding: 32, justifyContent: "center" }}>
          <Text style={[styles.label, { color: getAccessibleTextColor(theme.colors.primary), marginBottom: 28 }]}>Positionnement</Text>
          <Text style={[styles.quote, { fontSize: statementFit.fontSize, color: getAccessibleTextColor(theme.colors.primary) }]}>{statement?.value}</Text>
        </View>
      </View>
      <PageFooter context={context} plan={plan} />
    </Page>
  );
}

function PersonalityPage({ context, plan }: { context: RenderContext; plan: EditorialPagePlan }) {
  const { data, identity, styles, theme } = context;
  const portrait = identity.moodboard.images[0]?.imageUrl;
  const portraitField = data.personality[0];
  return (
    <Page size="A4" style={styles.page}>
      <ChapterMarker context={context} plan={plan} />
      <View style={{ flexDirection: "row", gap: 30 }}>
        <View style={{ width: "43%" }}>
          {portrait ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={portrait} style={{ width: "100%", height: 285, objectFit: "cover" }} />
          ) : <View style={{ height: 260, backgroundColor: theme.colors.secondary, justifyContent: "center", padding: 24 }}><Text style={[styles.h2, { color: getAccessibleTextColor(theme.colors.secondary) }]}>{identity.personalityTraits.join("\n")}</Text></View>}
          {portraitField ? <Text style={[styles.body, { marginTop: 18 }]}>{portraitField.value}</Text> : null}
        </View>
        <View style={{ width: "51%" }}>
          <Text style={[styles.h1, { marginBottom: 34 }]}>Une présence reconnaissable avant même de parler.</Text>
          {data.personality.slice(1).map((item) => <View key={item.label} style={{ marginBottom: 20 }}><Text style={[styles.label, { color: theme.colors.accent }]}>{item.label}</Text><Text style={[styles.body, { marginTop: 7 }]}>{item.value}</Text></View>)}
        </View>
      </View>
      <View style={{ position: "absolute", left: A4.margin, right: A4.margin, bottom: 72, flexDirection: "row" }}>
        <View style={{ width: "50%", paddingRight: 20 }}><Text style={[styles.label, { color: theme.colors.accent }]}>À privilégier</Text><Text style={[styles.body, { marginTop: 8 }]}>{data.language.use.join(" · ")}</Text></View>
        <View style={{ width: "50%", paddingLeft: 20, borderLeft: `1 solid ${theme.colors.border}` }}><Text style={[styles.label, { color: theme.colors.mutedText }]}>À écarter</Text><Text style={[styles.body, { marginTop: 8 }]}>{data.language.avoid.join(" · ")}</Text></View>
      </View>
      <PageFooter context={context} plan={plan} />
    </Page>
  );
}

function MessagesPage({ context, plan }: { context: RenderContext; plan: EditorialPagePlan }) {
  const { data, styles, theme } = context;
  return (
    <Page size="A4" style={styles.pageAccent}>
      <ChapterMarker context={context} plan={plan} light />
      <Text style={[styles.h1, { color: getAccessibleTextColor(theme.colors.accent), maxWidth: 380 }]}>Les mots qui portent la marque.</Text>
      <View style={{ flexGrow: 1, justifyContent: "center" }}>
        {data.messages.map((item, index) => (
          <View key={item.label} style={{ marginBottom: index === 0 ? 54 : 28 }}>
            <Text style={[styles.label, { color: getAccessibleTextColor(theme.colors.accent), opacity: 0.7 }]}>{item.label}</Text>
            <Text style={[index === 0 ? styles.quote : styles.h2, { fontSize: index === 0 ? selectEditorialTextStyle({ text: item.value, role: "statement" }).fontSize : TYPE.sectionTitle, color: getAccessibleTextColor(theme.colors.accent), marginTop: 12 }]}>{item.value}</Text>
          </View>
        ))}
      </View>
      <PageFooter context={context} plan={plan} light />
    </Page>
  );
}

function VisualSystemPage({ context, plan }: { context: RenderContext; plan: EditorialPagePlan }) {
  const { data, styles, theme } = context;
  const colors = data.palette;
  const total = Math.max(colors.length, 1);
  return (
    <Page size="A4" style={styles.page}>
      <ChapterMarker context={context} plan={plan} />
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ width: "48%" }}><Text style={styles.h1}>Le système visuel de la marque.</Text><Text style={[styles.body, { marginTop: 18, color: theme.colors.mutedText }]}>{data.ambiance}</Text></View>
        <View style={{ width: "42%", minHeight: 120, justifyContent: "center", alignItems: "center" }}><BrandLockup context={context} size="medium" /></View>
      </View>
      <View style={{ flexDirection: "row", height: 245, marginTop: 50 }}>
        {colors.map((color, index) => (
          <View key={color.id} style={{ width: `${index === 0 ? Math.max(30, 100 / total) : 100 / total}%`, backgroundColor: color.hex, padding: 10, justifyContent: "flex-end" }}>
            <Text style={[styles.label, { color: getAccessibleTextColor(color.hex) }]}>{color.name}</Text>
            <Text style={[styles.small, { color: getAccessibleTextColor(color.hex), marginTop: 4 }]}>{color.hex}</Text>
            <Text style={[styles.small, { color: getAccessibleTextColor(color.hex), marginTop: 4 }]}>{color.usage}</Text>
            <Text style={[styles.small, { color: getAccessibleTextColor(color.hex), marginTop: 3 }]}>{index === 0 ? "Usage recommandé : 55 %" : `Usage recommandé : ${Math.round(45 / Math.max(colors.length - 1, 1))} %`}</Text>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: "row", marginTop: 28, gap: 24 }}>
        <View style={{ width: "48%" }}><Text style={[styles.label, { color: theme.colors.accent }]}>Typographie d’expression</Text><Text style={{ fontFamily: theme.typography.displayFont, fontSize: TYPE.editorialLarge, marginTop: 12 }}>Aa Bb Cc</Text><Text style={[styles.small, { marginTop: 8 }]}>{theme.typography.displayFont}</Text></View>
        <View style={{ width: "48%" }}><Text style={[styles.label, { color: theme.colors.accent }]}>Typographie de lecture</Text><Text style={{ fontFamily: theme.typography.bodyFont, fontSize: TYPE.editorialMedium, marginTop: 12 }}>Aa Bb Cc</Text><Text style={[styles.small, { marginTop: 8 }]}>{theme.typography.bodyFont}</Text></View>
      </View>
      <PageFooter context={context} plan={plan} />
    </Page>
  );
}

function MoodboardElement({ item, theme }: { item: GuideMoodboardItem; theme: BrandGuideTheme }) {
  const style = {
    position: "absolute" as const,
    left: `${Math.max(0, Math.min(item.x, 96))}%`,
    top: `${Math.max(0, Math.min(item.y, 96))}%`,
    width: `${Math.max(6, Math.min(item.width, 90))}%`,
    height: `${Math.max(6, Math.min(item.height, 90))}%`,
    transform: `rotate(${item.rotation}deg)`,
    overflow: "hidden" as const,
    backgroundColor: item.type === "color" ? item.color : "#FFFFFF",
    borderRadius: theme.layout.cornerRadius,
  };
  if (item.imageUrl && (item.type === "image" || item.type === "icon")) {
    return (
      <View style={style}>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image src={item.imageUrl} style={{ width: "100%", height: "100%", objectFit: item.type === "icon" ? "contain" : "cover", objectPosition: `${item.cropX ?? 50}% ${item.cropY ?? 50}%` }} />
      </View>
    );
  }
  if (item.type === "color") {
    const color = item.color || theme.colors.primary;
    return (
      <View style={[style, { justifyContent: "flex-end", padding: 10 }]}>
        <Text style={{ fontSize: TYPE.caption, fontWeight: 600, color: getAccessibleTextColor(color) }}>{item.label === "Couleur" ? "Teinte du moodboard" : item.label}</Text>
        <Text style={{ fontSize: TYPE.caption, marginTop: 4, color: getAccessibleTextColor(color) }}>{color.toUpperCase()}</Text>
      </View>
    );
  }
  const available = Math.max(20, item.width * 4.55 - 16);
  const requested = item.fontSize || 12;
  const fitted = item.type === "keyword" ? Math.max(TYPE.caption, Math.min(requested, available / Math.max(item.label.length * 0.62, 1))) : Math.max(TYPE.caption, Math.min(requested, 24));
  return <View style={[style, { justifyContent: "center", alignItems: "center", padding: 8 }]}><Text style={{ fontFamily: item.type === "text" ? theme.typography.displayFont : theme.typography.bodyFont, fontSize: fitted, fontWeight: item.type === "keyword" ? 600 : 400, textAlign: "center", color: item.textColor || theme.colors.text }}>{item.label}</Text></View>;
}

function MoodboardPage({ context, plan }: { context: RenderContext; plan: EditorialPagePlan }) {
  const { data, styles, theme } = context;
  return (
    <Page size="A4" style={styles.page}>
      <Text style={[styles.label, { color: theme.colors.accent, marginBottom: 18 }]}>{plan.number} — Direction artistique</Text>
      <View style={{ position: "relative", width: A4.content, height: 690, overflow: "hidden", backgroundColor: data.moodboardBackground || theme.colors.surface }}>
        {data.moodboard.slice().sort((a, b) => a.zIndex - b.zIndex).map((item) => <MoodboardElement key={item.id} item={item} theme={theme} />)}
      </View>
      <PageFooter context={context} plan={plan} />
    </Page>
  );
}

function ApplicationsPage({ context, plan }: { context: RenderContext; plan: EditorialPagePlan }) {
  const { data, styles, theme, identity } = context;
  const promise = selectApplicationMessage(data);
  const messageFit = fitTextToBox({ text: promise, width: 240, height: 210, minFontSize: 14, maxFontSize: 26, lineHeight: 1.12 });
  const word = identity.visualKeywords[0] || identity.personalityTraits[0] || data.brandName;
  return (
    <Page size="A4" style={styles.page}>
      <ChapterMarker context={context} plan={plan} />
      <Text style={[styles.h1, { maxWidth: 390 }]}>Le système en mouvement.</Text>
      <View wrap={false} style={{ marginTop: 42, flexDirection: "row", height: 470 }}>
        <View style={{ width: "58%", backgroundColor: theme.colors.primary, padding: 30, justifyContent: "space-between" }}>
          <Text style={[styles.label, { color: getAccessibleTextColor(theme.colors.primary) }]}>{data.brandName}</Text>
          <Text style={[styles.display, { fontSize: messageFit.fontSize, color: getAccessibleTextColor(theme.colors.primary) }]}>{promise}</Text>
          <Text style={[styles.small, { color: getAccessibleTextColor(theme.colors.primary) }]}>Publication sociale · principe de composition</Text>
        </View>
        <View style={{ width: "42%" }}>
          <View style={{ flexGrow: 1, backgroundColor: theme.colors.secondary, padding: 20, justifyContent: "center" }}><Text style={[styles.h2, { color: getAccessibleTextColor(theme.colors.secondary) }]}>{word}</Text></View>
          <View style={{ flexGrow: 1, backgroundColor: theme.colors.surface, padding: 20, justifyContent: "space-between" }}>
            <Text style={styles.label}>Signature</Text>
            <BrandLockup context={context} size="small" />
            {data.baseline ? <Text style={styles.small}>{data.baseline}</Text> : null}
            <Text style={[styles.label, { color: theme.colors.accent, borderTop: `1 solid ${theme.colors.accent}`, paddingTop: 8 }]}>EN SAVOIR PLUS</Text>
          </View>
        </View>
      </View>
      <PageFooter context={context} plan={plan} />
    </Page>
  );
}

function SummaryPage({ context, plan }: { context: RenderContext; plan: EditorialPagePlan }) {
  const { data, styles, theme } = context;
  const light = getAccessibleTextColor(theme.colors.primary) === "#FFFFFF";
  return (
    <Page size="A4" style={styles.pageDark}>
      <BrandLockup context={context} size="medium" light={light} baseline />
      <View style={{ marginTop: 46, flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
        {data.summary.filter((item) => item.label !== "Baseline" && item.label !== "Palette").slice(0, 6).map((item, index) => (
          <View key={item.label} style={{ width: index === 0 ? "100%" : "47%", marginBottom: 28, paddingTop: 12, borderTop: `1 solid ${light ? "#FFFFFF" : theme.colors.text}` }}>
            <Text style={[styles.label, { color: light ? "#FFFFFF" : theme.colors.text, opacity: 0.7 }]}>{item.label}</Text>
            <Text style={[index === 0 ? styles.h2 : styles.body, { color: light ? "#FFFFFF" : theme.colors.text, marginTop: 9 }]}>{item.value}</Text>
          </View>
        ))}
      </View>
      <View style={{ position: "absolute", left: A4.margin, right: A4.margin, bottom: 58, flexDirection: "row" }}>
        {data.palette.map((color) => <View key={color.id} style={{ flexGrow: 1, height: 22, backgroundColor: color.hex }} />)}
      </View>
      <PageFooter context={context} plan={plan} light={light} />
    </Page>
  );
}

function renderPlannedPage(context: RenderContext, plan: EditorialPagePlan, occurrence: number) {
  if (plan.kind === "cover") return <CoverPage key={plan.id} context={context} plan={plan} />;
  if (plan.kind === "contents") return <ContentsPage key={plan.id} context={context} plan={plan} />;
  if (plan.kind === "foundations") return <FoundationsPage key={plan.id} context={context} plan={plan} />;
  if (plan.kind === "manifesto") return <ManifestoPage key={plan.id} context={context} plan={plan} />;
  if (plan.kind === "values") return <ValuesPage key={plan.id} context={context} plan={plan} occurrence={occurrence} />;
  if (plan.kind === "positioning") return <PositioningPage key={plan.id} context={context} plan={plan} />;
  if (plan.kind === "personality") return <PersonalityPage key={plan.id} context={context} plan={plan} />;
  if (plan.kind === "messages") return <MessagesPage key={plan.id} context={context} plan={plan} />;
  if (plan.kind === "visual-system") return <VisualSystemPage key={plan.id} context={context} plan={plan} />;
  if (plan.kind === "moodboard") return <MoodboardPage key={plan.id} context={context} plan={plan} />;
  if (plan.kind === "applications") return <ApplicationsPage key={plan.id} context={context} plan={plan} />;
  return <SummaryPage key={plan.id} context={context} plan={plan} />;
}

function BrandGuideDocument({ context }: { context: RenderContext }) {
  const occurrences = new Map<string, number>();
  return (
    <Document title={`Guide de marque — ${context.data.brandName}`} author="Brand Studio" subject={`Guide de marque de ${context.data.brandName}`} language="fr-FR">
      {context.composition.pages.map((plan) => {
        const occurrence = occurrences.get(plan.kind) || 0;
        occurrences.set(plan.kind, occurrence + 1);
        return renderPlannedPage(context, plan, occurrence);
      })}
    </Document>
  );
}

export async function prepareBrandGuideAssets(data: BrandGuideData) {
  async function loadDataUrl(url?: string) {
    if (!url || url.startsWith("data:")) return url;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(8_000) });
      if (!response.ok) return undefined;
      const type = response.headers.get("content-type") || "image/png";
      const bytes = Buffer.from(await response.arrayBuffer());
      return `data:${type};base64,${bytes.toString("base64")}`;
    } catch {
      return undefined;
    }
  }
  const moodboard = await Promise.all(data.moodboard.map(async (item) => {
    if (!item.imageUrl) return item;
    return { ...item, imageUrl: await loadDataUrl(item.imageUrl) };
  }));
  return {
    ...data,
    logoUrl: await loadDataUrl(data.logoUrl),
    moodboard: moodboard.filter((item) => !["image", "icon"].includes(item.type) || Boolean(item.imageUrl)),
  };
}

export const prepareMoodboardAssets = prepareBrandGuideAssets;

export async function renderBrandGuidePdf(guide: GeneratedBrandGuide) {
  const initialData = createBrandGuideData(guide);
  const data = await prepareBrandGuideAssets(initialData);
  const identity = buildBrandVisualIdentity({
    ...guide,
    brandAssets: { ...guide.brandAssets, logoUrl: data.logoUrl },
    visualUniverse: { ...guide.visualUniverse, moodboard: data.moodboard },
  });
  const theme = createBrandGuideTheme(identity);
  const composition = composeEditorialPages({ data, identity, direction: theme.direction });
  const composedValidation = validateGeneratedGuide(composition);
  if (!composedValidation.valid) throw new Error(`Brand guide composition invalid: ${composedValidation.errors.join(", ")}`);
  const consistency = validateBrandGuideData(data);
  if (!consistency.valid) {
    if (process.env.NODE_ENV !== "production") throw new Error(`Brand guide identity conflict: ${consistency.conflicts.join(", ")}`);
  }
  const context: RenderContext = { data, identity, theme, composition, styles: createStyles(theme) };
  return renderToBuffer(<BrandGuideDocument context={context} />);
}
