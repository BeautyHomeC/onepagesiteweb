import type { Metadata } from "next";
import { Playfair_Display, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import CookieBanner from "@/components/CookieBanner";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Beauty Home Concept | Formation Prothésie Ongulaire · Amiens",
  description: "Formations professionnelles en prothésie ongulaire certifiées Qualiopi, animées par Camille à Amiens. Manucure russe, nail art, technique de précision. Financement FAFCEA, OPCO, CPF.",
  openGraph: {
    title: "Beauty Home Concept",
    description: "Formations prothésie ongulaire certifiées Qualiopi · Amiens",
    locale: "fr_FR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${playfair.variable} ${hanken.variable} scroll-smooth antialiased`}
    >
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-background text-on-background font-body-md text-body-md antialiased selection:bg-primary-container selection:text-on-primary-container flex flex-col">
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
