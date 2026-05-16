"use client";

import Link from "next/link";
import { useState } from "react";

export default function AboutSection() {
  return (
    <section id="about" className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-section-gap">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        <div className="md:col-span-4 md:col-start-2">
          <div className="aspect-[3/4] overflow-hidden p-4 bg-surface-container-lowest">
            <img 
              alt="Portrait de Camille, prothésiste ongulaire" 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida/ADBb0ugxECCJY7H2l1WFyi4dtnwWdSWY2jLuhCiwlM7dSYkWc8Kp6C2aQxs2ZnaIdWh2YcYeEuVN2jAfLA9SNl8tc9QILOhz8Oh4WDGIbe-l5KrF5YxR_9U7AfwLC9l9sBc5qb0P0xwJdahYdm84nPJfN2CYNEycv2581szCM1dKem_Lxp2anFaBiDRx0Lp9CpTSNsLkIl-x_TP2ZModfkaIltN-6fevytkUeW6HiA9pKY6mTOuHzt9Uks7aOSdSya_uMsAVFJtBOwEc-oU"
            />
          </div>
        </div>
        <div className="md:col-span-5 md:col-start-7 flex flex-col justify-center mt-12 md:mt-0">
          <div className="mb-8 w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center">
            <span className="material-symbols-outlined text-[32px] text-primary" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>verified</span>
          </div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-6">La Méthode Camille</h3>
          <div className="font-body-md text-body-md text-on-surface-variant space-y-6">
            <p>
              Prothésiste ongulaire certifiée et spécialiste de la manucure russe, je partage ma propre méthode professionnelle, forgée au fil de 5 ans de pratique et de plus de 30 formations suivies en France et à l'étranger.
            </p>
            <p>
              Chaque geste est pensé pour sublimer l'ongle naturel avec une précision absolue. Mes formations sont certifiées <strong>Qualiopi</strong>, garantissant une prise en charge possible par vos organismes de financement (FAFCEA, OPCO).
            </p>
          </div>

          {/* Encart Qualiopi */}
          <div className="mt-8 p-4 border border-primary/30 bg-surface flex items-center gap-4">
            <span className="material-symbols-outlined text-[40px] text-primary" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>award_star</span>
            <div>
              <p className="font-label-caps text-sm text-primary uppercase tracking-widest">Certifiée Qualiopi</p>
              <p className="font-body-md text-xs text-on-surface-variant mt-1">Formations éligibles FAFCEA, OPCO, CPF. Financement possible pour auto-entrepreneurs et salariés.</p>
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
