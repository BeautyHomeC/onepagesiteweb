import Link from "next/link";

export default function CTASection() {
  return (
    <section className="bg-on-surface py-24 md:py-32">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop text-center">
        <span className="font-label-caps text-label-caps text-primary-fixed-dim uppercase tracking-[0.3em] mb-6 block">
          Prochaines sessions disponibles
        </span>
        <h2 className="font-playfair text-[42px] md:text-[64px] text-surface leading-[1.1] mb-6" style={{ letterSpacing: '-0.02em' }}>
          Passez au niveau<br />supérieur.
        </h2>
        <p className="font-body-lg text-body-lg text-surface/60 max-w-xl mx-auto mb-12">
          Sessions en petit groupe, suivi personnalisé, certification reconnue. Les places sont limitées à 1–2 élèves par session.
        </p>
        <Link
          href="#formations"
          className="inline-block bg-primary text-on-primary font-label-caps text-label-caps px-10 py-5 uppercase tracking-[0.25em] hover:bg-primary-fixed-dim hover:text-on-primary-fixed transition-all duration-300"
        >
          Réserver ma place
        </Link>
      </div>
    </section>
  );
}
