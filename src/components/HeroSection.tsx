"use client";

import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-12 md:pt-20 pb-0 overflow-hidden">
      {/* Overline */}
      <div className="flex items-center gap-4 mb-10">
        <div className="w-8 h-px bg-primary flex-shrink-0"></div>
        <span className="font-label-caps text-label-caps text-primary uppercase tracking-[0.25em]">
          Institut de Formation · Certifié Qualiopi
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter items-end">
        {/* Text */}
        <div className="md:col-span-6 flex flex-col pb-0 md:pb-20 order-2 md:order-1 mt-10 md:mt-0">
          <h2 className="font-playfair text-[52px] md:text-[72px] lg:text-[84px] leading-[1.05] text-on-surface mb-8" style={{ letterSpacing: '-0.02em' }}>
            Élevez votre<br />expertise.
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-10 max-w-[440px]">
            Formations professionnelles en prothésie ongulaire par Camille — précision absolue, petit groupe, résultats immédiats.
          </p>
          <div className="flex items-center gap-6 flex-wrap">
            <Link
              href="#formations"
              className="inline-block bg-on-surface text-surface font-label-caps text-label-caps px-8 py-4 uppercase tracking-[0.2em] hover:bg-primary transition-all duration-300"
            >
              Découvrir les Formations
            </Link>
            <Link
              href="/methode-camille"
              className="font-label-caps text-label-caps text-on-surface-variant hover:text-primary transition-colors uppercase tracking-[0.15em] border-b border-outline-variant hover:border-primary pb-px"
            >
              La Méthode Camille
            </Link>
          </div>
        </div>

        {/* Image — full bleed, no frame */}
        <div className="md:col-span-5 md:col-start-8 order-1 md:order-2 h-[480px] md:h-[700px] w-full overflow-hidden relative">
          <img
            alt="Expert nail work — Beauty Home Concept"
            className="w-full h-full object-cover object-center scale-[1.02]"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBnpPIu5PNiqQWNpyQFNQ4UiBYNhdVVsS96X8TljpqPG1__mH3lqHa37VdsoikxKybUZJKrp9rMdCOQvfFdjlJryLfXuCBWDLGs9pW3X4y8jMN0JbIbxCU7_9G7IYsuH_WZRs1NbIsxm_KIZknW53004GUNQRTYGISGqcIsKnElpLMrf8jH1wAfj80EWaKHZBw_sIjiR7RpVo7pXYG1ae7MnW0FpIzyLPGp-wROwyzE_yAaU-DdGwPHgqiPkQPVp1VOe827dwhVQOyr"
          />
        </div>
      </div>
    </section>
  );
}
