"use client";

import { useState } from "react";

const faqs = [
  {
    question: "Faut-il venir avec son matériel ?",
    answer: "Non, tout le matériel professionnel est fourni pour la journée : ponceuse, embouts, lampe UV/LED, produits (rubber base, gel, couleurs). Vous repartez avec votre livret de formation et tous les supports pédagogiques.",
  },
  {
    question: "Les modèles sont-ils fournis ?",
    answer: "La pratique se réalise sur vous-même, ce qui est la méthode la plus efficace pour intégrer les gestes. Vous êtes à la fois l'apprenante et le modèle, sous supervision directe de Camille.",
  },
  {
    question: "Comment se passe la prise en charge de la formation (FAFCEA, OPCO) ?",
    answer: "Les formations Beauty Home Concept sont certifiées Qualiopi, ce qui les rend éligibles aux financements FAFCEA (pour les auto-entrepreneurs du secteur), OPCO (pour les salariés) et CPF. Contactez votre organisme de financement en amont pour valider votre dossier. Une convention de formation et une attestation de fin de formation vous seront remises pour vos justificatifs.",
  },
  {
    question: "Quel est le niveau requis pour s'inscrire ?",
    answer: "La formation Manucure Russe Pro est une formation de perfectionnement. Elle s'adresse aux prothésistes ongulaires et esthéticiennes ayant déjà suivi une formation initiale et maîtrisant l'utilisation d'une ponceuse. La vérification se fait sur déclaration via une attestation sur l'honneur.",
  },
  {
    question: "Combien de participantes par session ?",
    answer: "Le groupe est volontairement limité à 1 ou 2 participantes maximum pour garantir un suivi ultra-personnalisé et des corrections en temps réel. C'est l'un des points forts de la méthode.",
  },
  {
    question: "Y a-t-il un suivi après la formation ?",
    answer: "Oui. Camille assure un suivi post-formation par mail et via les réseaux sociaux. Si vous avez des questions techniques ou souhaitez faire réviser un geste, elle reste disponible pour ses anciennes élèves.",
  },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="bg-surface-container-low py-section-gap">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="grid md:grid-cols-[5fr_7fr] gap-16 md:gap-24">

          {/* Left: sticky heading */}
          <div className="md:sticky md:top-[108px] md:self-start z-10">
            <p className="font-label-caps text-label-caps text-primary uppercase mb-4">Informations</p>
            <h2 className="font-headline-md text-headline-md text-on-surface mb-8">
              Questions fréquentes.
            </h2>
            <a
              href="mailto:contact@beautyhomeconcept.fr?subject=Renseignements formation"
              className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors duration-200 font-body-md text-body-md active:opacity-70"
              onClick={(e) => {
                // Fallback: if mailto fails, copy email to clipboard
                if (!window.navigator.userAgent.includes('Mobile')) return;
                e.preventDefault();
                navigator.clipboard?.writeText('contact@beautyhomeconcept.fr');
              }}
            >
              <span
                className="material-symbols-outlined text-[18px]"
                style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}
              >
                mail
              </span>
              Nous écrire
            </a>
            <p className="text-[11px] text-on-surface-variant/60 mt-2 font-body-md">
              contact@beautyhomeconcept.fr
            </p>
          </div>

          {/* Right: accordion */}
          <div className="divide-y divide-outline-variant/40">
            {faqs.map((faq, i) => (
              <div key={i} className="py-6">
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full flex justify-between items-center text-left gap-4 active:opacity-70"
                >
                  <span className="font-body-md text-on-surface font-medium">{faq.question}</span>
                  <span
                    className="material-symbols-outlined text-primary flex-shrink-0"
                    style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}
                  >
                    {openIndex === i ? "close" : "add"}
                  </span>
                </button>
                <div className={`faq-body${openIndex === i ? " faq-open" : ""}`}>
                  <div className="overflow-hidden">
                    <p className="font-body-md text-on-surface-variant leading-relaxed pt-4">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
