import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SessionBooking from './SessionBooking';
import Link from 'next/link';

export default async function FormationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const resolvedParams = await params;
  
  // Fetch formation
  const { data: formation, error } = await supabase
    .from('formations')
    .select('*')
    .eq('id', resolvedParams.id)
    .single();

  if (error || !formation) {
    notFound();
  }

  // Fetch upcoming sessions (including full ones for waitlist display)
  const { data: sessions } = await supabase
    .from('sessions')
    .select('*')
    .eq('formation_id', formation.id)
    .gte('places_disponibles', 0)
    .order('date_debut', { ascending: true });

  return (
    <>
      <Header />
      <main className="pt-[100px] pb-24 bg-surface-container-lowest min-h-screen">
        
        {/* Hero Section of the Formation */}
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop mb-16">
          <Link href="/#formations" className="inline-flex items-center gap-2 min-h-[44px] text-on-surface-variant hover:text-primary transition-colors font-label-caps text-[10px] uppercase tracking-widest mb-8">
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>arrow_back</span>
            Retour aux formations
          </Link>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Left Column: Image */}
            <div className="lg:col-span-5">
              <div className="aspect-[4/5] overflow-hidden bg-surface-container-low shadow-ambient p-2">
                {formation.image_url ? (
                  <img src={formation.image_url} alt={formation.titre} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-surface-variant text-on-surface-variant">Pas d'image</div>
                )}
              </div>
            </div>

            {/* Right Column: Title & Booking */}
            <div className="lg:col-span-7 flex flex-col justify-center">
              <span className="font-label-caps text-primary tracking-widest uppercase mb-4 block">Formation Professionnelle • {formation.duree}</span>
              <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-6 leading-tight">{formation.titre}</h1>
              <p className="font-body-lg text-lg text-on-surface-variant mb-8 leading-relaxed">
                {formation.description}
              </p>
              
              <div className="mb-8 pt-6 border-t border-outline-variant/30 space-y-4">
                <div className="flex gap-8">
                  <div>
                    <span className="block font-label-caps text-[10px] text-on-surface-variant uppercase tracking-[0.25em] mb-1">Prix total</span>
                    <span className="font-playfair text-3xl text-primary">{formation.prix} €</span>
                  </div>
                  <div>
                    <span className="block font-label-caps text-[10px] text-on-surface-variant uppercase tracking-[0.25em] mb-1">Acompte</span>
                    <span className="font-playfair text-2xl text-on-surface">{Math.round(formation.prix * 0.3)} €</span>
                  </div>
                  <div>
                    <span className="block font-label-caps text-[10px] text-on-surface-variant uppercase tracking-[0.25em] mb-1">Lieu</span>
                    <span className="font-playfair text-2xl text-on-surface">Amiens</span>
                  </div>
                </div>
                {/* Financing note */}
                <div className="flex items-center gap-2 text-[10px] text-on-surface-variant uppercase tracking-widest" style={{ fontFamily: 'var(--font-hanken)' }}>
                  <span className="h-px w-4 bg-primary/40 shrink-0" />
                  Éligible FAFCEA · OPCO · CPF
                </div>
              </div>

              {/* Booking Component */}
              <SessionBooking formation={formation} sessions={sessions || []} />
            </div>
          </div>
        </div>

        {/* Detailed Program Section */}
        <div className="bg-surface py-24 border-t border-surface-container-highest">
          <div className="max-w-[800px] mx-auto px-margin-mobile md:px-margin-desktop">
            
            <div className="mb-16">
              <p className="font-label-caps text-[11px] text-primary uppercase tracking-[0.3em] mb-4">Programme</p>
              <h2 className="font-headline-md text-headline-md text-on-surface">Contenu de la formation</h2>
            </div>

            <div className="space-y-16 font-body-md text-on-surface-variant leading-relaxed">
              
              {formation.objectifs && (
                <section>
                  <h3 className="font-headline-sm text-xl text-on-surface mb-4">Objectifs & Public</h3>
                  <div className="whitespace-pre-wrap">{formation.objectifs}</div>
                </section>
              )}

              {formation.competences && (
                <section>
                  <h3 className="font-headline-sm text-xl text-on-surface mb-4">Compétences visées</h3>
                  <div className="whitespace-pre-wrap">{formation.competences}</div>
                </section>
              )}

              {formation.debouches && (
                <section>
                  <h3 className="font-headline-sm text-xl text-on-surface mb-4">Débouchés</h3>
                  <div className="whitespace-pre-wrap">{formation.debouches}</div>
                </section>
              )}

              {formation.deroule && (
                <section>
                  <h3 className="font-headline-sm text-xl text-on-surface mb-6">Déroulé de la formation</h3>
                  <div className="bg-surface-container-lowest p-6 border border-primary/25 whitespace-pre-wrap">
                    {formation.deroule}
                  </div>
                </section>
              )}

              {formation.moyens && (
                <section>
                  <h3 className="font-headline-sm text-xl text-on-surface mb-4">Moyens, Organisation & Infos Pratiques</h3>
                  <div className="whitespace-pre-wrap">{formation.moyens}</div>
                </section>
              )}

              {formation.evaluation && (
                <section className="bg-surface-container-lowest p-8 border border-outline-variant">
                  <h3 className="font-headline-sm text-xl text-on-surface mb-4">Évaluation, Certification & Accessibilité</h3>
                  <div className="whitespace-pre-wrap">{formation.evaluation}</div>
                </section>
              )}

            </div>
          </div>
        </div>

      </main>
      <Footer />
    </>
  );
}
