const comparisons = [
  { activity: "Céramiste", before: <>Créations artisanales<br />en céramique</>, after: <>Des objets<br />faits pour rester.</>, keywords: "DURABILITÉ · SAVOIR-FAIRE · ATTACHEMENT" },
  { activity: "Photographe", before: <>Photographe pour<br />entrepreneurs</>, after: <>Montrer ce qui<br />te rend unique.</>, keywords: "DIFFÉRENCE · IMAGE · PERSONNALITÉ" },
  { activity: "Pâtisserie sur-mesure", before: <>Gâteaux personnalisés<br />pour vos événements</>, after: <>Un souvenir<br />à partager.</>, keywords: "ÉMOTION · MOMENT · SOUVENIR" },
];

const directions = [
  ["01", "Expliquer", "Le studio photo des entrepreneurs."],
  ["02", "Promettre", "Une communication enfin plus claire."],
  ["03", "Se différencier", "Moins de bruit. Plus d’idées."],
  ["04", "Faire ressentir", "Des objets faits pour rester."],
];

function SectionTitle({ children, id }: { children: React.ReactNode; id?: string }) {
  return <h2 id={id} className="font-[family-name:var(--font-cormorant)] text-3xl font-semibold leading-[1.02] text-[#24364f] sm:text-4xl">{children}</h2>;
}

export default function BaselineInspirationSection() {
  return (
    <div className="overflow-hidden text-[#5f544a]">
      <section aria-labelledby="baseline-introduction-title" className="pb-14 sm:pb-20">
        <SectionTitle id="baseline-introduction-title">Quelques mots. Beaucoup à raconter.</SectionTitle>
        <p className="mt-5 max-w-2xl text-sm leading-7 sm:text-base">Ta baseline accompagne ton nom et résume en quelques mots ce qui rend ta marque particulière.</p>
        <blockquote className="mt-9 max-w-3xl border-l-2 border-[#cf7430] py-2 pl-5 font-[family-name:var(--font-cormorant)] text-[clamp(1.8rem,4vw,3rem)] font-medium leading-[1.05] tracking-[-0.025em] text-[#24364f]">Si tu devais laisser une seule phrase sous ton nom, laquelle voudrais-tu qu’on retienne ?</blockquote>
      </section>

      <section aria-label="Trois pistes pour construire une baseline" className="py-10 sm:py-14">
        <div className="grid items-center gap-5 text-center md:grid-cols-[1fr_auto_1fr_auto_1fr] md:gap-4">
          {[["01", <>Ce que<br />tu fais</>], ["02", <>Ta<br />différence</>], ["03", <>Ce que<br />ça change</>]].map(([number, label], index) => (
            <div key={String(number)} className="contents">
              {index > 0 ? <span aria-hidden="true" className="text-2xl font-light text-[#cf7430]">+</span> : null}
              <div className="mx-auto flex min-h-32 w-full max-w-56 flex-col items-center justify-center border-y border-[#d8cbb9] px-4 py-6">
                <span className="text-[0.66rem] font-black tracking-[0.2em] text-[#cf7430]">{number}</span>
                <span className="mt-3 font-[family-name:var(--font-cormorant)] text-2xl font-semibold uppercase leading-[0.95] text-[#24364f]">{label}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 text-center">
          <span aria-hidden="true" className="text-2xl text-[#cf7430]">↓</span>
          <p className="mt-2 font-[family-name:var(--font-cormorant)] text-4xl font-semibold tracking-[-0.03em] text-[#24364f]">Ta baseline</p>
          <p className="font-more-sugar mt-5 text-lg text-[#cf7430]">Pas besoin de tout mettre ↓</p>
          <p className="mt-1 text-xs text-[#7a7068]">Ce sont des pistes, pas une formule.</p>
        </div>
      </section>

      <section aria-labelledby="baseline-comparisons-title" className="py-14 sm:py-20">
        <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-[#cf7430]">Avant · Après</p>
        <div className="mt-3"><SectionTitle id="baseline-comparisons-title">Même activité. Pas la même impression.</SectionTitle></div>
        <div className="mt-10">
          {comparisons.map((comparison) => (
            <article key={comparison.activity} className="border-t border-[#d8cbb9] py-10 sm:py-14">
              <p className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-[#cf7430]">{comparison.activity}</p>
              <div className="mt-7 grid items-center gap-6 md:grid-cols-[minmax(0,0.72fr)_3rem_minmax(0,1.28fr)] md:gap-8">
                <div><p className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-[#938980]">Avant</p><p className="mt-3 text-base leading-relaxed text-[#81776f] sm:text-lg">« {comparison.before} »</p></div>
                <div aria-hidden="true" className="text-3xl font-light text-[#cf7430]"><span className="md:hidden">↓</span><span className="hidden md:inline">→</span></div>
                <div className="py-3 md:py-6">
                  <p className="text-[0.62rem] font-black uppercase tracking-[0.18em] text-[#cf7430]">Après</p>
                  <p className="mt-4 font-[family-name:var(--font-cormorant)] text-[clamp(3rem,7vw,5.7rem)] font-semibold leading-[0.82] tracking-[-0.045em] text-[#24364f]">« {comparison.after} »</p>
                  <p className="mt-7 text-[0.65rem] font-black uppercase leading-5 tracking-[0.13em] text-[#b4662a]">{comparison.keywords}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="border-t border-[#d8cbb9] py-12 text-center sm:py-16">
          <p className="text-[0.66rem] font-black uppercase tracking-[0.22em] text-[#8a8077]">Décrire</p><p aria-hidden="true" className="my-3 text-2xl text-[#cf7430]">↓</p>
          <p className="font-[family-name:var(--font-cormorant)] text-5xl font-semibold tracking-[-0.04em] text-[#24364f] sm:text-7xl">Raconter</p>
          <p className="font-more-sugar mx-auto mt-5 max-w-lg text-lg leading-6 text-[#cf7430]">C’est là que ta marque commence à prendre sa place.</p>
        </div>
      </section>

      <section aria-labelledby="baseline-directions-title" className="py-14 sm:py-20">
        <SectionTitle id="baseline-directions-title">Qu’est-ce que tu veux faire passer ?</SectionTitle>
        <div className="mt-9 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 xl:grid-cols-4">
          {directions.map(([number, title, example]) => (
            <article key={number} className="border-t border-[#d8cbb9] pt-4">
              <p className="text-[0.65rem] font-black tracking-[0.2em] text-[#cf7430]">{number}</p>
              <h3 className="mt-5 text-[0.68rem] font-black uppercase tracking-[0.14em] text-[#24364f]">{title}</h3>
              <p className="mt-5 font-[family-name:var(--font-cormorant)] text-2xl font-medium leading-[1.05] text-[#24364f]">« {example} »</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="three-seconds-title" className="my-10 bg-[#fbf6ed] px-5 py-10 sm:my-14 sm:px-8 sm:py-12">
        <SectionTitle id="three-seconds-title">Le test des 3 secondes</SectionTitle>
        <div className="mt-9 grid grid-cols-1 gap-y-8 md:grid-cols-3 md:gap-x-7">
          {[["01", <>Je comprends ?</>, "✓ OUI"], ["02", <>Je retiens ?</>, "✓ OUI"], ["03", <>Un concurrent<br />pourrait dire pareil ?</>, "× NON"]].map(([number, question, answer]) => (
            <div key={String(number)} className="border-t border-[#cfc3b2] pt-4">
              <p className="text-[0.65rem] font-black tracking-[0.2em] text-[#cf7430]">{number}</p>
              <p className="mt-5 text-sm font-black uppercase leading-5 tracking-[0.1em] text-[#24364f]">{question}</p>
              <p className="mt-6 font-[family-name:var(--font-cormorant)] text-3xl font-semibold text-[#cf7430]">{answer}</p>
            </div>
          ))}
        </div>
        <p className="font-more-sugar mt-9 text-center text-xl text-[#cf7430]">Alors tu tiens quelque chose.</p>
      </section>

      <section aria-label="Résultats de l’exercice" className="py-14 sm:py-20">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-baseline lg:gap-8">
          <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-[#cf7430]">À la fin →</p>
          <p className="font-[family-name:var(--font-cormorant)] text-[clamp(1.8rem,4.5vw,3.5rem)] font-semibold uppercase leading-tight tracking-[-0.025em] text-[#24364f]">Clarifier <span className="text-[#cf7430]">·</span> Différencier <span className="text-[#cf7430]">·</span> Résumer <span className="text-[#cf7430]">·</span> Faire retenir</p>
        </div>
        <p className="font-more-sugar mt-6 text-lg text-[#cf7430]">Et surtout : arrêter de chercher tes mots à chaque fois.</p>
      </section>

      <section aria-labelledby="baseline-takeaway-title" className="py-14 text-center sm:py-24">
        <p className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-[#cf7430]">À retenir</p>
        <h2 id="baseline-takeaway-title" className="mx-auto mt-7 max-w-3xl font-[family-name:var(--font-cormorant)] text-[clamp(2.7rem,7vw,5.6rem)] font-medium leading-[0.9] tracking-[-0.045em] text-[#24364f]">Ta baseline<br />ne doit pas tout dire.<br /><br />Elle doit donner<br />envie de comprendre<br /><em className="text-[#cf7430]">la suite.</em></h2>
        <p className="mx-auto mt-10 max-w-xl font-[family-name:var(--font-cormorant)] text-xl font-semibold leading-snug text-[#24364f] sm:text-2xl">Qu’est-ce que je veux qu’on comprenne ou ressente en quelques secondes ?</p>
        <p className="font-more-sugar mt-5 text-xl text-[#cf7430]">À toi de jouer ↓</p>
      </section>
    </div>
  );
}
