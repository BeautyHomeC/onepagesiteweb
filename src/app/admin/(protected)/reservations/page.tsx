import { createAdminClient } from '@/lib/supabase/server'
import ReservationsTable from './ReservationsTable'

export default async function ReservationsAdminPage() {
  const supabase = await createAdminClient()

  const { data: reservations } = await supabase
    .from('reservations')
    .select(`
      id, prenom, nom, nom_client, email_client,
      telephone, telephone_client, adresse, client_type,
      raison_sociale, siret, instagram,
      statut, acompte_amount, acompte_paid_at,
      contrat_signe_url, created_at,
      sessions (
        date_debut, date_fin,
        formations ( titre, prix )
      )
    `)
    .order('created_at', { ascending: false })

  const total = reservations?.length ?? 0
  const confirmees = reservations?.filter((r) => r.statut === 'confirmee').length ?? 0
  const enAttente = reservations?.filter((r) => r.statut === 'en_attente_paiement').length ?? 0

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-playfair text-3xl text-on-surface mb-2">Réservations</h2>
        <p className="text-on-surface-variant text-sm">
          Suivez les inscriptions, consultez les dossiers clients et téléchargez les documents signés.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total" value={total} />
        <StatCard label="Confirmées" value={confirmees} accent />
        <StatCard label="En attente" value={enAttente} />
      </div>

      <ReservationsTable reservations={(reservations as any) ?? []} />
    </div>
  )
}

function StatCard({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="bg-surface border border-surface-container-highest p-5">
      <p className="text-xs font-label-caps tracking-widest text-on-surface-variant uppercase mb-2">{label}</p>
      <p className={`text-3xl font-playfair ${accent ? 'text-primary' : 'text-on-surface'}`}>{value}</p>
    </div>
  )
}
