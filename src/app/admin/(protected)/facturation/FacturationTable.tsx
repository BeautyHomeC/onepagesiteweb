'use client'

import { useState } from 'react'
import EncaissementModal from './EncaissementModal'

export interface FacturationReservation {
  id: string
  prenom: string | null
  nom: string | null
  nom_client: string | null
  email_client: string | null
  telephone: string | null
  telephone_client: string | null
  adresse: string | null
  client_type: string | null
  raison_sociale: string | null
  siret: string | null
  acompte_amount: number | null
  acompte_paid_at: string | null
  stripe_payment_id: string | null
  solde_paid_at: string | null
  solde_payment_method: string | null
  facture_finale_url: string | null
  facture_finale_signed_url: string | null
  created_at: string
  sessions: {
    date_debut: string
    date_fin: string
    formations: {
      titre: string
      prix: number
    } | null
  } | null
}

const FILTERS = [
  { value: 'all', label: 'Tous' },
  { value: 'pending', label: 'Solde en attente' },
  { value: 'paid', label: 'Tout réglé' },
]

export default function FacturationTable({ reservations }: { reservations: FacturationReservation[] }) {
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState<FacturationReservation | null>(null)

  const filtered = reservations.filter(r => {
    if (filter === 'pending') return !r.solde_paid_at
    if (filter === 'paid') return !!r.solde_paid_at
    return true
  })

  const handleSuccess = () => {
    setSelected(null)
    window.location.reload()
  }

  return (
    <>
      {/* Filter tabs */}
      <div className="flex gap-1 border border-surface-container-highest bg-surface p-1 w-fit">
        {FILTERS.map(f => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 text-xs font-label-caps tracking-wider transition-colors ${
              filter === f.value
                ? 'bg-primary text-on-primary'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-on-surface-variant italic text-sm py-8 text-center">Aucune réservation trouvée.</p>
      ) : (
        <div className="overflow-x-auto border border-surface-container-highest">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-container-lowest border-b border-surface-container-highest">
              <tr className="text-xs font-label-caps tracking-wider text-on-surface-variant uppercase">
                <th className="px-4 py-3 font-normal">Élève</th>
                <th className="px-4 py-3 font-normal">Formation</th>
                <th className="px-4 py-3 font-normal">Session</th>
                <th className="px-4 py-3 font-normal">Acompte</th>
                <th className="px-4 py-3 font-normal">Solde</th>
                <th className="px-4 py-3 font-normal">Statut</th>
                <th className="px-4 py-3 font-normal">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low bg-surface">
              {filtered.map(r => {
                const nomComplet = (`${r.prenom ?? ''} ${r.nom ?? ''}`.trim() || r.nom_client) ?? '—'
                const formation = r.sessions?.formations
                const prix = formation?.prix ?? 0
                const acompte = r.acompte_amount ?? 0
                const solde = Math.max(0, prix - acompte)
                const dateDebut = r.sessions?.date_debut
                  ? new Date(r.sessions.date_debut).toLocaleDateString('fr-FR') : '—'
                const dateFin = r.sessions?.date_fin
                  ? new Date(r.sessions.date_fin).toLocaleDateString('fr-FR') : '—'
                const dateStr = dateDebut === dateFin ? dateDebut : `${dateDebut} → ${dateFin}`

                return (
                  <tr key={r.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-medium text-on-surface block">{nomComplet}</span>
                      <span className="text-xs text-on-surface-variant">{r.email_client}</span>
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">{formation?.titre ?? '—'}</td>
                    <td className="px-4 py-3 text-on-surface-variant whitespace-nowrap">{dateStr}</td>
                    <td className="px-4 py-3 text-on-surface-variant">
                      {acompte > 0 ? `${acompte.toLocaleString('fr-FR')} €` : '—'}
                    </td>
                    <td className="px-4 py-3 font-medium text-on-surface">
                      {solde > 0 ? `${solde.toLocaleString('fr-FR')} €` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {r.solde_paid_at ? (
                        <div>
                          <span className="text-xs px-2 py-0.5 font-label-caps tracking-wider text-green-700 bg-green-50 block w-fit">
                            Réglé ✓
                          </span>
                          {r.solde_payment_method && (
                            <span className="text-xs text-on-surface-variant mt-0.5 block">
                              {r.solde_payment_method}
                            </span>
                          )}
                          {r.solde_paid_at && (
                            <span className="text-xs text-on-surface-variant block">
                              le {new Date(r.solde_paid_at).toLocaleDateString('fr-FR')}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs px-2 py-0.5 font-label-caps tracking-wider text-amber-700 bg-amber-50">
                          En attente
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {!r.solde_paid_at && (
                          <button
                            type="button"
                            onClick={() => setSelected(r)}
                            className="text-xs px-3 py-1.5 border border-primary text-primary font-label-caps tracking-wider hover:bg-primary hover:text-on-primary transition-colors whitespace-nowrap"
                          >
                            Encaisser
                          </button>
                        )}
                        {r.facture_finale_signed_url && (
                          <a
                            href={r.facture_finale_signed_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-on-surface-variant hover:text-primary transition-colors whitespace-nowrap"
                            title="Télécharger la facture finale"
                          >
                            Facture ↓
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <EncaissementModal
        reservation={selected}
        onClose={() => setSelected(null)}
        onSuccess={handleSuccess}
      />
    </>
  )
}
