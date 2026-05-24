import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";

export default function MethodeCamillePage() {
  return (
    <>
      <Header />
      <main className="pt-[100px] pb-24 bg-surface-container-lowest min-h-screen">

        {/* Hero Banner */}
        <div className="relative w-full h-[40vh] min-h-[300px] max-h-[500px] bg-surface-container-low overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="https://lh3.googleusercontent.com/aida/ADBb0ugxECCJY7H2l1WFyi4dtnwWdSWY2jLuhCiwlM7dSYkWc8Kp6C2aQxs2ZnaIdWh2YcYeEuVN2jAfLA9SNl8tc9QILOhz8Oh4WDGIbe-l5KrF5YxR_9U7AfwLC9l9sBc5qb0P0xwJdahYdm84nPJfN2CYNEycv2581szCM1dKem_Lxp2anFaBiDRx0Lp9CpTSNsLkIl-x_TP2ZModfkaIltN-6fevytkUeW6HiA9pKY6mTOuHzt9Uks7aOSdSya_uMsAVFJtBOwEc-oU"
              alt="Camille au travail"
              className="w-full h-full object-cover opacity-60 mix-blend-overlay"
            />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <span className="font-label-caps text-primary tracking-[0.3em] uppercase mb-4 block animate-hero-in">
              Beauty Home Concept
            </span>
            <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface leading-tight animate-hero-in anim-delay-80">
              À propos de Camille
            </h1>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Text Content */}
            <div className="order-2 lg:order-1">
              <h2 className="font-headline-md text-3xl text-on-surface mb-8">Mon parcours, ma passion</h2>
              <div className="space-y-6 font-body-md text-on-surface-variant text-lg leading-relaxed">
                <p>
                  J'ai choisi de me spécialiser dans la prothésie ongulaire afin d'apporter un véritable savoir-faire et une attention personnalisée à chaque cliente. Formée aux techniques les plus actuelles partout en France, comme à l'étranger, je veille à proposer des prestations de qualité, durables et adaptées à vos envies.
                </p>
                <p>
                  Mon objectif ? Vous offrir bien plus qu'une simple pose d'ongles : un véritable moment de détente, dans une ambiance chaleureuse et professionnelle. Chaque détail compte, car votre satisfaction est au cœur de mon engagement.
                </p>
                <p>
                  Au-delà des techniques, c'est une véritable passion qui m'anime. J'aime voir la transformation et le sourire sur le visage de mes clientes. Beauty Home Concept est le fruit de cette passion, un lieu où l'expertise rencontre la bienveillance.
                </p>
              </div>
            </div>

            {/* Stats — editorial layout */}
            <div className="order-1 lg:order-2">
              <div className="grid grid-cols-2 gap-x-12 gap-y-12 pt-8 border-t border-outline-variant/30">
                <div>
                  <p className="font-playfair text-5xl md:text-6xl text-primary mb-2 leading-none">5+</p>
                  <p className="font-label-caps text-[11px] text-on-surface uppercase tracking-widest mb-1">Ans d'expérience</p>
                  <p className="text-xs text-on-surface-variant">Praticienne certifiée</p>
                </div>
                <div className="mt-10">
                  <p className="font-playfair text-5xl md:text-6xl text-primary mb-2 leading-none">30+</p>
                  <p className="font-label-caps text-[11px] text-on-surface uppercase tracking-widest mb-1">Formations</p>
                  <p className="text-xs text-on-surface-variant">France &amp; Étranger</p>
                </div>
                <div>
                  <p className="font-playfair text-5xl md:text-6xl text-primary mb-2 leading-none">1000+</p>
                  <p className="font-label-caps text-[11px] text-on-surface uppercase tracking-widest mb-1">Clientes</p>
                  <p className="text-xs text-on-surface-variant">Note moyenne 5 étoiles</p>
                </div>
                <div className="mt-10 flex flex-col justify-center">
                  <span
                    className="material-symbols-outlined text-[40px] text-primary/40 mb-2"
                    style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}
                  >
                    award_star
                  </span>
                  <p className="font-label-caps text-[10px] text-primary uppercase tracking-widest">Certifiée Qualiopi</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Values Section */}
        <div className="bg-surface py-24 border-y border-outline-variant/30">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
            <div className="text-center mb-16">
              <p className="font-label-caps text-label-caps text-primary uppercase mb-4">Mes engagements</p>
              <h2 className="font-headline-md text-3xl text-on-surface">Expertise &amp; Valeurs</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 border border-primary/20 bg-surface-container-lowest mb-6">
                  <span
                    className="material-symbols-outlined text-[28px] text-primary"
                    style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}
                  >
                    school
                  </span>
                </div>
                <h3 className="font-headline-sm text-xl text-on-surface mb-4">Expertise</h3>
                <p className="font-body-md text-on-surface-variant max-w-[30ch] mx-auto">Des techniques maîtrisées et des formations continues pour des résultats impeccables.</p>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 border border-primary/20 bg-surface-container-lowest mb-6">
                  <span
                    className="material-symbols-outlined text-[28px] text-primary"
                    style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}
                  >
                    spa
                  </span>
                </div>
                <h3 className="font-headline-sm text-xl text-on-surface mb-4">Bien-être</h3>
                <p className="font-body-md text-on-surface-variant max-w-[30ch] mx-auto">Un cadre apaisant et une approche personnalisée pour un moment de pure détente.</p>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 border border-primary/20 bg-surface-container-lowest mb-6">
                  <span
                    className="material-symbols-outlined text-[28px] text-primary"
                    style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}
                  >
                    diamond
                  </span>
                </div>
                <h3 className="font-headline-sm text-xl text-on-surface mb-4">Qualité</h3>
                <p className="font-body-md text-on-surface-variant max-w-[30ch] mx-auto">Utilisation de produits haut de gamme pour des prestations durables et respectueuses.</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-24 text-center">
          <h2 className="font-headline-md text-3xl text-on-surface mb-8">Prête à découvrir mes formations ?</h2>
          <Link
            href="/#formations"
            className="inline-block border border-on-surface text-on-surface font-label-caps text-label-caps px-8 py-4 uppercase tracking-[0.2em] hover:bg-primary-container hover:border-primary-container hover:text-on-primary-container transition-[color,background-color,border-color,transform] duration-300 active:scale-[0.97]"
          >
            Explorer les formations
          </Link>
        </div>

      </main>
      <Footer />
    </>
  );
}
