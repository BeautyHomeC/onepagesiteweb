import type { Metadata } from "next";
import { Playfair_Display, Hanken_Grotesk, Dancing_Script } from "next/font/google";
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

const dancing = Dancing_Script({
  variable: "--font-dancing",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://beautyhomeconcept.fr'

export const metadata: Metadata = {
  title: "Beauty Home Concept | Formation Prothésie Ongulaire · Amiens",
  description: "Formations professionnelles en prothésie ongulaire certifiées Qualiopi, animées par Camille Grignon à Amiens. Manucure russe, nail art, technique de précision. Financement FAFCEA, OPCO, CPF.",
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    title: "Beauty Home Concept | Formation Prothésie Ongulaire · Amiens",
    description: "Formations prothésie ongulaire certifiées Qualiopi. Manucure russe, techniques de précision. Amiens — Financement FAFCEA, OPCO.",
    locale: "fr_FR",
    type: "website",
    url: SITE_URL,
    siteName: "Beauty Home Concept",
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Beauty Home Concept | Formation Prothésie Ongulaire',
    description: 'Formations certifiées Qualiopi en prothésie ongulaire à Amiens. Manucure russe, technique de précision.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  name: 'Beauty Home Concept',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description: 'Organisme de formation professionnelle certifié Qualiopi en prothésie ongulaire, situé à Amiens.',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Amiens',
    postalCode: '80000',
    addressCountry: 'FR',
  },
  telephone: '',
  email: 'contact@beautyhomeconcept.fr',
  founder: {
    '@type': 'Person',
    name: 'Camille Grignon',
    jobTitle: 'Directrice Pédagogique',
  },
  hasCredential: {
    '@type': 'EducationalOccupationalCredential',
    name: 'Certification Qualiopi',
    credentialCategory: 'Organisme de Formation Professionnelle',
  },
  sameAs: [
    'https://www.instagram.com/beauty_home.concept',
    'https://www.tiktok.com/@beautyhomeconcept',
    'https://www.facebook.com/beautyhomeconcept',
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${playfair.variable} ${hanken.variable} ${dancing.variable} scroll-smooth antialiased`}
    >
      <head>
        {/* Material Symbols — variable icon font, must remain as external link */}
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-background text-on-background font-body-md text-body-md antialiased selection:bg-primary-container selection:text-on-primary-container flex flex-col">
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
