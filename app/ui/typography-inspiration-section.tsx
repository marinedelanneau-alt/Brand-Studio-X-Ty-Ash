const typeSpecimens = [
  {
    number: "01",
    fontClass: "font-[family-name:var(--font-cormorant)]",
    wordClass: "font-medium tracking-[-0.045em]",
    qualities: "ÉLÉGANT · RAFFINÉ · INTEMPOREL",
    description: "Une serif peut apporter du caractère, de l’élégance et une dimension plus éditoriale.",
  },
  {
    number: "02",
    fontClass: "font-[family-name:var(--font-manrope)]",
    wordClass: "font-semibold tracking-[-0.055em]",
    qualities: "CLAIR · MODERNE · DIRECT · ACCESSIBLE",
    description: "Une sans-serif peut donner une impression plus simple, contemporaine et immédiate.",
  },
  {
    number: "03",
    fontClass: "font-more-sugar",
    wordClass: "font-normal",
    qualities: "HUMAIN · CRÉATIF · SPONTANÉ · PERSONNEL",
    description: "Une typographie plus expressive peut donner davantage de personnalité et de proximité.",
  },
];

const goodReflexes = [
  ["01", "Reste lisible.", "Une typographie peut avoir du caractère sans demander un effort pour être lue."],
  ["02", "Reste cohérent.", "Tes typographies doivent raconter la même personnalité que tes couleurs, tes images et ta tonalité."],
  ["03", "Reste simple.", "Deux familles bien choisies valent mieux qu’une accumulation de polices."],
];

const benefits = [
  "Choisir des typographies cohérentes avec la personnalité de ta marque",
  "Créer une hiérarchie claire entre tes titres et tes textes",
  "Construire un univers visuel plus reconnaissable",
  "Utiliser les mêmes codes typographiques dans tes différents supports",
];

function EditorialTitle({ children, id }: { children: React.ReactNode; id?: string }) {
  return <h2 id={id} className="font-[family-name:var(--font-cormorant)] text-3xl font-semibold leading-[1.05] text-[var(--heading-color)] sm:text-4xl">{children}</h2>;
}

export default function TypographyInspirationSection() {
  return (
    <div className="text-[var(--text-primary)]">
      <section aria-labelledby="typography-introduction-title" className="pb-10 sm:pb-12">
        <EditorialTitle id="typography-introduction-title">Pourquoi réfléchir aux typographies de sa marque ?</EditorialTitle>
        <div className="mt-5 max-w-3xl space-y-3 text-sm leading-7 sm:text-base">
          <p>Avant même de lire un mot, sa forme nous raconte déjà quelque chose.</p>
          <p>Une typographie fine et élégante ne crée pas la même impression qu’une police ronde, massive ou manuscrite. Tes typographies participent donc pleinement à la personnalité de ta marque.</p>
          <p>L’objectif n’est pas de choisir simplement une police que tu trouves jolie, mais une typographie qui raconte la même histoire que le reste de ton univers.</p>
        </div>
        <blockquote className="mt-7 max-w-2xl border-l-2 border-[var(--tyash-primary)] pl-5 font-[family-name:var(--font-cormorant)] text-2xl font-medium leading-tight text-[var(--heading-color)] sm:text-[1.8rem]">
          Ta typographie donne une voix à tes mots avant même qu’on les lise.
        </blockquote>
      </section>

      <section aria-labelledby="type-specimens-title" className="border-y border-[var(--border)] py-10 sm:py-12">
        <EditorialTitle id="type-specimens-title">Un même mot. Trois impressions.</EditorialTitle>
        <p className="mt-3 max-w-xl text-sm leading-6 sm:text-base">Regarde comme quelques lettres suffisent déjà à changer notre perception.</p>

        <div className="mt-9 grid grid-cols-1 gap-y-10 md:grid-cols-2 md:gap-x-7 xl:grid-cols-3">
          {typeSpecimens.map((specimen) => (
            <article key={specimen.number} className="min-w-0 border-t border-[var(--border)] pt-4">
              <p className="text-[0.68rem] font-extrabold tracking-[0.2em] text-[var(--tyash-label-text)]">{specimen.number}</p>
              <p className={`${specimen.fontClass} ${specimen.wordClass} mt-8 max-w-full break-words text-[clamp(3.1rem,7vw,5.4rem)] leading-[0.82] text-[var(--heading-color)]`}>Imagine.</p>
              <p className="mt-8 text-[0.67rem] font-extrabold uppercase leading-5 tracking-[0.1em] text-[var(--text-primary)]">{specimen.qualities}</p>
              <p className="mt-3 max-w-sm text-sm leading-6">{specimen.description}</p>
            </article>
          ))}
        </div>
        <p className="font-more-sugar mt-7 text-lg text-[var(--tyash-label-text)] sm:ml-3">Ça change déjà l’ambiance, non ? ↗</p>
      </section>

      <section aria-labelledby="font-pairing-title" className="py-10 sm:py-12">
        <EditorialTitle id="font-pairing-title">Une bonne équipe plutôt qu’une collection de polices.</EditorialTitle>
        <p className="mt-4 max-w-2xl text-sm leading-7 sm:text-base">Tu n’as pas besoin de cinq typographies différentes pour créer un univers reconnaissable. Deux suffisent souvent largement : une qui attire l’œil, une qui facilite la lecture.</p>

        <div className="relative mt-8 overflow-hidden border-y border-[var(--border)] bg-[var(--background)] px-5 py-8 sm:px-8 sm:py-10">
          <div className="grid gap-9 lg:grid-cols-[minmax(0,1.15fr)_minmax(15rem,0.85fr)] lg:items-end">
            <div>
              <p className="text-[0.66rem] font-black uppercase tracking-[0.2em] text-[var(--tyash-label-text)]">Titre</p>
              <p className="mt-4 max-w-xl font-[family-name:var(--font-cormorant)] text-[clamp(2.7rem,6vw,4.8rem)] font-semibold leading-[0.88] tracking-[-0.04em] text-[var(--heading-color)]">Ta marque mérite<br />d’être remarquée.</p>
              <p className="font-more-sugar mt-5 text-base text-[var(--tyash-label-text)]">Typographie de caractère → titres, accroches, mots forts</p>
            </div>
            <div className="border-t border-[var(--border)] pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <p className="text-[0.66rem] font-black uppercase tracking-[0.2em] text-[var(--tyash-label-text)]">Texte</p>
              <p className="mt-4 max-w-md font-[family-name:var(--font-manrope)] text-base leading-7 text-[var(--text-primary)] sm:text-lg">Quelques mots pour raconter ton histoire simplement et donner envie de découvrir la suite.</p>
              <p className="font-more-sugar mt-5 text-base text-[var(--tyash-label-text)]">Typographie de lecture → paragraphes, informations, contenus</p>
            </div>
          </div>
          <p className="mt-8 text-center text-xs font-black uppercase tracking-[0.18em] text-[var(--text-muted)]">Typographie principale <span className="px-2 text-[var(--tyash-label-text)]">+</span> Typographie secondaire</p>
        </div>
      </section>

      <section aria-labelledby="good-reflex-title" className="border-y border-[var(--border)] py-10">
        <p className="font-more-sugar text-lg text-[var(--tyash-label-text)]">Le bon réflexe</p>
        <h2 id="good-reflex-title" className="sr-only">Trois bons réflexes typographiques</h2>
        <div className="mt-6 grid grid-cols-1 gap-y-7 md:grid-cols-3 md:gap-x-7">
          {goodReflexes.map(([number, title, description]) => (
            <article key={number} className="border-t border-[var(--border)] pt-4">
              <p className="text-xs font-extrabold tracking-[0.18em] text-[var(--tyash-label-text)]">{number}</p>
              <h3 className="mt-4 font-[family-name:var(--font-cormorant)] text-2xl font-semibold text-[var(--heading-color)]">{title}</h3>
              <p className="mt-2 text-sm leading-6">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="typography-benefits-title" className="py-10 sm:py-12">
        <EditorialTitle id="typography-benefits-title">Ce que cet exercice va t’apporter</EditorialTitle>
        <p className="mt-3 text-sm leading-6 sm:text-base">À la fin de cette réflexion, tu seras capable de :</p>
        <ul className="mt-6 grid list-none gap-x-8 gap-y-3 p-0 md:grid-cols-2">
          {benefits.map((benefit) => <li key={benefit} className="flex gap-3 text-sm leading-6"><span aria-hidden="true" className="font-bold text-[var(--tyash-label-text)]">✓</span><span>{benefit}</span></li>)}
        </ul>
      </section>

      <section aria-labelledby="typography-takeaway-title" className="border-t border-[var(--border)] pt-10 sm:pt-12">
        <p className="text-[0.7rem] font-black uppercase tracking-[0.2em] text-[var(--tyash-label-text)]">À retenir</p>
        <h2 id="typography-takeaway-title" className="mt-3 max-w-3xl font-[family-name:var(--font-cormorant)] text-2xl font-medium leading-tight text-[var(--heading-color)] sm:text-3xl">Une bonne typographie n’est pas seulement une belle typographie.</h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 sm:text-base">C’est une typographie qui ressemble à ta marque, reste facile à utiliser et crée une impression cohérente partout où elle apparaît.</p>
        <p className="mt-7 max-w-3xl border-l-2 border-[var(--tyash-primary)] pl-5 font-[family-name:var(--font-cormorant)] text-xl font-semibold leading-snug text-[var(--heading-color)] sm:text-2xl">Si ma marque parlait uniquement par la forme de ses mots, quelle impression voudrais-je qu’elle donne ?</p>
        <p className="font-more-sugar mt-4 text-lg text-[var(--tyash-label-text)]">Garde cette sensation en tête pour la suite ↘</p>
      </section>
    </div>
  );
}
