'use client'

import { useEffect, useState, useTransition } from 'react'

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

interface Props {
  reservation: Reservation | null
  onClose: () => void
}

const STATUT_LABEL: Record<string, { label: string; color: string }> = {
  en_attente_paiement: { label: 'En attente de paiement', color: 'text-amber-700 bg-amber-50 border-amber-200' },
  confirmee:           { label: 'Confirmée',              color: 'text-green-700 bg-green-50 border-green-200' },
  annulee:             { label: 'Annulée',                color: 'text-red-700 bg-red-50 border-red-200' },
}

export default function ReservationSlideIn({ reservation, onClose }: Props) {
  const [cancelPending, startCancel] = useTransition()
  const [cancelResult, setCancelResult] = useState<{ notified?: number; error?: string } | null>(null)

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Reset cancel result when reservation changes
  useEffect(() => { setCancelResult(null) }, [reservation?.id])

  const handleCancel = () => {
    if (!reservation) return
    if (!confirm("Annuler cette réservation et notifier la liste d'attente ?")) return
    startCancel(async () => {
      const res = await fetch(`/api/admin/reservations/${reservation.id}/cancel`, { method: 'POST' })
      const json = await res.json()
      if (res.ok) {
        setCancelResult({ notified: json.notified })
        // Reload page to update statut
        setTimeout(() => { window.location.reload() }, 1500)
      } else {
        setCancelResult({ error: json.error ?? 'Erreur' })
      }
    })
  }

  const nomComplet = reservation
    ? ((`${reservation.prenom ?? ''} ${reservation.nom ?? ''}`.trim() || reservation.nom_client) ?? '—')
    : ''

  const dateDebut = reservation?.sessions?.date_debut
    ? new Date(reservation.sessions.date_debut).toLocaleDateString('fr-FR')
    : '—'
  const dateFin = reservation?.sessions?.date_fin
    ? new Date(reservation.sessions.date_fin).toLocaleDateString('fr-FR')
    : '—'
  const dateSession = dateDebut === dateFin ? `le ${dateDebut}` : `du ${dateDebut} au ${dateFin}`

  const formation = reservation?.sessions?.formations
  const acompte = reservation?.acompte_amount ?? 0
  const solde = formation ? Math.max(0, formation.prix - acompte) : 0

  const statutInfo = reservation ? (STATUT_LABEL[reservation.statut] ?? { label: reservation.statut, color: 'text-on-surface-variant bg-surface-container' }) : null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-200 ${reservation ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Panel */}
      <aside
        className={`fixed top-0 right-0 h-full w-full max-w-lg bg-surface shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-out ${
          reservation ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-surface-container-highest bg-surface-container-lowest">
          <div>
            <p className="text-xs font-label-caps tracking-widest text-on-surface-variant uppercase mb-1">Réservation</p>
            <h3 className="font-playfair text-xl text-on-surface">{nomComplet || '—'}</h3>
            {statutInfo && (
              <span className={`inline-block mt-2 text-xs px-2 py-0.5 border font-label-caps tracking-wider ${statutInfo.color}`}>
                {statutInfo.label}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface transition-colors p-1 mt-0.5"
            aria-label="Fermer"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {reservation && (
            <>
              {/* Formation */}
              <section>
                <SectionTitle>Formation</SectionTitle>
                <Row label="Formation" value={formation?.titre} />
                <Row label="Date" value={dateSession} />
                <Row label="Prix total" value={formation ? `${formation.prix} €` : undefined} />
              </section>

              {/* Paiement */}
              <section>
                <SectionTitle>Paiement</SectionTitle>
                <Row label="Acompte réglé" value={acompte ? `${acompte} €` : undefined} />
                <Row label="Solde restant" value={`${solde} €`} />
                {reservation.acompte_paid_at && (
                  <Row label="Payé le" value={new Date(reservation.acompte_paid_at).toLocaleDateString('fr-FR')} />
                )}
              </section>

              {/* Client */}
              <section>
                <SectionTitle>
                  {reservation.client_type === 'pro' ? 'Professionnel' : 'Particulier'}
                </SectionTitle>
                <Row label="Nom" value={nomComplet} />
                <Row label="Email" value={reservation.email_client ?? undefined} />
                <Row label="Téléphone" value={reservation.telephone ?? reservation.telephone_client ?? undefined} />
                <Row label="Adresse" value={reservation.adresse ?? undefined} />
                {reservation.client_type === 'pro' && (
                  <>
                    <Row label="Raison sociale" value={reservation.raison_sociale ?? undefined} />
                    <Row label="SIRET" value={reservation.siret ?? undefined} />
                    <Row label="Instagram" value={reservation.instagram ?? undefined} />
                  </>
                )}
              </section>

              {/* Inscription */}
              <section>
                <SectionTitle>Inscription</SectionTitle>
                <Row label="Créée le" value={new Date(reservation.created_at).toLocaleString('fr-FR')} />
                <Row label="ID" value={reservation.id} mono />
              </section>

              {/* Actions */}
              <section className="pt-2 flex flex-col gap-3">
                <a
                  href={`/api/admin/reservations/${reservation.id}/dossier`}
                  download
                  className="inline-flex items-center justify-center gap-2 border border-surface-container-highest px-4 py-2.5 text-xs font-label-caps tracking-wider hover:text-primary hover:border-primary transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  TÉLÉCHARGER LE DOSSIER (ZIP)
                </a>

                {reservation.statut !== 'annulee' && (
                  <div>
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={cancelPending}
                      className="w-full inline-flex items-center justify-center gap-2 border border-error/40 text-error/70 px-4 py-2.5 text-xs font-label-caps tracking-wider hover:border-error hover:text-error disabled:opacity-40 transition-colors"
                    >
                      {cancelPending ? '…' : 'ANNULER LA RÉSERVATION'}
                    </button>
                    {cancelResult && (
                      <p className={`text-xs mt-2 text-center ${cancelResult.error ? 'text-error' : 'text-green-700'}`}>
                        {cancelResult.error
                          ? cancelResult.error
                          : `Réservation annulée. ${cancelResult.notified} personne${(cancelResult.notified ?? 0) > 1 ? 's' : ''} notifiée${(cancelResult.notified ?? 0) > 1 ? 's' : ''}.`
                        }
                      </p>
                    )}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </aside>
    </>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-label-caps tracking-widest text-primary uppercase mb-3">
      {children}
    </p>
  )
}

function Row({ label, value, mono = false }: { label: string; value?: string; mono?: boolean }) {
  if (!value) return null
  return (
    <div className="flex gap-3 text-sm mb-2">
      <span className="w-32 shrink-0 text-on-surface-variant">{label}</span>
      <span className={`text-on-surface break-all ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  )
}
