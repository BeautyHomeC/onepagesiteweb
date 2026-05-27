import { createAdminClient } from '@/lib/supabase/server'
import FacturationTable from './FacturationTable'

export const dynamic = 'force-dynamic'

export default async function FacturationPage() {
  const supabase = await createAdminClient()

  const { data: rawReservations } = await supabase
    .from('reservations')
    .select(`
      id, prenom, nom, nom_client, email_client,
      telephone, telephone_client, adresse, client_type, raison_sociale, siret,
      acompte_amount, acompte_paid_at, stripe_payment_id,
      solde_paid_at, solde_payment_method, facture_finale_url,
      created_at,
      sessions (
        date_debut, date_fin,
        formations ( titre, prix )
      )
    `)
    .eq('statut', 'confirmee')
    .order('created_at', { ascending: false })

  const all = rawReservations ?? []

  // Generate signed URLs for final invoices already stored
  const reservations = await Promise.all(
    all.map(async (r) => {
      if (r.facture_finale_url) {
        const { data } = await supabase.storage
          .from('contracts')
          .createSignedUrl(r.facture_finale_url, 3600)
        return { ...r, facture_finale_signed_url: data?.signedUrl ?? null }
      }
      return { ...r, facture_finale_signed_url: null }
    })
  )

  const total = reservations.length
  const regles = reservations.filter(r => r.solde_paid_at).length
  const enAttente = reservations.filter(r => !r.solde_paid_at).length
  const soldesEnAttenteMontant = reservations
    .filter(r => !r.solde_paid_at)
    .reduce((sum, r) => {
      const prix = (r as any).sessions?.formations?.prix ?? 0
      const acompte = r.acompte_amount ?? 0
      return sum + Math.max(0, prix - acompte)
    }, 0)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-playfair text-3xl text-on-surface mb-2">Facturation</h2>
        <p className="text-on-surface-variant text-sm">
          Encaissez les soldes finaux et générez les factures pour vos élèves.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface border border-surface-container-highest p-5">
          <p className="text-xs font-label-caps tracking-widest text-on-surface-variant uppercase mb-2">Soldes en attente</p>
          <p className="text-3xl font-playfair text-amber-700">{enAttente}</p>
          {soldesEnAttenteMontant > 0 && (
            <p className="text-xs text-on-surface-variant mt-1">
              {soldesEnAttenteMontant.toLocaleString('fr-FR')} € à encaisser
            </p>
          )}
        </div>
        <div className="bg-surface border border-surface-container-highest p-5">
          <p className="text-xs font-label-caps tracking-widest text-on-surface-variant uppercase mb-2">Tout réglé</p>
          <p className="text-3xl font-playfair text-green-700">{regles}</p>
        </div>
        <div className="bg-surface border border-surface-container-highest p-5">
          <p className="text-xs font-label-caps tracking-widest text-on-surface-variant uppercase mb-2">Total confirmées</p>
          <p className="text-3xl font-playfair text-on-surface">{total}</p>
        </div>
      </div>

      <FacturationTable reservations={reservations as any[]} />
    </div>
  )
}
