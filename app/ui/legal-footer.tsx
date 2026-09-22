import Link from "next/link";
import { copyrightText } from "@/lib/legal-policy";
export default function LegalFooter() {
  return <footer className="mt-auto border-t border-[#eadfca] bg-[#fbf7ef] px-5 py-6 text-center text-xs text-[#625a55] print:hidden">
    <nav aria-label="Informations légales" className="flex flex-wrap justify-center gap-4">
      <Link href="/retractation">Se rétracter du contrat</Link>
      <Link href="/mentions-legales">Mentions légales</Link><Link href="/conditions-generales-utilisation">CGU</Link><Link href="/conditions-generales-vente">CGV</Link><Link href="/politique-confidentialite">Confidentialité</Link><Link href="/mes-donnees">Mes données et mes droits</Link>
    </nav><p className="mt-4">{copyrightText()}</p>
  </footer>;
}
