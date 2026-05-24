"use client";

import Link from "next/link";

type Formation = {
  titre: string;
  prix: number;
};

type Session = {
  id: string;
  date_debut: string;
  date_fin: string;
  places_disponibles: number;
  formations: Formation | Formation[] | null;
  formation_id?: string;
};

type Props = {
  sessions: Session[];
};

function formatDateRange(dateDebut: string, dateFin: string): string {
  const start = new Date(dateDebut);
  const end = new Date(dateFin);

  const startDay = start.toLocaleDateString("fr-FR", { day: "numeric" });
  const endDay = end.toLocaleDateString("fr-FR", { day: "numeric" });
  const endMonthYear = end.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  if (
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear()
  ) {
    return `${startDay} – ${endDay} ${endMonthYear}`;
  }

  const startMonthYear = start.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
  });
  return `${startMonthYear} – ${endDay} ${endMonthYear}`;
}

function getMonthKey(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
}

function groupByMonth(sessions: Session[]): Map<string, Session[]> {
  const map = new Map<string, Session[]>();
  for (const session of sessions) {
    const key = getMonthKey(session.date_debut);
    const existing = map.get(key);
    if (existing) {
      existing.push(session);
    } else {
      map.set(key, [session]);
    }
  }
  return map;
}

export default function CalendrierView({ sessions }: Props) {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-24 px-margin-mobile">
        <span
          className="material-symbols-outlined text-[48px] text-primary/30 mb-6 block"
          style={{
            fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 48",
          }}
        >
          calendar_month
        </span>
        <p className="font-playfair text-2xl text-on-surface mb-4">
          Aucune session prévue pour le moment.
        </p>
        <p className="font-body-md text-on-surface-variant">
          Revenez bientôt !
        </p>
      </div>
    );
  }

  const grouped = groupByMonth(sessions);

  return (
    <div className="flex flex-col gap-16">
      {Array.from(grouped.entries()).map(([month, monthSessions]) => (
        <section key={month}>
          {/* Month heading */}
          <div className="border-b border-outline-variant/30 pb-4 mb-8">
            <h2 className="font-playfair text-2xl md:text-3xl text-on-surface capitalize">
              {month}
            </h2>
          </div>

          {/* Sessions list */}
          <div className="flex flex-col gap-px bg-outline-variant/10">
            {monthSessions.map((session) => {
              const isComplet = session.places_disponibles === 0;
              const formation = Array.isArray(session.formations)
                ? (session.formations[0] ?? null)
                : session.formations;
              const reserveHref = session.formation_id
                ? `/formations/${session.formation_id}`
                : "/#formations";

              return (
                <div
                  key={session.id}
                  className="bg-surface border border-outline-variant/20 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6"
                >
                  {/* Left: info */}
                  <div className="flex flex-col gap-2">
                    {/* Formation title */}
                    <p className="font-headline-sm text-headline-sm text-on-surface leading-tight">
                      {formation?.titre ?? "Formation"}
                    </p>

                    {/* Date range */}
                    <p className="font-label-caps text-[10px] tracking-[0.2em] uppercase text-on-surface-variant">
                      {formatDateRange(session.date_debut, session.date_fin)}
                    </p>

                    {/* Places / price row */}
                    <div className="flex items-center gap-4 mt-1">
                      {isComplet ? (
                        <span className="font-label-caps text-[10px] uppercase tracking-[0.15em] px-3 py-1 bg-error-container text-on-error-container">
                          COMPLET
                        </span>
                      ) : (
                        <span className="font-label-caps text-[10px] tracking-[0.15em] uppercase text-on-surface-variant">
                          {session.places_disponibles} place
                          {session.places_disponibles > 1 ? "s" : ""} disponible
                          {session.places_disponibles > 1 ? "s" : ""}
                        </span>
                      )}

                      {formation && (
                        <>
                          <span className="text-outline-variant/40 text-xs select-none">
                            —
                          </span>
                          <span className="font-label-caps text-[10px] tracking-[0.15em] uppercase text-primary">
                            {formation.prix} €
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right: CTA */}
                  <div className="flex-shrink-0">
                    <Link
                      href={reserveHref}
                      className="inline-block border border-primary text-primary font-label-caps text-[10px] uppercase tracking-[0.2em] px-4 py-2 hover:bg-primary hover:text-on-primary transition-[color,background-color] duration-200"
                    >
                      Réserver
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
