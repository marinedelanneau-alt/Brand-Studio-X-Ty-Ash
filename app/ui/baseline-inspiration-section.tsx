const ingredients = [
  ["01", "Ce que tu fais", "Le point de départ pour comprendre ton activité."],
  ["02", "Ce qui te rend différent", "Ta manière de faire, ton parti pris, ton savoir-faire."],
  ["03", "Ce que ça change pour ton client", "Le bénéfice ou la transformation que tu apportes."],
];

const comparisons = [
  {
    activity: "Céramiste",
    before: "Créations artisanales en céramique",
    after: "Des objets faits pour rester.",
    meaning: "On ne parle plus seulement du produit : on commence à raconter la durabilité, l’attachement et le savoir-faire.",
  },
  {
    activity: "Photographe",
    before: "Photographe pour entrepreneurs",
    after: "Montrer ce qui te rend unique.",
    meaning: "L’activité laisse place au bénéfice : aider la personne à révéler ce qui la différencie.",
  },
  {
    activity: "Pâtisserie sur-mesure",
    before: "Gâteaux personnalisés pour vos événements",
    after: "Un souvenir à partager.",
    meaning: "La baseline ne décrit plus seulement le gâteau : elle raconte le moment auquel il participe.",
  },
];

const directions = [
  ["01", "Expliquer", "Dire clairement ce que tu proposes.", "Le studio photo des entrepreneurs."],
  ["02", "Promettre", "Mettre en avant le résultat.", "Une communication enfin plus claire."],
  ["03", "Se différencier", "Faire ressortir ton parti pris.", "Moins de bruit. Plus d’idées."],
  ["04", "Faire ressentir", "Créer une émotion ou une projection.", "Des objets faits pour rester."],
];

const pitfalls = [
  ["01 — Le jargon", "Des solutions innovantes au service de votre performance.", "Ça pourrait être qui ? À peu près tout le monde."],
  ["02 — La phrase à rallonge", "Nous accompagnons les entrepreneurs dans le développement d’une stratégie personnalisée, performante et adaptée à leurs objectifs.", "Trop d’informations = aucune ne reste vraiment."],
  ["03 — La promesse vide", "Réinventons demain ensemble.", "Joli… mais demain, on fait quoi ?"],
];

const benefits = [
  "Résumer l’essentiel de ta marque en quelques mots",
  "Mettre davantage en avant ce qui te différencie",
  "Trouver une phrase facile à comprendre et à retenir",
  "Utiliser ta baseline comme fil rouge dans ta communication",
];

function SectionTitle({ children, id }: { children: React.ReactNode; id?: string }) {
  return <h2 id={id} className="font-[family-name:var(--font-cormorant)] text-3xl font-semibold leading-[1.05] text-[#24364f] sm:text-4xl">{children}</h2>;
}

export default function BaselineInspirationSection() {
  return (
    <div className="text-[#5f544a]">
      <section aria-labelledby="baseline-introduction-title" className="pb-10 sm:pb-12">
        <SectionTitle id="baseline-introduction-title">Quelques mots. Beaucoup à raconter.</SectionTitle>
        <div className="mt-5 max-w-3xl space-y-3 text-sm leading-7 sm:text-base">
          <p>Ta baseline est cette petite phrase qui accompagne ton nom et aide à comprendre rapidement ce que ta marque a de particulier.</p>
          <p>Elle peut expliquer ce que tu fais, mettre en avant ta différence ou simplement faire ressentir ta promesse.</p>
          <p>Le défi ? Dire suffisamment pour être compris, sans essayer de tout raconter.</p>
        </div>
        <blockquote className="mt-7 max-w-3xl border-l-2 border-[#cf7430] pl-5 font-[family-name:var(--font-cormorant)] text-2xl font-medium leading-tight text-[#24364f] sm:text-[1.8rem]">Si tu devais laisser une seule phrase sous ton nom, laquelle voudrais-tu qu’on retienne ?</blockquote>
      </section>

      <section aria-label="Trois repères pour construire une baseline" className="border-y border-[#eadfca] py-9 sm:py-10">
        <div className="grid grid-cols-1 gap-y-7 md:grid-cols-3 md:gap-x-7">
          {ingredients.map(([number, title, description]) => (
            <article key={number} className="border-t border-[#cfc3b2] pt-4">
              <p className="text-xs font-extrabold tracking-[0.18em] text-[#cf7430]">{number}</p>
              <h3 className="mt-4 text-xs font-black uppercase leading-5 tracking-[0.13em] text-[#24364f]">{title}</h3>
              <p className="mt-3 text-sm leading-6">{description}</p>
            </article>
          ))}
        </div>
        <p className="font-more-sugar mt-7 text-lg text-[#cf7430]">Pas besoin de tout mettre dans ta baseline ↓</p>
        <p className="mt-2 max-w-2xl text-sm leading-6">Ces trois éléments sont des pistes pour trouver l’idée juste, pas une formule à remplir mot pour mot.</p>
      </section>

      <section aria-labelledby="baseline-comparisons-title" className="py-10 sm:py-12">
        <p className="text-[0.7rem] font-black uppercase tracking-[0.2em] text-[#cf7430]">Avant · Après</p>
        <div className="mt-3"><SectionTitle id="baseline-comparisons-title">Même activité. Pas la même impression.</SectionTitle></div>
        <p className="mt-4 max-w-2xl text-sm leading-7 sm:text-base">Une baseline peut simplement décrire ce que tu fais… ou commencer à raconter pourquoi on devrait te choisir.</p>

        <div className="mt-9">
          {comparisons.map((comparison) => (
            <article key={comparison.activity} className="grid gap-5 border-t border-[#cfc3b2] py-8 md:grid-cols-[minmax(0,0.8fr)_2rem_minmax(0,1.2fr)] md:gap-7">
              <div>
                <p className="text-[0.66rem] font-black uppercase tracking-[0.18em] text-[#7a7087]">{comparison.activity} · Avant</p>
                <p className="mt-4 max-w-sm text-lg leading-snug text-[#756b63]">{comparison.before}</p>
              </div>
              <div aria-hidden="true" className="flex items-center text-xl text-[#cf7430]"><span className="md:hidden">↓</span><span className="hidden md:inline">→</span></div>
              <div>
                <p className="text-[0.66rem] font-black uppercase tracking-[0.18em] text-[#cf7430]">Après</p>
                <p className="mt-3 max-w-xl font-[family-name:var(--font-cormorant)] text-[clamp(2.25rem,5vw,3.7rem)] font-semibold leading-[0.92] tracking-[-0.035em] text-[#24364f]">{comparison.after}</p>
                <p className="font-more-sugar mt-4 max-w-xl text-base leading-6 text-[#cf7430]">↳ {comparison.meaning}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="border-t border-[#cfc3b2] pt-7">
          <h3 className="font-[family-name:var(--font-cormorant)] text-3xl font-semibold text-[#24364f]">Tu vois la différence ?</h3>
          <p className="mt-2 text-sm leading-6">La première phrase explique. La seconde commence à positionner la marque.</p>
          <p className="font-more-sugar mt-3 text-lg text-[#cf7430]">C’est là que ça devient intéressant.</p>
        </div>
      </section>

      <section aria-labelledby="baseline-directions-title" className="border-y border-[#eadfca] py-10 sm:py-12">
        <SectionTitle id="baseline-directions-title">Il n’y a pas qu’une seule bonne façon de le dire.</SectionTitle>
        <p className="mt-4 max-w-3xl text-sm leading-7 sm:text-base">Selon ta marque, tu peux choisir de mettre l’accent sur ton activité, ta différence, ton bénéfice ou une idée plus émotionnelle.</p>
        <div className="mt-8 grid grid-cols-1 gap-x-7 gap-y-7 sm:grid-cols-2">
          {directions.map(([number, title, description, example]) => (
            <article key={number} className="border-t border-[#cfc3b2] pt-4">
              <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-[#cf7430]">{number} — {title}</p>
              <p className="mt-3 text-sm leading-6">{description}</p>
              <p className="mt-4 font-[family-name:var(--font-cormorant)] text-2xl font-medium leading-tight text-[#24364f]">« {example} »</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="three-seconds-title" className="py-10 sm:py-12">
        <SectionTitle id="three-seconds-title">Le test des 3 secondes</SectionTitle>
        <p className="mt-3 text-sm leading-6 sm:text-base">Lis ta baseline une fois, puis cache-la.</p>
        <ol className="mt-7 grid list-none gap-4 p-0 md:grid-cols-3">
          {["Est-ce que je comprends l’idée ?", "Est-ce que je pourrais la retenir ?", "Est-ce qu’elle pourrait appartenir à n’importe quel concurrent ?"].map((question, index) => (
            <li key={question} className="border-t border-[#cfc3b2] pt-4"><span className="text-xs font-extrabold tracking-[0.18em] text-[#cf7430]">0{index + 1}</span><p className="mt-4 font-[family-name:var(--font-cormorant)] text-xl font-semibold leading-snug text-[#24364f]">{question}</p></li>
          ))}
        </ol>
        <p className="mt-7 max-w-3xl border-l-2 border-[#cf7430] pl-5 text-sm font-semibold leading-6 text-[#4f463f]">Si les deux premières réponses sont OUI et la dernière NON, tu tiens probablement quelque chose.</p>
        <p className="font-more-sugar mt-3 text-lg text-[#cf7430]">Simple, mais redoutablement utile.</p>
      </section>

      <section aria-labelledby="baseline-pitfalls-title" className="border-y border-[#eadfca] py-10">
        <SectionTitle id="baseline-pitfalls-title">Attention aux phrases qui veulent trop bien faire.</SectionTitle>
        <div className="mt-8 grid grid-cols-1 gap-y-7 md:grid-cols-3 md:gap-x-7">
          {pitfalls.map(([title, example, note]) => (
            <article key={title} className="border-t border-[#cfc3b2] pt-4">
              <h3 className="text-[0.68rem] font-black uppercase tracking-[0.14em] text-[#cf7430]">{title}</h3>
              <p className="mt-4 font-[family-name:var(--font-cormorant)] text-xl leading-snug text-[#24364f]">« {example} »</p>
              <p className="font-more-sugar mt-4 text-base leading-6 text-[#9b612e]">{note}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="baseline-benefits-title" className="py-10 sm:py-12">
        <SectionTitle id="baseline-benefits-title">Ce que cet exercice va t’apporter</SectionTitle>
        <p className="mt-3 text-sm leading-6 sm:text-base">À la fin de cette réflexion, tu seras capable de :</p>
        <ul className="mt-6 grid list-none gap-x-8 gap-y-3 p-0 md:grid-cols-2">
          {benefits.map((benefit) => <li key={benefit} className="flex gap-3 text-sm leading-6"><span aria-hidden="true" className="font-bold text-[#cf7430]">✓</span><span>{benefit}</span></li>)}
        </ul>
      </section>

      <section aria-labelledby="baseline-takeaway-title" className="border-t border-[#eadfca] pt-10 sm:pt-12">
        <p className="text-[0.7rem] font-black uppercase tracking-[0.2em] text-[#cf7430]">À retenir</p>
        <h2 id="baseline-takeaway-title" className="mt-3 max-w-3xl font-[family-name:var(--font-cormorant)] text-2xl font-medium leading-tight text-[#24364f] sm:text-3xl">Ta baseline n’a pas besoin de raconter toute ton entreprise.</h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 sm:text-base">Elle doit simplement donner la bonne clé de lecture pour comprendre ce qui rend ta marque intéressante.</p>
        <p className="mt-7 max-w-3xl border-l-2 border-[#cf7430] pl-5 font-[family-name:var(--font-cormorant)] text-xl font-semibold leading-snug text-[#24364f] sm:text-2xl">Qu’est-ce que je veux que quelqu’un comprenne ou ressente en quelques secondes en découvrant ma marque ?</p>
        <p className="font-more-sugar mt-4 text-lg text-[#cf7430]">C’est cette idée qu’on va chercher maintenant ↓</p>
      </section>
    </div>
  );
}
