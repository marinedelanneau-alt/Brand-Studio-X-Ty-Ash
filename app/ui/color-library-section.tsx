import Image from "next/image";
import type { ReactNode } from "react";

type ColorStory = {
  slug: string;
  name: string;
  feeling: string;
  words: string[];
  shades: { name: string; hex: string }[];
  note: string;
  alt: string;
};

const colors: ColorStory[] = [
  { slug: "blue", name: "Bleu", feeling: "Confiance · calme · expertise", words: ["Confiance", "Sérénité", "Expertise", "Technologie"], shades: [{ name: "Bleu ciel", hex: "#b9dceb" }, { name: "Bleu moyen", hex: "#4d8eb5" }, { name: "Bleu profond", hex: "#174f78" }, { name: "Bleu nuit", hex: "#102c46" }], note: "Foncé = plus institutionnel. Clair = plus doux ↓", alt: "Architecture contemporaine bleu profond au bord d’une eau calme" },
  { slug: "red", name: "Rouge", feeling: "Énergie · intensité · action", words: ["Énergie", "Passion", "Audace", "Action"], shades: [{ name: "Corail", hex: "#ee6a5a" }, { name: "Rouge vif", hex: "#d9212d" }, { name: "Rouge profond", hex: "#9e1b25" }, { name: "Bordeaux", hex: "#5c1725" }], note: "À petite dose, il attire immédiatement l’œil.", alt: "Étoffe rouge en mouvement et céramique rouge texturée" },
  { slug: "yellow", name: "Jaune", feeling: "Optimisme · créativité · proximité", words: ["Joie", "Créativité", "Chaleur", "Spontanéité"], shades: [{ name: "Jaune citron", hex: "#f4dc3d" }, { name: "Jaune soleil", hex: "#efbd25" }, { name: "Moutarde", hex: "#bf8e1d" }, { name: "Jaune pastel", hex: "#f7e9a6" }], note: "Vif = énergie. Doux = chaleur.", alt: "Fauteuil design jaune dans un studio baigné de soleil" },
  { slug: "green", name: "Vert", feeling: "Nature · équilibre · évolution", words: ["Nature", "Équilibre", "Croissance", "Renouveau"], shades: [{ name: "Vert sauge", hex: "#a9b7a0" }, { name: "Vert forêt", hex: "#244d35" }, { name: "Vert vif", hex: "#62a744" }, { name: "Vert olive", hex: "#707c3f" }], note: "Sauge apaise. Acidulé dynamise.", alt: "Feuillage vert et architecture contemporaine en pierre verte" },
  { slug: "orange", name: "Orange", feeling: "Énergie · convivialité · enthousiasme", words: ["Énergie", "Proximité", "Mouvement", "Convivialité"], shades: [{ name: "Pêche", hex: "#f3ad84" }, { name: "Orange vif", hex: "#eb6f1e" }, { name: "Orange brûlé", hex: "#bd4f22" }, { name: "Terracotta", hex: "#a95038" }], note: "Chaleureux sans être sage.", alt: "Intérieur chaleureux aux objets orange dans la lumière du soir" },
  { slug: "purple", name: "Violet", feeling: "Créativité · imagination · singularité", words: ["Créativité", "Imagination", "Singularité", "Mystère"], shades: [{ name: "Lilas", hex: "#c8afe0" }, { name: "Mauve", hex: "#9a75ad" }, { name: "Violet électrique", hex: "#7d37d8" }, { name: "Prune", hex: "#542847" }], note: "Lilas adoucit. Électrique affirme.", alt: "Intérieur artistique lilas avec lumière violette contemporaine" },
  { slug: "pink", name: "Rose", feeling: "Douceur · attention · modernité", words: ["Douceur", "Sensibilité", "Créativité", "Proximité"], shades: [{ name: "Rose poudré", hex: "#dfb2b2" }, { name: "Vieux rose", hex: "#b9787f" }, { name: "Fuchsia", hex: "#d72d7d" }, { name: "Rose saumon", hex: "#ed8f85" }], note: "Doux… mais aussi franchement audacieux.", alt: "Mobilier rose poudré et objet fuchsia dans un intérieur contemporain" },
  { slug: "brown", name: "Marron", feeling: "Authenticité · matière · ancrage", words: ["Matière", "Authenticité", "Savoir-faire", "Durabilité"], shades: [{ name: "Beige brun", hex: "#b69878" }, { name: "Caramel", hex: "#a96738" }, { name: "Terre", hex: "#774936" }, { name: "Chocolat", hex: "#442a24" }], note: "Naturel = chaleureux. Très sombre = plus premium.", alt: "Établi artisanal composé de bois, cuir et terre brune" },
  { slug: "black", name: "Noir", feeling: "Élégance · autorité · sophistication", words: ["Élégance", "Sobriété", "Autorité", "Exclusivité"], shades: [{ name: "Gris fumée", hex: "#6a6a68" }, { name: "Anthracite", hex: "#3c3c3d" }, { name: "Noir encre", hex: "#222225" }, { name: "Noir profond", hex: "#0d0d0f" }], note: "Puissant. À laisser respirer.", alt: "Architecture noire minimaliste aux matières mates et brillantes" },
  { slug: "cream", name: "Blanc & crème", feeling: "Simplicité · respiration · clarté", words: ["Clarté", "Espace", "Calme", "Minimalisme"], shades: [{ name: "Blanc", hex: "#ffffff" }, { name: "Blanc cassé", hex: "#f7f3e9" }, { name: "Crème", hex: "#eee2cb" }, { name: "Beige clair", hex: "#ddd0bb" }], note: "Le vide aussi fait partie de l’identité.", alt: "Papier artisanal et textile crème dans un intérieur lumineux" },
];

function ColorMoodboard({ color, index }: { color: ColorStory; index: number }) {
  const reversed = index % 2 === 1;
  return (
    <article className="border-t border-[#d8cbb9] pt-5">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-[0.65rem] font-black tracking-[0.2em] text-[#cf7430]">{String(index + 1).padStart(2, "0")}</p><h3 className="mt-2 font-[family-name:var(--font-cormorant)] text-4xl font-semibold leading-none text-[#24364f]">{color.name}</h3></div>
        <p className="max-w-48 text-right font-[family-name:var(--font-cormorant)] text-lg italic leading-tight text-[#625a52]">{color.feeling}</p>
      </div>
      <div className={`mt-6 grid grid-cols-[minmax(0,1.3fr)_minmax(6rem,0.7fr)] gap-3 ${reversed ? "direction-rtl" : ""}`}>
        <div className={`relative aspect-[4/5] overflow-hidden ${reversed ? "order-2" : ""}`}><Image src={`/brand-studio/examples/colors/${color.slug}-main.webp`} alt={color.alt} fill sizes="(min-width: 768px) 30vw, 62vw" className="object-cover transition-transform duration-700 motion-reduce:transition-none hover:scale-[1.02]" /></div>
        <div className={`relative mt-10 aspect-[4/5] overflow-hidden ${reversed ? "order-1" : ""}`}><Image src={`/brand-studio/examples/colors/${color.slug}-detail.webp`} alt={`Détail de l’univers ${color.name.toLowerCase()}`} fill sizes="(min-width: 768px) 18vw, 30vw" className="object-cover" /></div>
      </div>
      <div className="mt-5 grid grid-cols-4 gap-1.5" aria-label={`Nuances de ${color.name}`}>
        {color.shades.map((shade) => <div key={shade.name} tabIndex={0} title={shade.name} className="group relative h-11 outline-none ring-[#cf7430] focus-visible:ring-2" style={{ backgroundColor: shade.hex }}><span className="pointer-events-none absolute inset-x-0 bottom-full z-10 mx-auto mb-1 hidden w-max max-w-28 bg-[#24364f] px-2 py-1 text-center text-[0.58rem] font-bold uppercase tracking-wide text-white group-hover:block group-focus:block">{shade.name}</span></div>)}
      </div>
      <p className="mt-4 text-[0.64rem] font-black uppercase leading-5 tracking-[0.11em] text-[#625a52]">{color.words.join(" · ")}</p>
      <p className="font-more-sugar mt-3 text-base leading-5 text-[#cf7430]">{color.note}</p>
    </article>
  );
}

export default function ColorLibrarySection({ recap }: { recap: ReactNode }) {
  return (
    <div className="overflow-hidden text-[#5f544a]">
      <section className="pb-14 sm:pb-20">
        <h2 className="font-[family-name:var(--font-cormorant)] text-[clamp(2.4rem,6vw,4.8rem)] font-semibold leading-[0.92] tracking-[-0.04em] text-[#24364f]">Avant les mots,<br />il y a déjà une <em className="text-[#cf7430]">impression.</em></h2>
        <p className="mt-6 max-w-2xl text-sm leading-7 sm:text-base">Une couleur peut rendre une marque calme, énergique, premium, accessible ou créative avant même qu’on ait lu son nom.</p>
        <blockquote className="mt-9 border-l-2 border-[#cf7430] py-2 pl-5 font-[family-name:var(--font-cormorant)] text-3xl font-semibold text-[#24364f] sm:text-4xl">Quelle impression veux-tu laisser ?</blockquote>
        <p className="font-more-sugar mt-4 text-lg text-[#cf7430]">On part de là ↓</p>
      </section>

      <section className="py-12 sm:py-16">
        <p className="text-[0.66rem] font-black uppercase tracking-[0.2em] text-[#cf7430]">La symbolique des couleurs</p>
        <h2 className="mt-3 font-[family-name:var(--font-cormorant)] text-3xl font-semibold leading-tight text-[#24364f] sm:text-4xl">Une couleur ne dit jamais<br />une seule chose.</h2>
        <p className="mt-4 max-w-2xl text-sm leading-7">Sa nuance, les couleurs qui l’accompagnent et l’univers visuel peuvent complètement changer ce qu’elle raconte.</p>
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[{ name: "Bleu pastel", hex: "#c9e3ed", words: "DOUCEUR · CALME", text: "#24364f" }, { name: "Bleu nuit", hex: "#162f49", words: "EXPERTISE · CONFIANCE", text: "white" }, { name: "Bleu électrique", hex: "#156ee8", words: "ÉNERGIE · TECHNOLOGIE", text: "white" }].map((shade) => <div key={shade.name} className="flex min-h-32 flex-col justify-between p-4" style={{ backgroundColor: shade.hex, color: shade.text }}><p className="text-[0.65rem] font-black uppercase tracking-[0.15em]">{shade.name}</p><p className="text-xs font-black tracking-[0.1em]">{shade.words}</p></div>)}
        </div>
        <p className="font-more-sugar mt-5 text-lg text-[#cf7430]">Même couleur. Pas la même histoire.</p>
      </section>

      <section aria-label="Bibliothèque des couleurs" className="py-14 sm:py-20">
        <div className="grid grid-cols-1 gap-x-9 gap-y-16 md:grid-cols-2">{colors.slice(0, 4).map((color, index) => <ColorMoodboard key={color.slug} color={color} index={index} />)}</div>
        <div className="my-20 py-10 text-center">
          <h2 className="font-[family-name:var(--font-cormorant)] text-4xl font-semibold text-[#24364f]">La nuance change tout.</h2>
          <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-4">{[{ n: "Vert sauge", w: "calme", h: "#a9b7a0" }, { n: "Vert forêt", w: "naturel", h: "#244d35" }, { n: "Vert émeraude", w: "premium", h: "#13745d" }, { n: "Vert acidulé", w: "énergique", h: "#8fbd32" }].map((item) => <div key={item.n} className="flex aspect-square flex-col justify-end p-3 text-left text-white" style={{ backgroundColor: item.h }}><p className="text-[0.62rem] font-black uppercase tracking-wide">{item.n}</p><p className="mt-1 font-[family-name:var(--font-cormorant)] text-xl">« {item.w} »</p></div>)}</div>
          <p className="font-more-sugar mt-5 text-lg text-[#cf7430]">Ne choisis donc jamais juste « du vert ».</p>
        </div>
        <div className="grid grid-cols-1 gap-x-9 gap-y-16 md:grid-cols-2">{colors.slice(4).map((color, offset) => <ColorMoodboard key={color.slug} color={color} index={offset + 4} />)}</div>
      </section>

      <section className="py-16 sm:py-20"><p className="text-[0.66rem] font-black uppercase tracking-[0.2em] text-[#cf7430]">L’antisèche</p><h2 className="mt-3 font-[family-name:var(--font-cormorant)] text-4xl font-semibold text-[#24364f]">À garder sous la main.</h2><p className="mt-4 max-w-2xl text-sm leading-7">Quelques repères pour comparer rapidement les grands territoires associés aux couleurs.</p>{recap}</section>

      <section className="py-16 text-center sm:py-24">
        <p className="text-[0.66rem] font-black uppercase tracking-[0.2em] text-[#cf7430]">Avant de choisir</p>
        <p className="mx-auto mt-6 max-w-3xl font-[family-name:var(--font-cormorant)] text-3xl leading-tight text-[#7c736b] sm:text-5xl">Ne pars pas de :<br />« Quelle couleur j’aime ? »</p><p className="my-6 text-3xl text-[#cf7430]">↓</p>
        <p className="mx-auto max-w-3xl font-[family-name:var(--font-cormorant)] text-4xl font-semibold leading-tight text-[#24364f] sm:text-6xl">Pars de :<br />« Quelle <em className="text-[#cf7430]">impression</em> je veux laisser ? »</p>
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">{["Ce que ta marque doit faire ressentir", "La personnalité que tu veux affirmer", "Les couleurs qui fonctionnent ensemble"].map((label, index) => <div key={label} className="border-t border-[#d8cbb9] pt-4 text-left"><p className="text-[0.65rem] font-black tracking-[0.2em] text-[#cf7430]">0{index + 1}</p><p className="mt-4 text-xs font-black uppercase leading-5 tracking-[0.1em] text-[#24364f]">{label}</p></div>)}</div>
      </section>

      <section className="py-14 sm:py-20"><h2 className="font-[family-name:var(--font-cormorant)] text-4xl font-semibold text-[#24364f]">Une palette, c’est une équipe.</h2><div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">{[{ n: "Fond", h: "#f5eddf", t: "#24364f" }, { n: "Principale", h: "#24364f", t: "white" }, { n: "Accent", h: "#cf7430", t: "white" }, { n: "Contraste", h: "#f0cf55", t: "#24364f" }].map((item) => <div key={item.n}><div className="aspect-[4/3]" style={{ backgroundColor: item.h }} /><p className="mt-3 text-center text-[0.62rem] font-black uppercase tracking-[0.15em]" style={{ color: item.t === "white" ? "#625a52" : item.t }}>{item.n}</p></div>)}</div><p className="font-more-sugar mt-6 text-lg text-[#cf7430]">Toutes les couleurs n’ont pas besoin de crier en même temps.</p></section>

      <section className="py-16 text-center sm:py-24"><p className="text-[0.66rem] font-black uppercase tracking-[0.2em] text-[#cf7430]">À retenir</p><h2 className="mx-auto mt-7 max-w-3xl font-[family-name:var(--font-cormorant)] text-[clamp(3rem,8vw,6rem)] font-semibold leading-[0.88] tracking-[-0.045em] text-[#24364f]">Ne choisis pas<br />une couleur.<br /><br />Choisis une<br /><em className="text-[#cf7430]">impression.</em></h2><p className="mt-8 text-sm text-[#625a52] sm:text-base">Et construis ta palette autour d’elle.</p><p className="font-more-sugar mt-4 text-xl text-[#cf7430]">À toi de jouer ↓</p></section>
    </div>
  );
}
