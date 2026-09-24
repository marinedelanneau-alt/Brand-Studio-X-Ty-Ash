import Image from "next/image";

export type ScentInspirationExampleProps = {
  title: string;
  images: { src: string; alt: string }[];
  sensations: string[];
  communicationTranslation: string;
  palette: string[];
};

const examples: ScentInspirationExampleProps[] = [
  {
    title: "Bois & forêt",
    images: [
      { src: "/brand-studio/examples/scent/forest-main.webp", alt: "Sous-bois profond éclairé par une lumière chaude, avec du bois brut et de la mousse" },
      { src: "/brand-studio/examples/scent/forest-detail.webp", alt: "Détail de bois brut couvert de mousse" },
    ],
    sensations: ["Ancré", "Authentique", "Stable", "Chaleureux"],
    communicationTranslation: "Matières brutes, lumière naturelle, couleurs terreuses, mots simples et rassurants.",
    palette: ["#173d2c", "#70482d", "#f4ead7", "#c8ae88"],
  },
  {
    title: "Linge propre & coton",
    images: [
      { src: "/brand-studio/examples/scent/cotton-main.webp", alt: "Draps de lin blanc cassé et fleurs de coton dans la lumière douce du matin" },
      { src: "/brand-studio/examples/scent/cotton-detail.webp", alt: "Détail délicat de coton sur du linge clair" },
    ],
    sensations: ["Simple", "Apaisant", "Délicat", "Épuré"],
    communicationTranslation: "Beaucoup d’espace, tons clairs, matières douces, images lumineuses et phrases calmes.",
    palette: ["#faf7ef", "#ddd1bc", "#aaa39b", "#dce7e8"],
  },
  {
    title: "Agrumes & fleur d’oranger",
    images: [
      { src: "/brand-studio/examples/scent/citrus-main.webp", alt: "Oranges et citrons frais, feuillage et fleur d’oranger sous le soleil méditerranéen" },
      { src: "/brand-studio/examples/scent/citrus-detail.webp", alt: "Détail d’agrumes lumineux et de feuillage vert" },
    ],
    sensations: ["Solaire", "Spontané", "Vivant", "Chaleureux"],
    communicationTranslation: "Couleurs lumineuses, images vivantes, contrastes plus francs et vocabulaire chaleureux.",
    palette: ["#e97418", "#f4c64d", "#47752f", "#fff1d8"],
  },
];

export function ScentInspirationExample({ title, images, sensations, communicationTranslation, palette }: ScentInspirationExampleProps) {
  return (
    <article className="group min-w-0">
      <div className="relative mb-5 pr-7 sm:pr-9">
        <div className="relative aspect-[4/5] overflow-hidden bg-[var(--surface-secondary)]">
          <Image src={images[0].src} alt={images[0].alt} fill sizes="(min-width: 1280px) 28vw, (min-width: 768px) 43vw, 88vw" className="object-cover transition-transform duration-700 ease-out motion-reduce:transition-none group-hover:scale-[1.025]" />
        </div>
        {images[1] ? (
          <div className="absolute -bottom-3 right-0 h-[29%] w-[42%] rotate-2 overflow-hidden border-[5px] border-[#fbf6ed] bg-[var(--surface-secondary)] transition-transform duration-500 motion-reduce:transition-none group-hover:-translate-y-1 group-hover:rotate-0">
            <Image src={images[1].src} alt={images[1].alt} fill sizes="180px" className="object-cover" />
          </div>
        ) : null}
      </div>

      <h3 className="font-[family-name:var(--font-cormorant)] text-[1.55rem] font-semibold leading-tight text-[var(--heading-color)]">{title}</h3>
      <p className="mt-2 text-[0.7rem] font-bold uppercase leading-5 tracking-[0.09em] text-[var(--text-primary)]">{sensations.join(" · ")}</p>
      <div className="mt-4 flex gap-2" aria-label={`Palette de couleurs pour ${title}`}>
        {palette.map((color) => <span key={color} className="h-4 w-4 rounded-full ring-1 ring-black/10" style={{ backgroundColor: color }}><span className="sr-only">Couleur {color}</span></span>)}
      </div>
      <p className="mt-4 max-w-sm text-sm leading-6 text-[var(--text-primary)]">
        <strong className="block font-extrabold text-[var(--tyash-label-text)]">Dans la communication →</strong>
        {communicationTranslation}
      </p>
    </article>
  );
}

export default function ScentInspirationSection() {
  return (
    <section aria-labelledby="scent-inspiration-title" className="my-10 border-y border-[var(--border)] py-9 sm:my-12 sm:py-11">
      <div className="max-w-2xl">
        <p className="font-more-sugar text-lg text-[var(--tyash-label-text)]">Quelques pistes pour commencer…</p>
        <h2 id="scent-inspiration-title" className="mt-1 font-[family-name:var(--font-cormorant)] text-3xl font-semibold leading-tight text-[var(--heading-color)] sm:text-4xl">Pour t’aider à sentir l’idée…</h2>
        <p className="mt-4 text-sm leading-6 text-[var(--text-primary)] sm:text-base sm:leading-7">Une odeur raconte souvent beaucoup plus qu’un parfum. Elle évoque une matière, une lumière, une ambiance, une émotion. Et tout cela peut ensuite se traduire dans ta communication.</p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-x-7 gap-y-12 md:grid-cols-2 xl:grid-cols-3">{examples.map((example) => <ScentInspirationExample key={example.title} {...example} />)}</div>

      <div className="mt-10 max-w-3xl border-l-2 border-[var(--border)] pl-5">
        <p className="text-sm italic leading-6 text-[var(--text-primary)]">Ce ne sont que des pistes. Ton univers peut sentir le café, la pluie, le cuir, le pain chaud, la mer, un jardin après l’orage… ou quelque chose de complètement différent.</p>
        <p className="font-more-sugar mt-3 text-lg text-[var(--tyash-label-text)]">Et la tienne, elle sentirait quoi ? ↘</p>
      </div>
    </section>
  );
}
