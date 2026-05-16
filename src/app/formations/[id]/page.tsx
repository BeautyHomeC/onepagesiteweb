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

  // Fetch upcoming sessions
  const { data: sessions } = await supabase
    .from('sessions')
    .select('*')
    .eq('formation_id', formation.id)
    .gt('places_disponibles', 0)
    .order('date_debut', { ascending: true });

  return (
    <>
      <Header />
      <main className="pt-[100px] pb-24 bg-surface-container-lowest min-h-screen">
        
        {/* Hero Section of the Formation */}
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop mb-16">
          <Link href="/#formations" className="inline-flex items-center text-on-surface-variant hover:text-primary transition-colors font-label-caps text-xs uppercase tracking-widest mb-8">
            <span className="material-symbols-outlined text-[18px] mr-2">arrow_back</span>
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
              <h1 className="font-headline-lg text-4xl md:text-5xl text-on-surface mb-6 leading-tight">{formation.titre}</h1>
              <p className="font-body-lg text-lg text-on-surface-variant mb-8 leading-relaxed">
                {formation.description}
              </p>
              
              <div className="flex gap-6 mb-12">
                <div className="border-l-2 border-primary pl-4">
                  <span className="block font-label-caps text-xs text-on-surface-variant uppercase tracking-widest mb-1">Prix total</span>
                  <span className="font-headline-sm text-2xl text-on-surface">{formation.prix} €</span>
                </div>
                <div className="border-l-2 border-primary pl-4">
                  <span className="block font-label-caps text-xs text-on-surface-variant uppercase tracking-widest mb-1">Format</span>
                  <span className="font-headline-sm text-xl text-on-surface">Présentiel</span>
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
            
            <div className="text-center mb-16">
              <h2 className="font-headline-md text-3xl text-on-surface mb-4">Programme Détaillé</h2>
              <div className="h-px w-24 bg-primary mx-auto"></div>
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
                  <div className="bg-surface-container-lowest p-6 border-l-4 border-primary shadow-sm whitespace-pre-wrap">
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
