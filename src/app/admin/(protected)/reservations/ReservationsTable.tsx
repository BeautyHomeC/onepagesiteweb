'use client'

import { useState, useCallback } from 'react'
import ReservationSlideIn from './ReservationSlideIn'

interface Reservation {
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
  instagram: string | null
  statut: string
  acompte_amount: number | null
  acompte_paid_at: string | null
  contrat_signe_url: string | null
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

const STATUT_BADGE: Record<string, string> = {
  en_attente_paiement: 'text-amber-700 bg-amber-50',
  confirmee:           'text-green-700 bg-green-50',
  annulee:             'text-red-700 bg-red-50',
}
const STATUT_LABEL: Record<string, string> = {
  en_attente_paiement: 'En attente',
  confirmee:           'Confirmée',
  annulee:             'Annulée',
}

const FILTER_OPTIONS = [
  { value: 'all',                label: 'Toutes' },
  { value: 'confirmee',          label: 'Confirmées' },
  { value: 'en_attente_paiement', label: 'En attente' },
  { value: 'annulee',            label: 'Annulées' },
]

interface Props {
  reservations: Reservation[]
}

export default function ReservationsTable({ reservations }: Props) {
  const [selected, setSelected] = useState<Reservation | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  const close = useCallback(() => setSelected(null), [])

  const filtered = reservations.filter((r) => {
    if (filter !== 'all' && r.statut !== filter) return false
    if (search) {
      const nomComplet = `${r.prenom ?? ''} ${r.nom ?? ''} ${r.nom_client ?? ''} ${r.email_client ?? ''}`.toLowerCase()
      if (!nomComplet.includes(search.toLowerCase())) return false
    }
    return true
  })

  return (
    <>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="search"
          placeholder="Rechercher par nom ou email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-surface-container-highest bg-surface px-4 py-2 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary"
        />
        <div className="flex gap-1 border border-surface-container-highest bg-surface p-1">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFilter(opt.value)}
              className={`px-3 py-1.5 text-xs font-label-caps tracking-wider transition-colors ${
                filter === opt.value
                  ? 'bg-primary text-on-primary'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <p className="text-on-surface-variant italic text-sm py-8 text-center">
          Aucune réservation trouvée.
        </p>
      ) : (
        <div className="overflow-x-auto border border-surface-container-highest">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-container-lowest border-b border-surface-container-highest">
              <tr className="text-xs font-label-caps tracking-wider text-on-surface-variant uppercase">
                <th className="px-4 py-3 font-normal">Client</th>
                <th className="px-4 py-3 font-normal">Formation</th>
                <th className="px-4 py-3 font-normal">Date session</th>
                <th className="px-4 py-3 font-normal">Acompte</th>
                <th className="px-4 py-3 font-normal">Statut</th>
                <th className="px-4 py-3 font-normal">Inscription</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low bg-surface">
              {filtered.map((r) => {
                const nomComplet = `${r.prenom ?? ''} ${r.nom ?? ''}`.trim() || r.nom_client || '—'
                const dateDebut = r.sessions?.date_debut
                  ? new Date(r.sessions.date_debut).toLocaleDateString('fr-FR')
                  : '—'
                const dateFin = r.sessions?.date_fin
                  ? new Date(r.sessions.date_fin).toLocaleDateString('fr-FR')
                  : '—'
                const dateStr = dateDebut === dateFin ? dateDebut : `${dateDebut} → ${dateFin}`
                const badge = STATUT_BADGE[r.statut] ?? 'text-on-surface-variant bg-surface-container'
                return (
                  <tr
                    key={r.id}
                    onClick={() => setSelected(r)}
                    className="cursor-pointer hover:bg-surface-container-low transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-on-surface block">{nomComplet}</span>
                      <span className="text-xs text-on-surface-variant">{r.email_client}</span>
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">
                      {r.sessions?.formations?.titre ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant whitespace-nowrap">
                      {dateStr}
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">
                      {r.acompte_amount != null ? `${r.acompte_amount} €` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 font-label-caps tracking-wider ${badge}`}>
                        {STATUT_LABEL[r.statut] ?? r.statut}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant text-xs">
                      {new Date(r.created_at).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <ReservationSlideIn reservation={selected} onClose={close} />
    </>
  )
}
