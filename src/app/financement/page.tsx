import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Financement de votre formation | Beauty Home Concept",
  description:
    "Découvrez toutes les solutions de financement pour vos formations en prothésie ongulaire : CPF, OPCO, France Travail, financement personnel. Formations éligibles Qualiopi à Amiens.",
};

const FINANCING_OPTIONS = [
  {
    id: "cpf",
    icon: "account_balance_wallet",
    label: "CPF",
    title: "Compte Personnel de Formation",
    description:
      "Le CPF vous permet de financer des formations éligibles à l'aide des droits accumulés tout au long de votre carrière professionnelle. Nos formations certifiantes sont référencées sur la plateforme officielle.",
    detail:
      "Démarche 100 % en ligne via moncompteformation.gouv.fr. Accessible à tout salarié, travailleur indépendant ou demandeur d'emploi disposant d'un solde CPF.",
    cta: "moncompteformation.gouv.fr",
    ctaHref: "https://www.moncompteformation.gouv.fr",
  },
  {
    id: "opco",
    icon: "corporate_fare",
    label: "OPCO",
    title: "Opérateurs de Compétences",
    description:
      "Si vous êtes salarié(e), votre employeur peut prendre en charge tout ou partie de votre formation via l'OPCO de votre branche professionnelle (AFDAS, CONSTRUCTYS, AKTO, etc.).",
    detail:
      "Renseignez-vous auprès du service RH de votre entreprise ou directement auprès de votre OPCO. Nous vous accompagnons dans la constitution du dossier.",
    cta: null,
    ctaHref: null,
  },
  {
    id: "france-travail",
    icon: "work",
    label: "France Travail",
    title: "Pôle Emploi / France Travail",
    description:
      "Les demandeurs d'emploi inscrits à France Travail peuvent bénéficier de financements spécifiques dans le cadre d'un projet de reconversion ou de développement de compétences.",
    detail:
      "Rapprochez-vous de votre conseiller France Travail pour étudier l'AIF (Aide Individuelle à la Formation) ou d'autres dispositifs adaptés à votre situation.",
    cta: null,
    ctaHref: null,
  },
  {
    id: "perso",
    icon: "payments",
    label: "Financement personnel",
    title: "Financement personnel",
    description:
      "Vous souhaitez financer votre formation sur vos propres deniers ? Des facilités de paiement sont envisageables selon votre situation. N'hésitez pas à nous contacter pour en discuter.",
    detail:
      "Un acompte de 30 % est demandé à l'inscription pour confirmer votre place, le solde étant réglé à la date de la formation. Contactez-nous pour toute demande d'échelonnement.",
    cta: null,
    ctaHref: null,
  },
];

export default function FinancementPage() {
  return (
    <>
      <Header />
      <main className="pt-[100px] pb-24 bg-surface-container-lowest min-h-screen">

        {/* ── Hero ─────────────────────────────────────────────── */}
        <div className="bg-surface border-b border-outline-variant/20">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 md:py-24">
            <span className="font-label-caps text-primary tracking-[0.3em] uppercase mb-4 block">
              Beauty Home Concept
            </span>
            <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface leading-tight mb-8 max-w-3xl">
              Financement de votre formation
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
              La majorité de nos formations sont éligibles à plusieurs dispositifs de financement —
              CPF, OPCO, France Travail et plus encore. Découvrez ci-dessous la solution adaptée
              à votre situation pour concrétiser votre projet de formation en prothésie ongulaire.
            </p>
          </div>
        </div>

        {/* ── Financing options ────────────────────────────────── */}
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 md:py-24">

          <div className="mb-12 md:mb-16">
            <p className="font-label-caps text-[11px] text-primary uppercase tracking-[0.3em] mb-4">
              Dispositifs disponibles
            </p>
            <h2 className="font-headline-md text-headline-md text-on-surface max-w-xl">
              Trouvez votre mode de financement
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-outline-variant/20">
            {FINANCING_OPTIONS.map((option) => (
              <div
                key={option.id}
                className="bg-surface-container-lowest p-8 md:p-10 flex flex-col gap-6 border border-outline-variant/20"
              >
                {/* Icon + label */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 border border-primary/20 bg-surface flex-shrink-0">
                    <span
                      className="material-symbols-outlined text-[24px] text-primary"
                      style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}
                    >
                      {option.icon}
                    </span>
                  </div>
                  <span className="font-label-caps text-[10px] text-primary uppercase tracking-[0.3em]">
                    {option.label}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-headline-sm text-headline-sm text-on-surface leading-tight">
                  {option.title}
                </h3>

                {/* Description */}
                <p className="font-body-md text-on-surface-variant leading-relaxed">
                  {option.description}
                </p>

                {/* Detail */}
                <p className="font-body-md text-[14px] text-on-surface-variant/70 leading-relaxed border-t border-outline-variant/20 pt-4">
                  {option.detail}
                </p>

                {/* External link */}
                {option.cta && option.ctaHref && (
                  <a
                    href={option.ctaHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 font-label-caps text-[10px] text-primary uppercase tracking-[0.2em] hover:opacity-70 transition-opacity duration-200 mt-auto"
                  >
                    <span>{option.cta}</span>
                    <span
                      className="material-symbols-outlined text-[14px]"
                      style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}
                    >
                      arrow_outward
                    </span>
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Qualiopi badge strip ─────────────────────────────── */}
        <div className="bg-surface border-y border-outline-variant/20">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-10 flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
            <span
              className="material-symbols-outlined text-[40px] text-primary/50 flex-shrink-0"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}
            >
              verified
            </span>
            <div>
              <p className="font-label-caps text-[10px] text-primary uppercase tracking-[0.3em] mb-1">
                Certification Qualiopi
              </p>
              <p className="font-body-md text-on-surface-variant max-w-2xl">
                Beauty Home Concept est un organisme de formation certifié Qualiopi, gage de qualité
                reconnu par l'État et condition nécessaire à l'accès aux financements publics ou
                mutualisés (CPF, OPCO, France Travail).
              </p>
            </div>
          </div>
        </div>

        {/* ── CTA ─────────────────────────────────────────────── */}
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 md:py-24 text-center">
          <p className="font-label-caps text-[11px] text-primary uppercase tracking-[0.3em] mb-4">
            Nous sommes là pour vous aider
          </p>
          <h2 className="font-headline-md text-headline-md text-on-surface mb-6 max-w-xl mx-auto">
            Besoin d'aide pour votre financement ?
          </h2>
          <p className="font-body-md text-on-surface-variant mb-10 max-w-lg mx-auto">
            Chaque situation est unique. Contactez-nous pour étudier ensemble la solution de
            financement la plus adaptée à votre projet.
          </p>
          <Link
            href="/#contact"
            className="inline-block border border-on-surface text-on-surface font-label-caps text-label-caps px-8 py-4 uppercase tracking-[0.2em] hover:bg-primary-container hover:border-primary-container hover:text-on-primary-container transition-[color,background-color,border-color,transform] duration-300 active:scale-[0.97]"
          >
            Nous contacter
          </Link>
        </div>

      </main>
      <Footer />
    </>
  );
}
