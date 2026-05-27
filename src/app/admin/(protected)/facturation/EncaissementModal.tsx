'use client'

import { useState, useEffect } from 'react'
import type { FacturationReservation } from './FacturationTable'

const PAYMENT_METHODS = [
  'Espèces',
  'Virement bancaire',
  'Chèque',
  'CB manuelle (SumUp / terminal)',
  'Wero / PayPal',
]

interface Props {
  reservation: FacturationReservation | null
  onClose: () => void
  onSuccess: () => void
}

type MethodState = Record<string, { selected: boolean; amount: string }>

export default function EncaissementModal({ reservation, onClose, onSuccess }: Props) {
  const [methods, setMethods] = useState<MethodState>({})
  const [stripeMode, setStripeMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [stripeUrl, setStripeUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Reset state when reservation changes
  useEffect(() => {
    setMethods({})
    setStripeMode(false)
    setLoading(false)
    setStripeUrl(null)
    setError(null)
    setSuccess(false)
  }, [reservation?.id])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  if (!reservation) return null

  const formation = reservation.sessions?.formations
  const prix = formation?.prix ?? 0
  const acompte = reservation.acompte_amount ?? 0
  const solde = Math.max(0, prix - acompte)
  const nomComplet = (`${reservation.prenom ?? ''} ${reservation.nom ?? ''}`.trim() || reservation.nom_client) ?? '—'
  const formationTitre = formation?.titre ?? 'Formation'

  // Calculate total entered by user
  const totalEntered = Object.values(methods)
    .filter(m => m.selected)
    .reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0)

  const totalValid = Math.abs(totalEntered - solde) <= 0.01

  function toggleMethod(label: string) {
    setMethods(prev => {
      const current = prev[label]
      if (current?.selected) {
        return { ...prev, [label]: { selected: false, amount: '' } }
      }
      // Pre-fill amount: remaining balance not yet assigned to other methods
      const alreadyAssigned = Object.entries(prev)
        .filter(([k, v]) => k !== label && v.selected)
        .reduce((sum, [, v]) => sum + (parseFloat(v.amount) || 0), 0)
      const remaining = Math.max(0, solde - alreadyAssigned)
      return { ...prev, [label]: { selected: true, amount: remaining.toString() } }
    })
    setStripeMode(false)
  }

  function setAmount(label: string, value: string) {
    setMethods(prev => ({ ...prev, [label]: { ...prev[label], amount: value } }))
  }

  async function handleManualSubmit() {
    setError(null)
    if (!totalValid) {
      setError(`Le total (${totalEntered.toLocaleString('fr-FR')} €) doit correspondre au solde (${solde.toLocaleString('fr-FR')} €).`)
      return
    }

    const selectedMethods = Object.entries(methods)
      .filter(([, v]) => v.selected)
      .map(([label, v]) => ({ label, amount: parseFloat(v.amount) }))

    if (selectedMethods.length === 0) {
      setError('Sélectionnez au moins un mode de paiement.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/reservations/${reservation!.id}/encaissement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ methods: selectedMethods }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erreur serveur')
      setSuccess(true)
      setTimeout(onSuccess, 1500)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleStripeSubmit() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/reservations/${reservation!.id}/encaissement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useStripe: true }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erreur serveur')
      setStripeUrl(json.stripeUrl)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/30 z-40"
      />

      {/* Panel */}
      <aside className="fixed top-0 right-0 h-full w-full max-w-lg bg-surface shadow-2xl z-50 flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-surface-container-highest bg-surface-container-lowest shrink-0">
          <div>
            <p className="text-xs font-label-caps tracking-widest text-on-surface-variant uppercase mb-1">Encaissement du solde</p>
            <h3 className="font-playfair text-xl text-on-surface">{nomComplet}</h3>
            <p className="text-sm text-on-surface-variant mt-1">{formationTitre}</p>
          </div>
          <button type="button" onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors p-1 mt-0.5">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 space-y-6">
          {/* Success state */}
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 text-green-700 text-sm font-medium">
              ✓ Solde encaissé — facture envoyée à {reservation.email_client}
            </div>
          )}

          {/* Stripe URL shown */}
          {stripeUrl && (
            <div className="p-4 bg-blue-50 border border-blue-200 space-y-3">
              <p className="text-xs font-label-caps tracking-wider text-blue-800 uppercase">Lien de paiement Stripe</p>
              <p className="text-xs text-blue-700 break-all">{stripeUrl}</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(stripeUrl)}
                  className="text-xs px-3 py-1.5 border border-blue-400 text-blue-700 font-label-caps tracking-wider hover:bg-blue-100 transition-colors"
                >
                  Copier le lien
                </button>
                <a
                  href={stripeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-3 py-1.5 bg-blue-600 text-white font-label-caps tracking-wider hover:bg-blue-700 transition-colors"
                >
                  Ouvrir Stripe
                </a>
              </div>
              <p className="text-xs text-blue-600">La facture sera générée automatiquement une fois le paiement reçu.</p>
            </div>
          )}

          {/* Solde recap */}
          <div className="p-4 bg-surface-container-lowest border border-surface-container-highest">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-label-caps tracking-wider text-on-surface-variant uppercase">Prix total formation</span>
              <span className="text-sm text-on-surface">{prix.toLocaleString('fr-FR')} €</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-label-caps tracking-wider text-on-surface-variant uppercase">Acompte versé</span>
              <span className="text-sm text-green-700">−{acompte.toLocaleString('fr-FR')} €</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-surface-container-highest">
              <span className="text-xs font-label-caps tracking-wider text-primary uppercase font-medium">Solde à encaisser</span>
              <span className="text-lg font-playfair text-primary">{solde.toLocaleString('fr-FR')} €</span>
            </div>
          </div>

          {/* Payment methods */}
          {!stripeUrl && !success && (
            <>
              <div>
                <p className="text-xs font-label-caps tracking-widest text-on-surface-variant uppercase mb-4">Mode(s) de règlement</p>
                <div className="space-y-3">
                  {PAYMENT_METHODS.map(label => {
                    const m = methods[label]
                    return (
                      <div key={label}>
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={m?.selected ?? false}
                            onChange={() => toggleMethod(label)}
                            className="w-4 h-4 border-surface-container-highest text-primary focus:ring-primary/20"
                          />
                          <span className="text-sm text-on-surface group-hover:text-primary transition-colors">{label}</span>
                        </label>
                        {m?.selected && (
                          <div className="mt-2 ml-7 flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={m.amount}
                              onChange={e => setAmount(label, e.target.value)}
                              className="w-32 border border-surface-container-highest bg-surface px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:border-primary"
                              placeholder="Montant"
                            />
                            <span className="text-sm text-on-surface-variant">€</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Stripe option — separate */}
              <div className="border-t border-surface-container-highest pt-4">
                <p className="text-xs font-label-caps tracking-widest text-on-surface-variant uppercase mb-3">Ou — paiement en ligne</p>
                <button
                  type="button"
                  onClick={() => setStripeMode(s => !s)}
                  className={`flex items-center gap-3 w-full text-left group ${stripeMode ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}
                >
                  <input
                    type="checkbox"
                    checked={stripeMode}
                    readOnly
                    className="w-4 h-4 border-surface-container-highest text-primary"
                  />
                  <span className="text-sm text-on-surface">CB en ligne Stripe (envoyer un lien de paiement à l&apos;élève)</span>
                </button>
                {stripeMode && (
                  <p className="text-xs text-on-surface-variant mt-2 ml-7">
                    Montant : <strong>{solde.toLocaleString('fr-FR')} €</strong>. Un lien Stripe sera généré — la facture sera envoyée automatiquement quand l&apos;élève paie.
                  </p>
                )}
              </div>

              {/* Total indicator */}
              {!stripeMode && Object.values(methods).some(m => m.selected) && (
                <div className={`flex justify-between items-center text-sm p-3 ${totalValid ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                  <span>Total saisi</span>
                  <span className="font-medium">{totalEntered.toLocaleString('fr-FR')} € / {solde.toLocaleString('fr-FR')} €</span>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Submit */}
              <div className="flex flex-col gap-3 pt-2">
                {!stripeMode && (
                  <button
                    type="button"
                    onClick={handleManualSubmit}
                    disabled={loading}
                    className="w-full bg-primary text-on-primary px-6 py-3 font-label-caps tracking-widest text-xs hover:bg-primary-container hover:text-on-primary-container transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Génération de la facture…' : 'Valider l\'encaissement + envoyer la facture'}
                  </button>
                )}
                {stripeMode && (
                  <button
                    type="button"
                    onClick={handleStripeSubmit}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white px-6 py-3 font-label-caps tracking-widest text-xs hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Création du lien…' : 'Envoyer le lien de paiement Stripe'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full px-6 py-3 font-label-caps tracking-widest text-xs text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  Annuler
                </button>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  )
}
