"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

export default function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("in-view")),
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    sectionRef.current.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section id="about" ref={sectionRef} className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-section-gap">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        <div className="md:col-span-4 md:col-start-2">
          <div className="aspect-[3/4] overflow-hidden p-4 bg-surface-container-lowest">
            <img 
              alt="Portrait de Camille, prothésiste ongulaire" 
              className="w-full h-full object-cover" 
              src="/camille-portrait.webp"
            />
          </div>
        </div>
        <div className="md:col-span-5 md:col-start-7 flex flex-col justify-center mt-12 md:mt-0">
          <div className="flex items-center gap-3 mb-8 reveal">
            <span className="material-symbols-outlined text-[20px] text-primary" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>verified</span>
            <span className="font-label-caps text-[11px] text-primary uppercase tracking-[0.28em]">Beauty Home Concept</span>
          </div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-6 reveal reveal-delay-1">La Méthode Camille</h3>
          <div className="font-body-md text-body-md text-on-surface-variant space-y-6 reveal reveal-delay-2 max-w-[62ch]">
            <p>
              Prothésiste ongulaire certifiée et spécialiste de la manucure russe, je partage ma propre méthode professionnelle, forgée au fil de 5 ans de pratique et de plus de 30 formations suivies en France et à l'étranger.
            </p>
            <p>
              Chaque geste est pensé pour sublimer l'ongle naturel avec une précision absolue. Mes formations sont certifiées <strong>Qualiopi</strong>, garantissant une prise en charge possible par vos organismes de financement (FAFCEA, OPCO).
            </p>
          </div>

          {/* Certificat Qualiopi Document */}
          <div className="mt-10 reveal reveal-delay-2">
            <p className="font-label-caps text-[10px] text-primary uppercase tracking-[0.25em] mb-4">Certification Qualité</p>
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <a
                href="/documents/certificat-qualiopi.pdf"
                target="_blank"
                rel="noreferrer"
                aria-label="Voir le certificat Qualiopi"
                className="w-full sm:w-[100px] aspect-[1/1.4] bg-surface-container-low border border-outline-variant/30 relative overflow-hidden shadow-sm shrink-0 group hover:border-primary/40 transition-colors"
              >
                <img
                  src="/documents/certificat-qualiopi.png"
                  alt="Certificat Qualiopi Beauty Home Concept"
                  className="absolute inset-0 w-full h-full object-contain p-1"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement
                    target.style.display = 'none'
                    const fallback = target.nextElementSibling as HTMLElement
                    if (fallback) fallback.style.display = 'flex'
                  }}
                />
                <div className="absolute inset-0 bg-primary/5 flex-col items-center justify-center p-2 text-center border-[4px] border-surface hidden">
                  <span className="material-symbols-outlined text-[24px] text-primary/40 mb-1" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>workspace_premium</span>
                  <span className="font-playfair text-[8px] text-primary/60">Certificat<br/>Qualiopi</span>
                </div>
                <div className="absolute bottom-1 inset-x-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-[14px] text-primary" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>open_in_new</span>
                </div>
              </a>
              <div className="flex-1 space-y-3">
                <p className="font-body-md text-sm text-on-surface-variant leading-relaxed">
                  L'académie répond aux exigences de qualité du référentiel national. Ce certificat officiel vous garantit une formation de haut niveau et ouvre droit aux financements publics.
                </p>
                <p className="font-body-md text-[11px] text-on-surface-variant/70 italic">Financements possibles via OPCO & FAFCEA.</p>
              </div>
            </div>
          </div>

          <div className="mt-10">
            <Link href="/methode-camille" className="inline-flex items-center text-on-surface font-label-caps text-label-caps hover:text-primary transition-colors uppercase pb-1 border-b border-on-surface hover:border-primary">
              En savoir plus <span className="material-symbols-outlined ml-2 text-[16px]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>arrow_forward</span>
            </Link>
          </div>

          {/* Mention B2C discrète */}
          <p className="mt-12 text-[11px] text-on-surface-variant/40 leading-relaxed">
            Pour les rendez-vous en prestation classique, retrouvez-moi directement sur{" "}
            <a href="https://www.fresha.com" target="_blank" rel="noreferrer" className="underline hover:text-on-surface-variant transition-colors">Fresha</a>
            {" "}ou{" "}
            <a href="https://www.instagram.com/beauty_home.concept" target="_blank" rel="noreferrer" className="underline hover:text-on-surface-variant transition-colors">Instagram</a>.
          </p>
        </div>
      </div>
    </section>
  );
}
