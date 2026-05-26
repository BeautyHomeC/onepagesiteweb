import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12 md:py-24">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter items-center">
        <div className="md:col-span-5 md:col-start-1 flex flex-col justify-center order-2 md:order-1 mt-12 md:mt-0 z-10 relative">
          <div className="flex items-center gap-3 mb-6 animate-hero-in">
            <span className="h-px w-8 bg-primary flex-shrink-0" aria-hidden="true" />
            <p className="font-label-caps text-label-caps text-primary uppercase">
              BEAUTÉ — EXPERTISE — PRÉCISION
            </p>
          </div>
          <h2 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-on-surface mb-8 animate-hero-in anim-delay-80">
            Élevez votre expertise. Formations professionnelles en prothésie ongulaire.
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-10 max-w-md animate-hero-in anim-delay-160">
            Plongez dans l'univers de Beauty Home Concept. Une approche architecturale et minimaliste de l'ongle, conçue par Camille, experte passionnée.
          </p>
          <div className="animate-hero-in anim-delay-240">
            <Link
              href="#formations"
              className="inline-flex items-center justify-center min-h-[44px] border border-on-surface text-on-surface font-label-caps text-label-caps px-8 py-4 uppercase tracking-[0.2em] hover:bg-primary-container hover:border-primary-container hover:text-on-primary-container transition-[color,background-color,border-color,transform] duration-300 active:scale-[0.97]"
            >
              Découvrir les Formations
            </Link>
          </div>
        </div>
        <div className="md:col-span-6 md:col-start-7 order-1 md:order-2 h-[500px] md:h-[750px] w-full relative overflow-hidden animate-hero-in anim-delay-80 group">
          <div className="absolute inset-0 bg-surface-container-lowest p-2 md:p-4 transition-transform duration-700 ease-out">
            <div className="w-full h-full relative overflow-hidden bg-surface-container-low">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover object-center scale-[1.03] group-hover:scale-100 transition-transform duration-1000 ease-out"
              >
                <source src="/hero-video.mp4" type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-primary/5 mix-blend-overlay"></div>
            </div>
          </div>
        </div>
      </div>
      {/* Scroll cue */}
      <div className="hidden md:flex flex-col items-center gap-2 pt-12 pb-0 animate-hero-in anim-delay-320" aria-hidden="true">
        <span className="font-label-caps text-[9px] text-on-surface-variant/50 uppercase tracking-[0.3em]">Défiler</span>
        <span className="block w-px h-8 bg-outline-variant/50" />
      </div>
    </section>
  );
}
