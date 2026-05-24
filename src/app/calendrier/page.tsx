import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CalendrierView from "@/components/CalendrierView";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Calendrier des sessions | Beauty Home Concept",
  description:
    "Consultez les prochaines dates de formation en prothésie ongulaire à Amiens.",
};

export default async function CalendrierPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

  const { data: sessions } = await supabase
    .from("sessions")
    .select("id, formation_id, date_debut, date_fin, places_disponibles, formations(titre, prix)")
    .gte("date_debut", today)
    .order("date_debut", { ascending: true });

  return (
    <>
      <Header />
      <main className="pt-[100px] pb-24 bg-surface-container-lowest min-h-screen">

        {/* ── Hero ─────────────────────────────────────────────── */}
        <div className="bg-surface border-b border-outline-variant/20">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 md:py-24">
            <span className="font-label-caps text-primary tracking-[0.3em] uppercase mb-4 block">
              Beauty Home Concept
            </span>
            <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface leading-tight mb-8 max-w-3xl">
              Calendrier des sessions
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
              Retrouvez toutes les prochaines dates de formation disponibles.
              Réservez votre place dès maintenant pour garantir votre accès à
              nos sessions en prothésie ongulaire à Amiens.
            </p>
          </div>
        </div>

        {/* ── Sessions ─────────────────────────────────────────── */}
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16 md:py-24">

          <div className="mb-12 md:mb-16">
            <p className="font-label-caps text-[11px] text-primary uppercase tracking-[0.3em] mb-4">
              Prochaines dates
            </p>
            <h2 className="font-headline-md text-headline-md text-on-surface max-w-xl">
              Sessions à venir
            </h2>
          </div>

          <CalendrierView sessions={sessions ?? []} />
        </div>

      </main>
      <Footer />
    </>
  );
}
