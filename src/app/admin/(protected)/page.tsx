import { createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AdminDashboard() {
  const supabase = await createAdminClient();

  const signOut = async () => {
    'use server'
    const { createClient } = await import('@/lib/supabase/server')
    const sc = await createClient()
    await sc.auth.signOut()
    redirect('/admin/login')
  }

  // Fetch sessions with formations + reservations (using new field names)
  const { data: sessions } = await supabase
    .from('sessions')
    .select(`
      id, date_debut, date_fin, places_disponibles,
      formations ( titre, prix ),
      reservations ( id, prenom, nom, nom_client, email_client, telephone, telephone_client, acompte_amount, statut, stripe_payment_id, created_at )
    `)
    .order('date_debut', { ascending: true });

  // Count pending balances for widget
  const { count: soldesEnAttente } = await supabase
    .from('reservations')
    .select('id', { count: 'exact', head: true })
    .eq('statut', 'confirmee')
    .is('solde_paid_at', null)

  return (
    <div>
      <div className="flex justify-between items-end mb-8">
        <h2 className="font-headline-md text-headline-md">Tableau de Bord</h2>
        <form action={signOut}>
          <button type="submit" className="font-label-caps text-label-caps text-on-surface-variant hover:text-error transition-colors uppercase border-b border-transparent hover:border-error pb-1">
            Se déconnecter
          </button>
        </form>
      </div>

      {/* Billing widget */}
      {(soldesEnAttente ?? 0) > 0 && (
        <div className="mb-8 p-5 bg-amber-50 border border-amber-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-label-caps tracking-widest text-amber-700 uppercase mb-1">Soldes en attente</p>
            <p className="text-on-surface text-sm font-medium">
              {soldesEnAttente} solde{(soldesEnAttente ?? 0) > 1 ? 's' : ''} à encaisser
            </p>
          </div>
          <a
            href="/admin/facturation"
            className="text-xs font-label-caps tracking-widest text-amber-700 hover:text-amber-900 uppercase border-b border-amber-400 pb-0.5 transition-colors"
          >
            Voir la facturation →
          </a>
        </div>
      )}

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
                    {(session.formations as any)?.titre}
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
                <h4 className="font-label-caps text-label-caps uppercase text-on-surface-variant mb-4">
                  Liste d'émargement ({(session.reservations as any[])?.length || 0} inscrits)
                </h4>
                {(session.reservations as any[])?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-body-md">
                      <thead>
                        <tr className="border-b border-surface-container-high text-on-surface-variant">
                          <th className="py-3 font-normal">Nom</th>
                          <th className="py-3 font-normal">Email</th>
                          <th className="py-3 font-normal">Statut</th>
                          <th className="py-3 font-normal">Inscription</th>
                          <th className="py-3 font-normal">Dossier</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(session.reservations as any[]).map((res) => {
                          const nomAffiche = (`${res.prenom ?? ''} ${res.nom ?? ''}`.trim() || res.nom_client) ?? '—'
                          return (
                            <tr key={res.id} className="border-b border-surface-container-low last:border-0">
                              <td className="py-4">{nomAffiche}</td>
                              <td className="py-4 text-on-surface-variant">{res.email_client ?? '—'}</td>
                              <td className="py-4">
                                <span className={`text-xs px-2 py-0.5 font-label-caps tracking-wider ${
                                  res.statut === 'confirmee' ? 'text-green-700 bg-green-50' : 'text-amber-700 bg-amber-50'
                                }`}>
                                  {res.statut === 'confirmee' ? 'Confirmée' : 'En attente'}
                                </span>
                              </td>
                              <td className="py-4 text-on-surface-variant text-sm">
                                {new Date(res.created_at).toLocaleDateString('fr-FR')}
                              </td>
                              <td className="py-4">
                                <a
                                  href={`/api/admin/reservations/${res.id}/dossier`}
                                  download
                                  className="text-xs text-on-surface-variant hover:text-primary transition-colors font-label-caps tracking-wider"
                                  title="Télécharger le dossier ZIP"
                                >
                                  ZIP ↓
                                </a>
                              </td>
                            </tr>
                          )
                        })}
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
