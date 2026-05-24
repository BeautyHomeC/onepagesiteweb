'use client'
import { useState } from 'react'
import Step1Form, { type ClientFormData } from '@/components/booking/Step1Form'
import Step2Contract from '@/components/booking/Step2Contract'
import Step3Signature, { type SignatureData } from '@/components/booking/Step3Signature'

const STEPS = ['Informations', 'Contrat', 'Signature', 'Paiement']

export default function SessionBooking({ formation, sessions }: { formation: any; sessions: any[] }) {
  const [step, setStep]             = useState<1 | 2 | 3 | 4>(1)
  const [selectedSessionId, setSel] = useState<string | null>(null)
  const [formData, setFormData]     = useState<ClientFormData>({} as ClientFormData)
  const [contractHtml, setHtml]     = useState('')
  const [templateVersion, setTv]    = useState(0)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)

  const acompte = Math.round(formation.prix * 0.3)
  const solde   = formation.prix - acompte

  const openFlow = (sessionId: string) => {
    setSel(sessionId); setStep(1); setError(null)
    setFormData({} as ClientFormData); setHtml('')
  }
  const closeFlow = () => { setSel(null); setStep(1) }

  const onStep1Next = async (data: ClientFormData) => {
    setFormData(data); setLoading(true); setError(null)
    try {
      const res = await fetch('/api/contract/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formation_id: formation.id, session_id: selectedSessionId,
          client_type: data.client_type,
          prenom: data.prenom, nom: data.nom, adresse: data.adresse,
          email: data.email, telephone: data.telephone,
          raison_sociale: data.raison_sociale, siret: data.siret, instagram: data.instagram,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Erreur lors du chargement du contrat.'); return }
      setHtml(json.html); setTv(json.template_version); setStep(2)
    } catch { setError('Erreur réseau. Vérifiez votre connexion et réessayez.') }
    finally { setLoading(false) }
  }

  const onStep3Confirm = async (sig: SignatureData) => {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/contract/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formation_id: formation.id, session_id: selectedSessionId,
          client_type: formData.client_type, template_version: templateVersion,
          prenom: formData.prenom, nom: formData.nom, adresse: formData.adresse,
          email: formData.email, telephone: formData.telephone,
          raison_sociale: formData.raison_sociale, siret: formData.siret,
          instagram: formData.instagram, signature_data: sig, rgpd_consent: formData.rgpd_consent,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Erreur lors de la signature.'); setStep(3); return }

      setStep(4)
      const checkoutRes = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: selectedSessionId, reservation_id: json.reservation_id }),
      })
      const checkout = await checkoutRes.json()
      if (checkout.url) { window.location.href = checkout.url }
      else { setError(checkout.error ?? 'Impossible de rediriger vers le paiement.'); setStep(3) }
    } catch { setError('Erreur réseau. Vérifiez votre connexion et réessayez.'); setStep(3) }
    finally { setLoading(false) }
  }

  return (
    <>
      {/* ── Sessions list ──────────────────────────────────────── */}
      <div className="bg-surface border border-outline-variant" style={{ boxShadow: '0 8px 40px rgba(181,149,98,0.07)' }}>
        <div className="px-8 py-7 border-b border-outline-variant">
          <h3 className="font-headline-sm text-on-surface mb-1" style={{ fontFamily: 'var(--font-playfair)', fontSize: '20px', fontWeight: 400 }}>
            Prochaines sessions
          </h3>
          <p className="text-on-surface-variant text-sm">Sélectionnez une date pour réserver votre place.</p>
        </div>

        <div className="divide-y divide-outline-variant">
          {sessions.length > 0 ? sessions.map(s => {
            const debut = new Date(s.date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
            const fin   = new Date(s.date_fin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
            const sameDay = debut === fin
            return (
              <div key={s.id} className="px-8 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5 hover:bg-surface-container-lowest transition-colors">
                <div className="space-y-1">
                  <p className="text-on-surface font-medium text-sm" style={{ fontFamily: 'var(--font-hanken)' }}>
                    {sameDay ? `Le ${debut}` : `Du ${debut} au ${fin}`}
                  </p>
                  <p className="text-xs uppercase tracking-widest" style={{ color: '#755a2d', fontFamily: 'var(--font-hanken)' }}>
                    {s.places_disponibles} place{s.places_disponibles > 1 ? 's' : ''} restante{s.places_disponibles > 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={() => openFlow(s.id)}
                  className="shrink-0 border border-primary text-primary px-6 py-3 text-xs uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-colors whitespace-nowrap min-h-[44px]"
                  style={{ fontFamily: 'var(--font-hanken)', fontWeight: 500 }}
                >
                  Réserver — acompte {acompte} €
                </button>
              </div>
            )
          }) : (
            <div className="px-8 py-10 text-center">
              <p className="text-on-surface-variant text-sm italic">Aucune session disponible pour le moment.</p>
              <p className="text-on-surface-variant text-xs mt-2 tracking-wide">Contactez-nous pour être informée des prochaines dates.</p>
            </div>
          )}
        </div>

        <div className="px-8 py-5 border-t border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-sm text-on-surface-variant" style={{ fontFamily: 'var(--font-hanken)' }}>
            Le solde de <strong className="text-on-surface">{solde} €</strong> est réglé le dernier jour de la formation.
          </p>
          {formation.programme_pdf_url && (
            <a href={formation.programme_pdf_url} target="_blank" rel="noopener noreferrer" download
              className="inline-flex items-center gap-2 text-primary hover:opacity-70 transition-opacity text-xs uppercase tracking-widest whitespace-nowrap"
              style={{ fontFamily: 'var(--font-hanken)', fontWeight: 500 }}>
              Télécharger le programme (PDF)
            </a>
          )}
        </div>
      </div>

      {/* ── 4-step booking modal ───────────────────────────────── */}
      {selectedSessionId && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-backdrop-in"
          style={{ background: 'rgba(27,28,28,0.55)', backdropFilter: 'blur(2px)' }}
          onClick={step < 4 ? closeFlow : undefined}
        >
          <div
            className="animate-modal-in bg-surface w-full sm:max-w-xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto flex flex-col"
            style={{ boxShadow: '0 32px 80px rgba(27,28,28,0.3)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header — relative so close button stays inside */}
            <div className="relative bg-primary text-on-primary px-7 py-6 shrink-0">
              {/* Close button — lives inside the header */}
              {step < 4 && (
                <button
                  onClick={closeFlow}
                  aria-label="Fermer"
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-on-primary/50 hover:text-on-primary transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              )}

              {/* Step progress */}
              <div className="flex items-center gap-1.5 mb-5 pr-8">
                {STEPS.map((label, i) => {
                  const n = i + 1
                  const done = step > n
                  const active = step === n
                  return (
                    <div key={label} className="flex items-center gap-1.5">
                      <div className={`flex items-center justify-center w-5 h-5 text-[9px] transition-all ${
                        done
                          ? 'bg-on-primary/25 text-on-primary'
                          : active
                          ? 'bg-on-primary text-primary'
                          : 'bg-on-primary/10 text-on-primary/40'
                      }`} style={{ fontFamily: 'var(--font-hanken)', fontWeight: 600 }}>
                        {done ? '✓' : n}
                      </div>
                      <span className={`text-[9px] uppercase tracking-widest hidden sm:block transition-opacity ${
                        active ? 'opacity-100' : done ? 'opacity-50' : 'opacity-25'
                      }`} style={{ fontFamily: 'var(--font-hanken)' }}>{label}</span>
                      {i < STEPS.length - 1 && (
                        <div className={`w-4 sm:w-6 h-px transition-colors ${done ? 'bg-on-primary/35' : 'bg-on-primary/12'}`} />
                      )}
                    </div>
                  )
                })}
              </div>

              <h2 className="text-xl font-normal mb-1 leading-snug" style={{ fontFamily: 'var(--font-playfair)' }}>
                {formation.titre}
              </h2>
              <p className="text-sm opacity-70" style={{ fontFamily: 'var(--font-hanken)', fontWeight: 300 }}>
                Acompte {acompte} € · Solde {solde} €
              </p>
            </div>

            {/* Step content */}
            <div className="px-7 py-6 flex-1">
              {/* Loading overlay (step 1 fetch) */}
              {loading && step === 1 && (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <p className="text-sm text-on-surface-variant" style={{ fontFamily: 'var(--font-hanken)' }}>
                    Chargement du contrat…
                  </p>
                </div>
              )}

              {!loading && step === 1 && (
                <Step1Form initial={formData} onNext={onStep1Next} />
              )}
              {step === 2 && (
                <Step2Contract html={contractHtml} onSign={() => setStep(3)} onBack={() => setStep(1)} />
              )}
              {step === 3 && (
                <Step3Signature
                  defaultName={`${formData.prenom} ${formData.nom}`}
                  loading={loading} error={error}
                  onConfirm={onStep3Confirm} onBack={() => setStep(2)}
                />
              )}
              {step === 4 && (
                <div className="flex flex-col items-center justify-center py-16 gap-5">
                  <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <div className="text-center space-y-1">
                    <p className="text-on-surface font-medium text-sm" style={{ fontFamily: 'var(--font-hanken)' }}>
                      Redirection vers le paiement sécurisé…
                    </p>
                    <p className="text-xs text-on-surface-variant">Vous allez être redirigée dans quelques instants.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
