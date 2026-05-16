import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DownloadContractButton from './DownloadContractButton';

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData?.user) {
    redirect('/admin/login');
  }

  const signOut = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/admin/login')
  }

  // Fetch formations, sessions, and reservations
  const { data: sessions } = await supabase
    .from('sessions')
    .select(`
      *,
      formations ( titre, prix ),
      reservations ( id, nom_client, email_client, telephone_client, stripe_payment_id, created_at )
    `)
    .order('date_debut', { ascending: true });

  return (
    <div>
      <div className="flex justify-between items-end mb-12">
        <h2 className="font-headline-md text-headline-md">Tableau de Bord</h2>
        <form action={signOut}>
          <button type="submit" className="font-label-caps text-label-caps text-on-surface-variant hover:text-error transition-colors uppercase border-b border-transparent hover:border-error pb-1">
            Se déconnecter
          </button>
        </form>
      </div>

      <div className="space-y-12">
        {sessions?.length === 0 ? (
          <div className="p-8 bg-surface border border-surface-container-highest text-center space-y-4">
            <p className="text-on-surface-variant font-body-md">Aucune session programmée pour le moment.</p>
            <div className="flex justify-center gap-4 pt-4">
              <a href="/admin/formations" className="inline-block border border-surface-container-highest px-6 py-3 font-label-caps tracking-widest text-sm hover:text-primary transition-colors">
                GÉRER LE CATALOGUE
              </a>
              <a href="/admin/sessions" className="inline-block bg-primary text-on-primary px-6 py-3 font-label-caps tracking-widest text-sm hover:bg-primary-container hover:text-on-primary-container transition-colors">
                + OUVRIR UNE SESSION
              </a>
            </div>
          </div>
        ) : (
          sessions?.map((session) => (
            <div key={session.id} className="bg-surface p-8 shadow-ambient border border-surface-container-highest">
              <div className="flex justify-between items-start mb-6 pb-6 border-b border-surface-container-highest">
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-primary mb-2">
                    {session.formations?.titre}
                  </h3>
                  <p className="font-body-md text-on-surface-variant">
                    Du {new Date(session.date_debut).toLocaleDateString('fr-FR')} au {new Date(session.date_fin).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="text-right">
                  <span className="block font-display-lg-mobile text-primary leading-none mb-1">
                    {session.places_disponibles}
                  </span>
                  <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                    Places restantes
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-label-caps text-label-caps uppercase text-on-surface-variant mb-4">Liste d'émargement ({session.reservations?.length || 0} inscrits)</h4>
                {session.reservations && session.reservations.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-body-md">
                      <thead>
                        <tr className="border-b border-surface-container-high text-on-surface-variant">
                          <th className="py-3 font-normal">Nom du client</th>
                          <th className="py-3 font-normal">Email</th>
                          <th className="py-3 font-normal">Téléphone</th>
                          <th className="py-3 font-normal">Date d'inscription</th>
                          <th className="py-3 font-normal">Dossier</th>
                        </tr>
                      </thead>
                      <tbody>
                        {session.reservations.map((res: any) => (
                          <tr key={res.id} className="border-b border-surface-container-low last:border-0">
                            <td className="py-4">{res.nom_client}</td>
                            <td className="py-4 text-on-surface-variant">{res.email_client}</td>
                            <td className="py-4 text-on-surface-variant">{res.telephone_client}</td>
                            <td className="py-4 text-on-surface-variant text-sm">
                              {new Date(res.created_at).toLocaleDateString('fr-FR')}
                            </td>
                            <td className="py-4">
                              <DownloadContractButton reservation={res as any} session={session as any} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-on-surface-variant text-sm italic">Aucune réservation pour le moment.</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
