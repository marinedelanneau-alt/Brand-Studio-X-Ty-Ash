import type { Metadata } from "next";
import localFont from "next/font/local";
import { Caveat, Cormorant_Garamond, Manrope, Satisfy } from "next/font/google";
import { Suspense } from "react";
import ScrollToTop from "./ui/scroll-to-top";
import "./globals.css";

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${manrope.variable} ${cormorant.variable} ${caveat.variable} ${satisfy.variable} ${moreSugar.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Suspense fallback={null}>
          <ScrollToTop />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
