"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function FormationsSection() {
  const [formations, setFormations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFormation, setSelectedFormation] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  
  const supabase = createClient();

  useEffect(() => {
    async function fetchFormations() {
      try {
        const { data, error } = await supabase.from('formations').select('*');
        if (data && data.length > 0) {
          setFormations(data);
        }
      } catch (e) {
        console.error("Supabase not configured yet");
      } finally {
        setLoading(false);
      }
    }
    fetchFormations();
  }, [supabase]);

  const openModal = async (formation: any) => {
    setSelectedFormation(formation);
    setIsModalOpen(true);
    setLoadingSessions(true);
    
    try {
      const { data } = await supabase
        .from('sessions')
        .select('*')
        .eq('formation_id', formation.id)
        .gt('places_disponibles', 0)
        .order('date_debut', { ascending: true });
      
      setSessions(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleCheckout = async (sessionId: string) => {
    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Une erreur est survenue");
        setCheckoutLoading(false);
      }
    } catch (e) {
      console.error(e);
      alert("Erreur réseau");
      setCheckoutLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedFormation(null);
    setSessions([]);
  };

  return (
    <section id="formations" className="bg-surface py-section-gap relative">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">

        {/* Section header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-6 h-px bg-primary flex-shrink-0"></div>
              <span className="font-label-caps text-label-caps text-primary uppercase tracking-[0.25em]">Catalogue</span>
            </div>
            <h2 className="font-playfair text-[36px] md:text-[48px] leading-[1.1] text-on-surface" style={{ letterSpacing: '-0.01em' }}>
              Nos Formations
            </h2>
          </div>
          <p className="font-body-md text-on-surface-variant max-w-xs md:text-right">
            Présentiel · Amiens (80)<br />Sessions limitées à 1–2 élèves
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-on-surface-variant font-body-md">Chargement des formations...</div>
        ) : formations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {formations.map((formation) => (
              <div key={formation.id} className="group bg-surface-container-lowest border border-surface-container-highest flex flex-col overflow-hidden">
                <div className="aspect-[4/3] overflow-hidden bg-surface-container-low">
                  {formation.image_url ? (
                    <img
                      alt={formation.titre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      src={formation.image_url}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-surface-container text-on-surface-variant font-body-md text-sm">
                      <span className="material-symbols-outlined text-[48px] opacity-30" style={{ fontVariationSettings: "'FILL' 0, 'wght' 200, 'GRAD' 0, 'opsz' 24" }}>image</span>
                    </div>
                  )}
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <span className="font-label-caps text-label-caps text-primary uppercase tracking-[0.2em] mb-3">{formation.duree || "Sur mesure"}</span>
                  <h4 className="font-playfair text-[22px] leading-snug text-on-surface mb-3">{formation.titre}</h4>
                  <p className="font-body-md text-sm text-on-surface-variant leading-relaxed mb-5 flex-1">{formation.description}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-surface-container-highest mb-5">
                    <div>
                      <span className="font-playfair text-[28px] text-primary leading-none">{formation.prix ? `${formation.prix} €` : "—"}</span>
                      <span className="font-label-caps text-[10px] text-on-surface-variant ml-2 uppercase tracking-widest">TTC</span>
                    </div>
                    <span className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-widest">Acompte 30%</span>
                  </div>
                  <Link
                    href={`/formations/${formation.id}`}
                    className="w-full inline-block text-center bg-on-surface text-surface font-label-caps text-label-caps px-4 py-3.5 uppercase tracking-[0.2em] hover:bg-primary transition-all duration-300"
                  >
                    Découvrir le programme
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Fallback si base vide */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {[
              {
                titre: "Masterclass Perfectionnement",
                description: "Maîtrisez les techniques avancées et la préparation parfaite de l'ongle naturel.",
                duree: "7h · Présentiel Amiens",
                prix: "600",
                img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDp1PbLB8PAw6WwBvWr3OksuzJoKLmAsb5gjEJ8nHAa6-ZfsIKYXtrWIaK-YUBvaLVDsdm5xh2C7peJw6_EB2qoW4nc8DmEnbcS0bhWow5HYNL1Z2wfn6f2QVi-DWZC4MKqFpxowjTxwEAqK4zLk22iBq4waGeR5veeHcZ2PIvSCwEgQ6PkrPHNH-MGSD5j3qw9ts6C8l8T2Tfu-XxqhKl7eCcex5FtKPtms4cwPXAWnccwP_1ewcVYQKvA4clwMyoAEIhfmmA6Vuhp",
              },
              {
                titre: "Manucure Russe Pro",
                description: "L'art de la préparation à sec, la cuticule parfaite et la tenue longue durée.",
                duree: "7h · Présentiel Amiens",
                prix: "450",
                img: "https://lh3.googleusercontent.com/aida-public/AB6AXuATUmCuxJJzF9NQXSO41FZsJwgPsYS1KkTurDIZqkA76hdnvBUJlyDq0n82qfzSCETQ_glY0_0MUeTlfqgClFZwenCgO-fgVSehugvMi7S9BU-fPWmQAJe-K4tzcZwT_BqYgz2dsLm2HM_g1nBrFXdUTckAYsg0yOsdcabgkwa_weeGmw86g8vidQaQ05OcUhQFTTigthKsaySS1CuM6jvqw1lpBd_MPnVnm0f5r9BErCbz3M5GxuCq-bDzHzIaWZvmUx8gJ_5hMOi-",
              },
              {
                titre: "Création de Salon Haut de Gamme",
                description: "Développez une identité visuelle, une clientèle premium et une offre cohérente.",
                duree: "Mentorat · Sur mesure",
                prix: null,
                img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAXWiv8EoIuFKzKkswIBuK-r2sdF7N-YjdEBz-f_G1OYHJAtSqQGYPV60M0nk4U_Wyy_HwBA0PgzWS3z7bruhGKJEm8UZAYroDjOAm7AoDH7-le_jm1pQ990j5220-5akf2_u66YJv5kg1QjSThUXYk---Bv-uNsOLfzNCjeSjML5syXGCsLpRu5lm1idlJnkGvpUBdys3h2Febr-vn70tXJRps9lnftD-65Aa4YsqwT7LSv6zr690Bl0GpTYP-x9Sp0KfcV8hZQ_9m",
              },
            ].map((f, i) => (
              <div key={i} className="group bg-surface-container-lowest border border-surface-container-highest flex flex-col overflow-hidden">
                <div className="aspect-[4/3] overflow-hidden">
                  <img alt={f.titre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src={f.img} />
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <span className="font-label-caps text-label-caps text-primary uppercase tracking-[0.2em] mb-3">{f.duree}</span>
                  <h4 className="font-playfair text-[22px] leading-snug text-on-surface mb-3">{f.titre}</h4>
                  <p className="font-body-md text-sm text-on-surface-variant leading-relaxed mb-5 flex-1">{f.description}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-surface-container-highest mb-5">
                    <span className="font-playfair text-[28px] text-primary leading-none">{f.prix ? `${f.prix} €` : "Sur devis"}</span>
                  </div>
                  <button
                    onClick={() => alert('Configurer la base de données Supabase pour activer les réservations.')}
                    className="w-full bg-on-surface text-surface font-label-caps text-label-caps px-4 py-3.5 uppercase tracking-[0.2em] hover:bg-primary transition-all duration-300"
                  >
                    Réserver ma place
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
