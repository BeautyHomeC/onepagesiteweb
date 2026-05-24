"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function SessionBadge({ session }: { session?: any }) {
  if (!session) {
    return (
      <div className="session-block">
        <div className="session-eyebrow">
          <span className="session-rule" />
          <span className="session-eyebrow-label">Prochaines sessions</span>
          <span className="session-rule" />
        </div>
        <p className="session-date-display is-full">Aucune session prévue</p>
        <p className="session-places-display">Inscrivez-vous pour être prévenue</p>
      </div>
    );
  }

  const isFull = session.places_disponibles <= 0;
  const placesLabel = isFull
    ? "Complet"
    : session.places_disponibles === 1
    ? "Dernière place disponible"
    : `${session.places_disponibles} places disponibles`;

  return (
    <div className="session-block">
      <div className="session-eyebrow">
        <span className="session-rule" />
        <span className="session-eyebrow-label">Prochaine session</span>
        <span className="session-rule" />
      </div>
      <p className={`session-date-display${isFull ? " is-full" : ""}`}>
        {formatDate(session.date_debut)}
      </p>
      <p className="session-places-display">{placesLabel}</p>
      {isFull && (
        <div className="session-full-tag">
          <span className="session-rule" />
          <span className="session-full-label">Liste d'attente ouverte</span>
          <span className="session-rule" />
        </div>
      )}
    </div>
  );
}

export default function FormationsSection() {
  const [formations, setFormations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextSessions, setNextSessions] = useState<Record<string, any>>({});
  const sectionRef = useRef<HTMLElement>(null);

  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      try {
        const [formationsRes, sessionsRes] = await Promise.all([
          supabase.from("formations").select("*"),
          supabase
            .from("sessions")
            .select("*")
            .gte("date_debut", new Date().toISOString())
            .order("date_debut", { ascending: true }),
        ]);

        if (formationsRes.data && formationsRes.data.length > 0) {
          setFormations(formationsRes.data);
        }

        if (sessionsRes.data) {
          const byFormation: Record<string, any> = {};
          sessionsRes.data.forEach((s: any) => {
            if (!byFormation[s.formation_id]) {
              byFormation[s.formation_id] = s;
            }
          });
          setNextSessions(byFormation);
        }
      } catch (e) {
        console.error("Supabase not configured yet");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // IntersectionObserver stagger reveal
  useEffect(() => {
    if (!sectionRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    sectionRef.current.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [formations, loading]);

  const staggerClass = (i: number) =>
    i === 1 ? "reveal-delay-1" : i === 2 ? "reveal-delay-2" : "";

  const cardBase =
    "reveal group cursor-pointer bg-surface-container-lowest border border-outline-variant/30 p-6 flex flex-col items-center text-center transition-[transform,box-shadow] duration-300 hover:-translate-y-1.5 hover:shadow-md";

  return (
    <section id="formations" ref={sectionRef} className="bg-surface-container-lowest py-section-gap relative">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="mb-16">
          <p className="font-label-caps text-label-caps text-primary uppercase mb-3 reveal">Programmes</p>
          <h2 className="font-headline-md text-headline-md text-on-surface reveal reveal-delay-1">Formations</h2>
        </div>

        {loading ? (
          <div className="text-center py-12 text-on-surface-variant font-body-md">
            Chargement des formations...
          </div>
        ) : formations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {formations.map((formation, i) => (
              <div key={formation.id} className={`${cardBase} ${staggerClass(i)}`}>
                <div className="aspect-square mb-6 overflow-hidden bg-surface-container-low w-full">
                  {formation.image_url ? (
                    <img
                      alt={formation.titre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-90"
                      src={formation.image_url}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-surface-variant text-on-surface-variant font-body-md">
                      Pas d'image
                    </div>
                  )}
                </div>
                <h4 className="font-headline-sm text-headline-sm text-on-surface mb-2">
                  {formation.titre}
                </h4>
                <p className="font-body-md text-body-md text-on-surface-variant mb-4">
                  {formation.description}
                </p>
                <span className="font-label-caps text-label-caps text-primary uppercase mb-4 mt-auto">
                  {formation.duree || "Sur mesure"}
                </span>
                <SessionBadge session={nextSessions[formation.id]} />
                {(() => {
                  const s = nextSessions[formation.id];
                  const isFull = !s || s.places_disponibles <= 0;
                  if (isFull) {
                    return (
                      <a
                        href={`mailto:contact@beautyhomeconcept.fr?subject=Liste d'attente — ${formation.titre}`}
                        className="w-full mt-4 inline-flex items-center justify-center min-h-[44px] border border-outline text-on-surface-variant font-label-caps text-label-caps px-4 py-3 uppercase tracking-[0.2em] hover:border-on-surface hover:text-on-surface transition-[color,border-color,transform] duration-300 active:scale-[0.97]"
                      >
                        Liste d'attente
                      </a>
                    );
                  }
                  return (
                    <Link
                      href={`/formations/${formation.id}`}
                      className="w-full mt-4 inline-flex items-center justify-center min-h-[44px] border border-on-surface text-on-surface font-label-caps text-label-caps px-4 py-3 uppercase tracking-[0.2em] hover:bg-primary-container hover:border-primary-container hover:text-on-primary-container transition-[color,background-color,border-color,transform] duration-300 active:scale-[0.97]"
                    >
                      Réserver
                    </Link>
                  );
                })()}
              </div>
            ))}
          </div>
        ) : (
          /* FALLBACK UI if Database is empty */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {/* Card 1 */}
            <div className={`${cardBase}`}>
              <div className="aspect-square mb-6 overflow-hidden bg-surface-container-low w-full">
                <img
                  alt="Manucure Russe"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-90"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDp1PbLB8PAw6WwBvWr3OksuzJoKLmAsb5gjEJ8nHAa6-ZfsIKYXtrWIaK-YUBvaLVDsdm5xh2C7peJw6_EB2qoW4nc8DmEnbcS0bhWow5HYNL1Z2wfn6f2QVi-DWZC4MKqFpxowjTxwEAqK4zLk22iBq4waGeR5veeHcZ2PIvSCwEgQ6PkrPHNH-MGSD5j3qw9ts6C8l8T2Tfu-XxqhKl7eCcex5FtKPtms4cwPXAWnccwP_1ewcVYQKvA4clwMyoAEIhfmmA6Vuhp"
                />
              </div>
              <h4 className="font-headline-sm text-headline-sm text-on-surface mb-2">
                Masterclass Perfectionnement
              </h4>
              <p className="font-body-md text-body-md text-on-surface-variant mb-4">
                Maîtrisez les techniques avancées et la préparation parfaite.
              </p>
              <span className="font-label-caps text-label-caps text-primary uppercase mb-4 mt-auto">
                2 Jours · Présentiel Amiens
              </span>
              <div className="session-block">
                <div className="session-eyebrow">
                  <span className="session-rule" />
                  <span className="session-eyebrow-label">Prochaine session</span>
                  <span className="session-rule" />
                </div>
                <p className="session-date-display">14 juin 2025</p>
                <p className="session-places-display">2 places disponibles</p>
              </div>
              <a
                href="mailto:contact@beautyhomeconcept.fr?subject=Inscription — Masterclass Perfectionnement"
                className="w-full mt-4 inline-flex items-center justify-center min-h-[44px] border border-on-surface text-on-surface font-label-caps text-label-caps px-4 py-3 uppercase tracking-[0.2em] hover:bg-primary-container hover:border-primary-container hover:text-on-primary-container transition-[color,background-color,border-color,transform] duration-300 active:scale-[0.97]"
              >
                Réserver
              </a>
            </div>

            {/* Card 2 */}
            <div className={`${cardBase} reveal-delay-1`}>
              <div className="aspect-square mb-6 overflow-hidden bg-surface-container-low w-full">
                <img
                  alt="Nail Art Minimaliste"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-90"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuATUmCuxJJzF9NQXSO41FZsJwgPsYS1KkTurDIZqkA76hdnvBUJlyDq0n82qfzSCETQ_glY0_0MUeTlfqgClFZwenCgO-fgVSehugvMi7S9BU-fPWmQAJe-K4tzcZwT_BqYgz2dsLm2HM_g1nBrFXdUTckAYsg0yOsdcabgkwa_weeGmw86g8vidQaQ05OcUhQFTTigthKsaySS1CuM6jvqw1lpBd_MPnVnm0f5r9BErCbz3M5GxuCq-bDzHzIaWZvmUx8gJ_5hMOi-"
                />
              </div>
              <h4 className="font-headline-sm text-headline-sm text-on-surface mb-2">
                Art & Esthétique
              </h4>
              <p className="font-body-md text-body-md text-on-surface-variant mb-4">
                L'art du minimalisme et des lignes épurées.
              </p>
              <span className="font-label-caps text-label-caps text-primary uppercase mb-4 mt-auto">
                1 Jour · Présentiel Amiens
              </span>
              <div className="session-block">
                <div className="session-eyebrow">
                  <span className="session-rule" />
                  <span className="session-eyebrow-label">Prochaine session</span>
                  <span className="session-rule" />
                </div>
                <p className="session-date-display is-full">Complet</p>
                <p className="session-places-display">Inscription liste d'attente</p>
                <div className="session-full-tag">
                  <span className="session-rule" />
                  <span className="session-full-label">Liste d'attente ouverte</span>
                  <span className="session-rule" />
                </div>
              </div>
              <a
                href="mailto:contact@beautyhomeconcept.fr?subject=Liste d'attente — Art %26 Esthétique"
                className="w-full mt-4 inline-flex items-center justify-center min-h-[44px] border border-outline text-on-surface-variant font-label-caps text-label-caps px-4 py-3 uppercase tracking-[0.2em] hover:border-on-surface hover:text-on-surface transition-[color,border-color,transform] duration-300 active:scale-[0.97]"
              >
                Liste d'attente
              </a>
            </div>

            {/* Card 3 */}
            <div className={`${cardBase} reveal-delay-2`}>
              <div className="aspect-square mb-6 overflow-hidden bg-surface-container-low w-full">
                <img
                  alt="Gestion de Salon"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-90"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAXWiv8EoIuFKzKkswIBuK-r2sdF7N-YjdEBz-f_G1OYHJAtSqQGYPV60M0nk4U_Wyy_HwBA0PgzWS3z7bruhGKJEm8UZAYroDjOAm7AoDH7-le_jm1pQ990j5220-5akf2_u66YJv5kg1QjSThUXYk---Bv-uNsOLfzNCjeSjML5syXGCsLpRu5lm1idlJnkGvpUBdys3h2Febr-vn70tXJRps9lnftD-65Aa4YsqwT7LSv6zr690Bl0GpTYP-x9Sp0KfcV8hZQ_9m"
                />
              </div>
              <h4 className="font-headline-sm text-headline-sm text-on-surface mb-2">
                Création de Salon Haut de Gamme
              </h4>
              <p className="font-body-md text-body-md text-on-surface-variant mb-4">
                Développez une identité visuelle et une clientèle premium.
              </p>
              <span className="font-label-caps text-label-caps text-primary uppercase mb-4 mt-auto">
                Mentorat · Sur mesure
              </span>
              <div className="session-block">
                <div className="session-eyebrow">
                  <span className="session-rule" />
                  <span className="session-eyebrow-label">Prochaines sessions</span>
                  <span className="session-rule" />
                </div>
                <p className="session-date-display">Sur liste d'attente</p>
                <p className="session-places-display">Contactez-nous pour être informée</p>
              </div>
              <a
                href="mailto:contact@beautyhomeconcept.fr?subject=Liste d'attente — Création de Salon"
                className="w-full mt-4 inline-flex items-center justify-center min-h-[44px] border border-outline text-on-surface-variant font-label-caps text-label-caps px-4 py-3 uppercase tracking-[0.2em] hover:border-on-surface hover:text-on-surface transition-[color,border-color,transform] duration-300 active:scale-[0.97]"
              >
                Liste d'attente
              </a>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
