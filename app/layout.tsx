import type { Metadata } from "next";
import localFont from "next/font/local";
import { Caveat, Cormorant_Garamond, Manrope, Satisfy } from "next/font/google";
import { Suspense } from "react";
import ScrollToTop from "./ui/scroll-to-top";
import "./globals.css";
import { getCurrentAccount } from "@/lib/session";
import { isAdminDraftPreviewEnabled } from "@/lib/content-releases";
import PreviewAccessDenied from "./ui/preview-access-denied";
import ThemeToggle from "./ui/theme-toggle";
import LegalFooter from "./ui/legal-footer";
import { isLegalReleaseEnabled } from "@/lib/legal-release";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const satisfy = Satisfy({
  variable: "--font-satisfy",
  subsets: ["latin"],
  weight: "400",
});

const moreSugar = localFont({
  src: "../more_sugar/MoreSugar-Regular.otf",
  variable: "--font-more-sugar",
});

export const metadata: Metadata = {
  title: "Espace Client | Formation Brand Studio",
  description: "Accède à ton espace de formation via ton code d'accès.",
  robots: isAdminDraftPreviewEnabled()
    ? { index: false, follow: false, nocache: true }
    : undefined,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const account = isAdminDraftPreviewEnabled() ? await getCurrentAccount() : null;
  const previewDenied =
    account && account.role !== "admin" && account.is_admin !== true;

  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${manrope.variable} ${cormorant.variable} ${caveat.variable} ${satisfy.variable} ${moreSugar.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('brand-studio-theme');if(t!=='light'&&t!=='dark'){t='light'}document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t}catch(e){document.documentElement.dataset.theme='light'}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Suspense fallback={null}>
          <ScrollToTop />
        </Suspense>
        {previewDenied ? <PreviewAccessDenied /> : children}
        <ThemeToggle />
        {isLegalReleaseEnabled() ? <LegalFooter /> : null}
      </body>
    </html>
  );
}
