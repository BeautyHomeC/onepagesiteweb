import Header from "@/components/Header";
import Footer from "@/components/Footer";
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mentions Légales — Beauty Home Concept',
  description: 'Mentions légales du site Beauty Home Concept, organisme de formation certifié Qualiopi.',
}

export default function MentionsLegales() {
  return (
    <>
      <Header />
      <main className="flex-1 pt-32 pb-24" style={{ backgroundColor: '#faf9f9' }}>
        <div className="container mx-auto px-6 md:px-12 max-w-4xl">

          <p
            className="text-[9px] uppercase tracking-[0.3em] mb-4"
            style={{ fontFamily: 'var(--font-hanken)', color: '#755a2d' }}
          >
            Informations légales
          </p>
          <h1
            className="text-4xl font-normal leading-snug mb-16"
            style={{ fontFamily: 'var(--font-playfair)', color: '#1b1c1c' }}
          >
            Mentions Légales
          </h1>

          <div
            className="space-y-10"
            style={{ fontFamily: 'var(--font-hanken)', fontWeight: 300, color: '#5a5248' }}
          >

            <section>
              <h2
                className="text-xl font-normal mb-4"
                style={{ fontFamily: 'var(--font-playfair)', color: '#1b1c1c' }}
              >
                1. Éditeur du site
              </h2>
              <p className="text-sm leading-loose">
                Le présent site est édité par :<br />
                <strong style={{ fontWeight: 500, color: '#1b1c1c' }}>EI Camille Grignon</strong> — Auto-entrepreneuse<br />
                Siège social : 22A rue du Général Leclerc, 80000 Amiens, Hauts-de-France<br />
                SIRET : 910 934 140 000 47<br />
                Email :{' '}
                <a href="mailto:contact@beautyhomeconcept.fr" style={{ color: '#755a2d' }}>
                  contact@beautyhomeconcept.fr
                </a>
              </p>
            </section>

            <div style={{ height: 1, backgroundColor: '#e9e8e8' }} />

            <section>
              <h2
                className="text-xl font-normal mb-4"
                style={{ fontFamily: 'var(--font-playfair)', color: '#1b1c1c' }}
              >
                2. Directrice de la publication
              </h2>
              <p className="text-sm leading-loose">
                Camille Grignon — Directrice Pédagogique de Beauty Home Concept
              </p>
            </section>

            <div style={{ height: 1, backgroundColor: '#e9e8e8' }} />

            <section>
              <h2
                className="text-xl font-normal mb-4"
                style={{ fontFamily: 'var(--font-playfair)', color: '#1b1c1c' }}
              >
                3. Hébergement
              </h2>
              <p className="text-sm leading-loose">
                Ce site est hébergé par :<br />
                <strong style={{ fontWeight: 500, color: '#1b1c1c' }}>Vercel Inc.</strong><br />
                340 S Lemon Ave #4133 Walnut, CA 91789, USA<br />
                <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" style={{ color: '#755a2d' }}>
                  vercel.com
                </a>
              </p>
            </section>

            <div style={{ height: 1, backgroundColor: '#e9e8e8' }} />

            <section>
              <h2
                className="text-xl font-normal mb-4"
                style={{ fontFamily: 'var(--font-playfair)', color: '#1b1c1c' }}
              >
                4. Déclaration d&apos;activité de formation
              </h2>
              <p className="text-sm leading-loose">
                Déclaration d&apos;activité enregistrée sous le numéro{' '}
                <strong style={{ fontWeight: 500, color: '#1b1c1c' }}>32 80 02643 80</strong>{' '}
                auprès du Préfet de région Hauts-de-France.<br />
                Organisme de formation certifié{' '}
                <strong style={{ fontWeight: 500, color: '#1b1c1c' }}>Qualiopi</strong> au titre de la catégorie d&apos;actions : Actions de formation.
              </p>
            </section>

            <div style={{ height: 1, backgroundColor: '#e9e8e8' }} />

            <section>
              <h2
                className="text-xl font-normal mb-4"
                style={{ fontFamily: 'var(--font-playfair)', color: '#1b1c1c' }}
              >
                5. Propriété intellectuelle
              </h2>
              <p className="text-sm leading-loose">
                L&apos;ensemble des contenus présents sur ce site (textes, photographies, vidéos, logos, programmes de formation) sont protégés par le droit d&apos;auteur et appartiennent à EI Camille Grignon. Toute reproduction, représentation ou diffusion, totale ou partielle, sans autorisation écrite préalable est interdite.
              </p>
            </section>

            <div style={{ height: 1, backgroundColor: '#e9e8e8' }} />

            <section>
              <h2
                className="text-xl font-normal mb-4"
                style={{ fontFamily: 'var(--font-playfair)', color: '#1b1c1c' }}
              >
                6. Données personnelles (RGPD)
              </h2>
              <p className="text-sm leading-loose">
                Dans le cadre du traitement des inscriptions aux formations, Beauty Home Concept collecte et traite des données personnelles (nom, prénom, email, téléphone, adresse). Ces données sont utilisées exclusivement à des fins de gestion administrative et pédagogique.<br /><br />
                Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés, vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;opposition et de suppression de vos données. Pour exercer ces droits, contactez :{' '}
                <a href="mailto:contact@beautyhomeconcept.fr" style={{ color: '#755a2d' }}>
                  contact@beautyhomeconcept.fr
                </a>.<br /><br />
                Les données sont conservées pendant la durée légale applicable aux organismes de formation professionnelle.
              </p>
            </section>

            <div style={{ height: 1, backgroundColor: '#e9e8e8' }} />

            <section>
              <h2
                className="text-xl font-normal mb-4"
                style={{ fontFamily: 'var(--font-playfair)', color: '#1b1c1c' }}
              >
                7. Cookies
              </h2>
              <p className="text-sm leading-loose">
                Ce site utilise uniquement des cookies techniques strictement nécessaires au fonctionnement (paiement sécurisé via Stripe). Aucun cookie publicitaire ou de tracking n&apos;est utilisé.
              </p>
            </section>

            <div style={{ height: 1, backgroundColor: '#e9e8e8' }} />

            <section>
              <h2
                className="text-xl font-normal mb-4"
                style={{ fontFamily: 'var(--font-playfair)', color: '#1b1c1c' }}
              >
                8. Responsabilité
              </h2>
              <p className="text-sm leading-loose">
                Beauty Home Concept s&apos;efforce de maintenir les informations publiées sur ce site exactes et à jour. Toutefois, nous ne pouvons garantir l&apos;exactitude, la complétude ou l&apos;actualité des informations diffusées. L&apos;utilisation des informations et contenus disponibles sur l&apos;ensemble du site se fait entièrement sous la responsabilité de l&apos;utilisateur.
              </p>
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
