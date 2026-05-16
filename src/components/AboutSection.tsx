"use client";

import Link from "next/link";

export default function AboutSection() {
  return (
    <section id="about" className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-section-gap">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter items-center">

        {/* Image — full bleed */}
        <div className="md:col-span-4 md:col-start-2">
          <div className="aspect-[3/4] overflow-hidden">
            <img
              alt="Camille — fondatrice de Beauty Home Concept"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              src="https://lh3.googleusercontent.com/aida/ADBb0ugxECCJY7H2l1WFyi4dtnwWdSWY2jLuhCiwlM7dSYkWc8Kp6C2aQxs2ZnaIdWh2YcYeEuVN2jAfLA9SNl8tc9QILOhz8Oh4WDGIbe-l5KrF5YxR_9U7AfwLC9l9sBc5qb0P0xwJdahYdm84nPJfN2CYNEycv2581szCM1dKem_Lxp2anFaBiDRx0Lp9CpTSNsLkIl-x_TP2ZModfkaIltN-6fevytkUeW6HiA9pKY6mTOuHzt9Uks7aOSdSya_uMsAVFJtBOwEc-oU"
            />
          </div>
        </div>

        {/* Text */}
        <div className="md:col-span-5 md:col-start-7 flex flex-col justify-center mt-12 md:mt-0">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-6 h-px bg-primary flex-shrink-0"></div>
            <span className="font-label-caps text-label-caps text-primary uppercase tracking-[0.25em]">La Fondatrice</span>
          </div>

          <h3 className="font-playfair text-[36px] md:text-[44px] leading-[1.15] text-on-surface mb-8" style={{ letterSpacing: '-0.01em' }}>
            La Méthode<br />Camille
          </h3>

          <div className="font-body-md text-body-md text-on-surface-variant space-y-5">
            <p>
              Prothésiste ongulaire certifiée et spécialiste de la manucure russe, je partage ma propre méthode professionnelle, forgée au fil de 5 ans de pratique et de plus de 30 formations suivies en France et à l'étranger.
            </p>
            <p>
              Chaque geste est pensé pour sublimer l'ongle naturel avec une précision absolue. Mes formations sont certifiées <strong className="text-on-surface">Qualiopi</strong>, garantissant une prise en charge possible par vos organismes de financement.
            </p>
          </div>

          {/* Qualiopi badge */}
          <div className="mt-8 p-5 border-l-2 border-primary bg-surface flex items-start gap-4">
            <span className="material-symbols-outlined text-[28px] text-primary mt-0.5 flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>verified</span>
            <div>
              <p className="font-label-caps text-xs text-primary uppercase tracking-widest mb-1">Certifiée Qualiopi</p>
              <p className="font-body-md text-sm text-on-surface-variant leading-relaxed">
                Formations éligibles FAFCEA, OPCO, CPF. Financement sans avance de frais pour auto-entrepreneurs et salariés.
              </p>
            </div>
          </div>

          <div className="mt-10">
            <Link
              href="/methode-camille"
              className="inline-flex items-center text-on-surface font-label-caps text-label-caps hover:text-primary transition-colors uppercase tracking-[0.15em] pb-px border-b border-on-surface hover:border-primary gap-2"
            >
              En savoir plus
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>arrow_forward</span>
            </Link>
          </div>

          <p className="mt-12 text-[11px] text-on-surface-variant/40 leading-relaxed">
            Pour les rendez-vous en prestation classique, retrouvez-moi sur{" "}
            <a href="https://www.fresha.com" target="_blank" rel="noreferrer" className="underline hover:text-on-surface-variant transition-colors">Fresha</a>
            {" "}ou{" "}
            <a href="https://www.instagram.com/beauty_home.concept" target="_blank" rel="noreferrer" className="underline hover:text-on-surface-variant transition-colors">Instagram</a>.
          </p>
        </div>
      </div>
    </section>
  );
}
