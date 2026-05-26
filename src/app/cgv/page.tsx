import Header from "@/components/Header";
import Footer from "@/components/Footer";
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Conditions Générales de Vente — Beauty Home Concept',
  description: 'Conditions générales de vente des formations professionnelles Beauty Home Concept, organisme certifié Qualiopi.',
}

export default function CGV() {
  return (
    <>
      <Header />
      <main className="flex-1 pt-32 pb-24" style={{ backgroundColor: '#faf9f9' }}>
        <div className="container mx-auto px-6 md:px-12 max-w-4xl">

          <p
            className="text-[9px] uppercase tracking-[0.3em] mb-4"
            style={{ fontFamily: 'var(--font-hanken)', color: '#755a2d' }}
          >
            Contractuel
          </p>
          <h1
            className="text-4xl font-normal leading-snug mb-3"
            style={{ fontFamily: 'var(--font-playfair)', color: '#1b1c1c' }}
          >
            Conditions Générales de Vente
          </h1>
          <p
            className="text-sm mb-16"
            style={{ fontFamily: 'var(--font-hanken)', fontWeight: 300, color: '#8c8278' }}
          >
            Dernière mise à jour : juin 2025
          </p>

          <div
            className="space-y-10"
            style={{ fontFamily: 'var(--font-hanken)', fontWeight: 300, color: '#5a5248', fontSize: 14, lineHeight: 1.8 }}
          >

            <section>
              <h2
                className="text-xl font-normal mb-4"
                style={{ fontFamily: 'var(--font-playfair)', color: '#1b1c1c' }}
              >
                1. Objet et champ d&apos;application
              </h2>
              <p>
                Les présentes Conditions Générales de Vente (CGV) régissent l&apos;ensemble des inscriptions aux formations professionnelles proposées par <strong style={{ fontWeight: 500, color: '#1b1c1c' }}>EI Camille Grignon</strong> (SIRET : 910 934 140 000 47), opérant sous la marque <strong style={{ fontWeight: 500, color: '#1b1c1c' }}>Beauty Home Concept</strong>, organisme de formation enregistré sous le numéro d&apos;activité <strong style={{ fontWeight: 500, color: '#1b1c1c' }}>32 80 02643 80</strong> et certifié <strong style={{ fontWeight: 500, color: '#1b1c1c' }}>Qualiopi</strong>.
              </p>
              <p className="mt-3">
                Toute inscription vaut acceptation pleine et entière des présentes CGV. Elles prévalent sur toute autre condition générale ou particulière non expressément agréée par Beauty Home Concept.
              </p>
            </section>

            <div style={{ height: 1, backgroundColor: '#e9e8e8' }} />

            <section>
              <h2
                className="text-xl font-normal mb-4"
                style={{ fontFamily: 'var(--font-playfair)', color: '#1b1c1c' }}
              >
                2. Inscription et confirmation
              </h2>
              <p>
                L&apos;inscription est considérée comme définitive à réception du paiement de l&apos;acompte (30 % du prix total) via la plateforme de paiement sécurisée Stripe. Une convention de formation (ou contrat de formation professionnelle pour les particuliers, conformément à l&apos;article L. 6353-3 du Code du travail) et un email de confirmation sont automatiquement transmis par voie électronique.
              </p>
              <p className="mt-3">
                Le solde restant (70 % du prix) est réglé le dernier jour de la formation, en espèces, par virement bancaire ou par carte bancaire.
              </p>
            </section>

            <div style={{ height: 1, backgroundColor: '#e9e8e8' }} />

            <section>
              <h2
                className="text-xl font-normal mb-4"
                style={{ fontFamily: 'var(--font-playfair)', color: '#1b1c1c' }}
              >
                3. Tarifs et modalités de paiement
              </h2>
              <p>
                Les tarifs sont exprimés en euros toutes taxes comprises (TTC). Beauty Home Concept, en tant que micro-entreprise, n&apos;est pas assujettie à la TVA (article 293 B du Code Général des Impôts) — aucune TVA n&apos;est donc applicable.
              </p>
              <p className="mt-3">
                Les paiements en ligne sont sécurisés par Stripe Inc. Beauty Home Concept ne conserve aucune donnée bancaire.
              </p>
            </section>

            <div style={{ height: 1, backgroundColor: '#e9e8e8' }} />

            <section>
              <h2
                className="text-xl font-normal mb-4"
                style={{ fontFamily: 'var(--font-playfair)', color: '#1b1c1c' }}
              >
                4. Droit de rétractation
              </h2>
              <p>
                Conformément à l&apos;article L. 221-28 du Code de la consommation, <strong style={{ fontWeight: 500, color: '#1b1c1c' }}>le droit de rétractation de 14 jours ne s&apos;applique pas</strong> aux contrats de prestations de services d&apos;enseignement dispensés en présentiel à une date déterminée (article L. 221-28, 12°).
              </p>
              <p className="mt-3">
                Toutefois, si la formation n&apos;a pas encore commencé et si un accord express a été donné par Beauty Home Concept, il pourra être étudié un report ou un remboursement partiel au cas par cas, dans les conditions définies à l&apos;article 5.
              </p>
            </section>

            <div style={{ height: 1, backgroundColor: '#e9e8e8' }} />

            <section>
              <h2
                className="text-xl font-normal mb-4"
                style={{ fontFamily: 'var(--font-playfair)', color: '#1b1c1c' }}
              >
                5. Conditions d&apos;annulation et de report
              </h2>
              <p>
                <strong style={{ fontWeight: 500, color: '#1b1c1c' }}>Annulation par le stagiaire :</strong>
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-2">
                <li>Plus de 14 jours avant la formation : remboursement de l&apos;acompte déduction faite des frais administratifs (50 €), ou report sans frais.</li>
                <li>Entre 14 jours et 72 heures avant : aucun remboursement de l&apos;acompte, report possible sous réserve de disponibilité.</li>
                <li>Moins de 72 heures avant ou absence non justifiée : l&apos;intégralité du prix de la formation reste due.</li>
              </ul>
              <p className="mt-3">
                En cas de force majeure dûment justifiée (accident, hospitalisation), un report est proposé sans frais supplémentaires.
              </p>
              <p className="mt-4">
                <strong style={{ fontWeight: 500, color: '#1b1c1c' }}>Annulation par Beauty Home Concept :</strong> En cas de nombre insuffisant de participants ou d&apos;événement indépendant de la volonté de l&apos;organisme, la formation peut être annulée jusqu&apos;à 7 jours avant la date prévue. L&apos;acompte versé est intégralement remboursé dans un délai de 14 jours.
              </p>
            </section>

            <div style={{ height: 1, backgroundColor: '#e9e8e8' }} />

            <section>
              <h2
                className="text-xl font-normal mb-4"
                style={{ fontFamily: 'var(--font-playfair)', color: '#1b1c1c' }}
              >
                6. Conditions d&apos;accès aux formations
              </h2>
              <p>
                Certaines formations sont réservées aux professionnels de la beauté. Les prérequis sont indiqués dans le programme de chaque formation. L&apos;inscription vaut attestation sur l&apos;honneur de remplir les conditions requises. En cas de non-respect, Beauty Home Concept se réserve le droit de refuser l&apos;accès à la formation sans remboursement.
              </p>
            </section>

            <div style={{ height: 1, backgroundColor: '#e9e8e8' }} />

            <section>
              <h2
                className="text-xl font-normal mb-4"
                style={{ fontFamily: 'var(--font-playfair)', color: '#1b1c1c' }}
              >
                7. Documents remis à l&apos;issue de la formation
              </h2>
              <p>
                À l&apos;issue de chaque formation, le stagiaire reçoit : une attestation de fin de formation mentionnant les objectifs, la nature, la durée et les résultats de l&apos;acquisition des compétences (conformément à l&apos;article L. 6353-1 du Code du travail).
              </p>
              <p className="mt-3">
                Les documents pédagogiques fournis pendant la formation sont protégés par le droit d&apos;auteur et ne peuvent être reproduits ou diffusés sans autorisation.
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
              <p>
                Beauty Home Concept s&apos;engage à déployer tous les moyens nécessaires pour assurer la qualité de la formation dispensée. En aucun cas, la responsabilité de Beauty Home Concept ne pourra être engagée pour des dommages indirects liés à la participation à une formation.
              </p>
            </section>

            <div style={{ height: 1, backgroundColor: '#e9e8e8' }} />

            <section>
              <h2
                className="text-xl font-normal mb-4"
                style={{ fontFamily: 'var(--font-playfair)', color: '#1b1c1c' }}
              >
                9. Données personnelles
              </h2>
              <p>
                Les données collectées lors de l&apos;inscription sont traitées conformément à notre politique de confidentialité et au RGPD. Elles sont utilisées exclusivement à des fins d&apos;organisation et de suivi de la formation. Aucune donnée n&apos;est cédée à des tiers sans votre consentement explicite.
              </p>
            </section>

            <div style={{ height: 1, backgroundColor: '#e9e8e8' }} />

            <section>
              <h2
                className="text-xl font-normal mb-4"
                style={{ fontFamily: 'var(--font-playfair)', color: '#1b1c1c' }}
              >
                10. Médiation des litiges
              </h2>
              <p>
                Conformément aux articles L. 612-1 et suivants du Code de la consommation, tout consommateur dispose du droit de recourir gratuitement à un médiateur de la consommation en vue de la résolution amiable du litige qui l&apos;oppose à un professionnel.
              </p>
              <p className="mt-3">
                En cas de litige non résolu par la voie amiable, vous pouvez contacter le médiateur de la consommation compétent. Le recours à la médiation n&apos;est possible qu&apos;après avoir préalablement tenté de résoudre le différend directement auprès de Beauty Home Concept par écrit.
              </p>
              <p className="mt-3">
                Contact préalable :{' '}
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
                11. Droit applicable
              </h2>
              <p>
                Les présentes CGV sont soumises au droit français. En cas de litige et à défaut de résolution amiable, les tribunaux compétents seront ceux d&apos;Amiens.
              </p>
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
