"use client";

import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12 md:py-24">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter items-center">
        <div className="md:col-span-5 md:col-start-1 flex flex-col justify-center order-2 md:order-1 mt-12 md:mt-0 z-10 relative">
          <h2 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-on-surface mb-8">
            Élevez votre expertise. Formations professionnelles en prothésie ongulaire.
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-10 max-w-md">
            Plongez dans l'univers de Beauty Home Concept. Une approche architecturale et minimaliste de l'ongle, conçue par Camille, experte passionnée.
          </p>
          <div>
            <Link 
              href="#formations"
              className="inline-block border border-on-surface text-on-surface font-label-caps text-label-caps px-8 py-4 uppercase tracking-[0.2em] hover:bg-primary-container hover:border-primary-container hover:text-on-primary-container transition-all duration-300 active:opacity-50 rounded-none"
            >
              Découvrir les Formations
            </Link>
          </div>
        </div>
        <div className="md:col-span-6 md:col-start-7 order-1 md:order-2 h-[530px] md:h-[707px] w-full overflow-hidden p-4 bg-surface-container-lowest">
          <img 
            alt="Expert nail work" 
            className="w-full h-full object-cover object-center" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBnpPIu5PNiqQWNpyQFNQ4UiBYNhdVVsS96X8TljpqPG1__mH3lqHa37VdsoikxKybUZJKrp9rMdCOQvfFdjlJryLfXuCBWDLGs9pW3X4y8jMN0JbIbxCU7_9G7IYsuH_WZRs1NbIsxm_KIZknW53004GUNQRTYGISGqcIsKnElpLMrf8jH1wAfj80EWaKHZBw_sIjiR7RpVo7pXYG1ae7MnW0FpIzyLPGp-wROwyzE_yAaU-DdGwPHgqiPkQPVp1VOe827dwhVQOyr"
          />
        </div>
      </div>
    </section>
  );
}
