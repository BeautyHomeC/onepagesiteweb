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
    <section id="formations" className="bg-surface-container-lowest py-section-gap relative">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="flex justify-between items-end mb-16">
          <h2 className="font-headline-md text-headline-md text-on-surface">Formations</h2>
          <Link href="#formations" className="hidden md:inline-block text-on-surface-variant font-label-caps text-label-caps hover:text-primary transition-colors pb-1 border-b border-transparent hover:border-primary uppercase">
            Découvrir les Formations
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12 text-on-surface-variant font-body-md">Chargement des formations...</div>
        ) : formations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {formations.map((formation) => (
              <div key={formation.id} className="group cursor-pointer bg-surface p-6 shadow-ambient transition-shadow duration-300 flex flex-col items-center text-center">
                <div className="aspect-square mb-6 overflow-hidden bg-surface-container-low w-full p-2">
                  {formation.image_url ? (
                    <img 
                      alt={formation.titre} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-90" 
                      src={formation.image_url}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-surface-variant text-on-surface-variant font-body-md">Pas d'image</div>
                  )}
                </div>
                <h4 className="font-headline-sm text-headline-sm text-on-surface mb-2">{formation.titre}</h4>
                <p className="font-body-md text-body-md text-on-surface-variant mb-4">{formation.description}</p>
                <span className="font-label-caps text-label-caps text-primary uppercase mb-6 mt-auto">{formation.duree || "Sur mesure"}</span>
                <Link 
                  href={`/formations/${formation.id}`}
                  className="w-full inline-block text-center border border-on-surface text-on-surface font-label-caps text-label-caps px-4 py-3 uppercase tracking-[0.2em] hover:bg-primary-container hover:border-primary-container hover:text-on-primary-container transition-all duration-300 active:opacity-50 rounded-none"
                >
                  Découvrir le programme
                </Link>
              </div>
            ))}
          </div>
        ) : (
          /* FALLBACK UI if Database is empty */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {/* Card 1 */}
            <div className="group cursor-pointer bg-surface p-6 shadow-ambient transition-shadow duration-300 flex flex-col items-center text-center">
              <div className="aspect-square mb-6 overflow-hidden bg-surface-container-low w-full p-2">
                <img 
                  alt="Manucure Russe" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-90" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDp1PbLB8PAw6WwBvWr3OksuzJoKLmAsb5gjEJ8nHAa6-ZfsIKYXtrWIaK-YUBvaLVDsdm5xh2C7peJw6_EB2qoW4nc8DmEnbcS0bhWow5HYNL1Z2wfn6f2QVi-DWZC4MKqFpxowjTxwEAqK4zLk22iBq4waGeR5veeHcZ2PIvSCwEgQ6PkrPHNH-MGSD5j3qw9ts6C8l8T2Tfu-XxqhKl7eCcex5FtKPtms4cwPXAWnccwP_1ewcVYQKvA4clwMyoAEIhfmmA6Vuhp"
                />
              </div>
              <h4 className="font-headline-sm text-headline-sm text-on-surface mb-2">Masterclass Perfectionnement</h4>
              <p className="font-body-md text-body-md text-on-surface-variant mb-4">Maîtrisez les techniques avancées et la préparation parfaite.</p>
              <span className="font-label-caps text-label-caps text-primary uppercase mb-6 mt-auto">2 Jours • Présentiel Amiens</span>
              <button onClick={() => alert('Veuillez configurer la base de données Supabase.')} className="w-full border border-on-surface text-on-surface font-label-caps text-label-caps px-4 py-3 uppercase tracking-[0.2em] hover:bg-primary-container hover:border-primary-container hover:text-on-primary-container transition-all duration-300 active:opacity-50 rounded-none">
                Réserver
              </button>
            </div>
            
            {/* Card 2 */}
            <div className="group cursor-pointer bg-surface p-6 shadow-ambient transition-shadow duration-300 flex flex-col items-center text-center">
              <div className="aspect-square mb-6 overflow-hidden bg-surface-container-low w-full p-2">
                <img 
                  alt="Nail Art Minimaliste" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-90" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuATUmCuxJJzF9NQXSO41FZsJwgPsYS1KkTurDIZqkA76hdnvBUJlyDq0n82qfzSCETQ_glY0_0MUeTlfqgClFZwenCgO-fgVSehugvMi7S9BU-fPWmQAJe-K4tzcZwT_BqYgz2dsLm2HM_g1nBrFXdUTckAYsg0yOsdcabgkwa_weeGmw86g8vidQaQ05OcUhQFTTigthKsaySS1CuM6jvqw1lpBd_MPnVnm0f5r9BErCbz3M5GxuCq-bDzHzIaWZvmUx8gJ_5hMOi-"
                />
              </div>
              <h4 className="font-headline-sm text-headline-sm text-on-surface mb-2">Art & Esthétique</h4>
              <p className="font-body-md text-body-md text-on-surface-variant mb-4">L'art du minimalisme et des lignes épurées.</p>
              <span className="font-label-caps text-label-caps text-primary uppercase mb-6 mt-auto">1 Jour • Présentiel Amiens</span>
              <button onClick={() => alert('Veuillez configurer la base de données Supabase.')} className="w-full border border-on-surface text-on-surface font-label-caps text-label-caps px-4 py-3 uppercase tracking-[0.2em] hover:bg-primary-container hover:border-primary-container hover:text-on-primary-container transition-all duration-300 active:opacity-50 rounded-none">
                Réserver
              </button>
            </div>
            
            {/* Card 3 */}
            <div className="group cursor-pointer bg-surface p-6 shadow-ambient transition-shadow duration-300 flex flex-col items-center text-center">
              <div className="aspect-square mb-6 overflow-hidden bg-surface-container-low w-full p-2">
                <img 
                  alt="Gestion de Salon" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out opacity-90" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAXWiv8EoIuFKzKkswIBuK-r2sdF7N-YjdEBz-f_G1OYHJAtSqQGYPV60M0nk4U_Wyy_HwBA0PgzWS3z7bruhGKJEm8UZAYroDjOAm7AoDH7-le_jm1pQ990j5220-5akf2_u66YJv5kg1QjSThUXYk---Bv-uNsOLfzNCjeSjML5syXGCsLpRu5lm1idlJnkGvpUBdys3h2Febr-vn70tXJRps9lnftD-65Aa4YsqwT7LSv6zr690Bl0GpTYP-x9Sp0KfcV8hZQ_9m"
                />
              </div>
              <h4 className="font-headline-sm text-headline-sm text-on-surface mb-2">Création de Salon Haut de Gamme</h4>
              <p className="font-body-md text-body-md text-on-surface-variant mb-4">Développez une identité visuelle et une clientèle premium.</p>
              <span className="font-label-caps text-label-caps text-primary uppercase mb-6 mt-auto">Mentorat • Sur mesure</span>
              <button onClick={() => alert('Veuillez configurer la base de données Supabase.')} className="w-full border border-on-surface text-on-surface font-label-caps text-label-caps px-4 py-3 uppercase tracking-[0.2em] hover:bg-primary-container hover:border-primary-container hover:text-on-primary-container transition-all duration-300 active:opacity-50 rounded-none">
                Réserver
              </button>
            </div>
          </div>
        )}
        
        <div className="mt-8 text-center md:hidden">
          <Link href="#formations" className="inline-block border border-on-surface text-on-surface font-label-caps text-label-caps px-8 py-3 uppercase tracking-[0.2em] hover:bg-primary-container hover:border-primary-container hover:text-on-primary-container transition-colors w-full rounded-none">
            Découvrir les Formations
          </Link>
        </div>
      </div>
    </section>
  );
}
