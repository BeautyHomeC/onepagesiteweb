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
            <span className="font-label-caps text-primary tracking-[0.3em] uppercase mb-4 block">Beauty Home Concept</span>
            <h1 className="font-headline-lg text-4xl md:text-6xl text-on-surface mb-6 leading-tight">À propos de Camille</h1>
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

            {/* Stats Grid */}
            <div className="order-1 lg:order-2 grid grid-cols-2 gap-6">
              <div className="bg-surface p-8 shadow-ambient border border-surface-container-highest text-center flex flex-col justify-center">
                <span className="font-headline-lg text-4xl md:text-5xl text-primary mb-2">5+</span>
                <span className="font-label-caps text-sm text-on-surface uppercase tracking-widest">Ans d'expérience</span>
                <span className="text-xs text-on-surface-variant mt-2">Praticienne certifiée</span>
              </div>
              <div className="bg-surface p-8 shadow-ambient border border-surface-container-highest text-center flex flex-col justify-center mt-12">
                <span className="font-headline-lg text-4xl md:text-5xl text-primary mb-2">30+</span>
                <span className="font-label-caps text-sm text-on-surface uppercase tracking-widest">Formations</span>
                <span className="text-xs text-on-surface-variant mt-2">France & Étranger</span>
              </div>
              <div className="bg-surface p-8 shadow-ambient border border-surface-container-highest text-center flex flex-col justify-center">
                <span className="font-headline-lg text-4xl md:text-5xl text-primary mb-2">1000+</span>
                <span className="font-label-caps text-sm text-on-surface uppercase tracking-widest">Clientes</span>
                <span className="text-xs text-on-surface-variant mt-2">Note moyenne : 5⭐</span>
              </div>
              <div className="bg-surface p-8 shadow-ambient border border-surface-container-highest flex flex-col justify-center items-center mt-12">
                <span className="material-symbols-outlined text-[48px] text-primary" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>award_star</span>
              </div>
            </div>

          </div>
        </div>

        {/* Values Section */}
        <div className="bg-surface py-24 border-y border-surface-container-highest">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
            <div className="text-center mb-16">
              <h2 className="font-headline-md text-3xl text-on-surface mb-4">Mon Expertise & Mes Valeurs</h2>
              <p className="text-on-surface-variant font-body-md">Découvrez mon parcours et les principes qui guident chaque prestation.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-surface-container-low flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-[32px] text-primary" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>school</span>
                </div>
                <h3 className="font-headline-sm text-xl text-on-surface mb-4">Expertise</h3>
                <p className="font-body-md text-on-surface-variant">Des techniques maîtrisées et des formations continues pour des résultats impeccables.</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-surface-container-low flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-[32px] text-primary" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>spa</span>
                </div>
                <h3 className="font-headline-sm text-xl text-on-surface mb-4">Bien-être</h3>
                <p className="font-body-md text-on-surface-variant">Un cadre apaisant et une approche personnalisée pour un moment de pure détente.</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-surface-container-low flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-[32px] text-primary" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>diamond</span>
                </div>
                <h3 className="font-headline-sm text-xl text-on-surface mb-4">Qualité</h3>
                <p className="font-body-md text-on-surface-variant">Utilisation de produits haut de gamme pour des prestations durables et respectueuses.</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-24 text-center">
          <h2 className="font-headline-md text-3xl text-on-surface mb-8">Prête à découvrir mes prestations ?</h2>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
            <Link href="/#formations" className="bg-primary text-on-primary font-label-caps text-sm px-8 py-4 uppercase tracking-[0.2em] hover:bg-primary-container hover:text-on-primary-container transition-all">
              Explorer les formations
            </Link>
          </div>
        </div>

      </main>
      <Footer />
    </>
  );
}
