'use client'
import { useState } from 'react'
import Step1Form, { type ClientFormData } from '@/components/booking/Step1Form'
import Step2Contract from '@/components/booking/Step2Contract'
import Step3Signature, { type SignatureData } from '@/components/booking/Step3Signature'
import WaitlistModal from '@/components/WaitlistModal'

const STEPS = ['Informations', 'Contrat', 'Signature', 'Paiement']

// ── Main component ────────────────────────────────────────────
export default function SessionBooking({ formation, sessions }: { formation: any; sessions: any[] }) {
  const [step, setStep]             = useState<1 | 2 | 3 | 4>(1)
  const [selectedSessionId, setSel] = useState<string | null>(null)
  const [waitlistSessionId, setWaitlist] = useState<string | null>(null)
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
      <div className="bg-surface-container-low">

        {/* Header */}
        <div className="pb-6 border-b border-outline-variant/40">
          <p className="font-label-caps text-[10px] text-on-surface-variant uppercase tracking-[0.25em] mb-3"
             style={{ fontFamily: 'var(--font-hanken)' }}>
            PROCHAINES SESSIONS
          </p>
          <p className="text-sm text-on-surface-variant" style={{ fontFamily: 'var(--font-hanken)', fontWeight: 300 }}>
            Sélectionnez une date pour réserver votre place.
          </p>
        </div>

        {/* Session rows */}
        <div>
          {sessions.length > 0 ? sessions.map(s => {
            const debut   = new Date(s.date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
            const fin     = new Date(s.date_fin).toLocaleDateString('fr-FR',   { day: 'numeric', month: 'long', year: 'numeric' })
            const sameDay = debut === fin
            const isFull  = s.places_disponibles <= 0

            return (
              <div
                key={s.id}
                className="py-6 border-b border-outline-variant/40 flex flex-col sm:flex-row sm:items-center justify-between gap-5"
              >
                <div className="space-y-1.5">
                  <p
                    className="text-on-surface text-sm"
                    style={{ fontFamily: 'var(--font-hanken)', fontWeight: 500 }}
                  >
                    {sameDay ? `Le ${debut}` : `Du ${debut} au ${fin}`}
                  </p>
                  {isFull ? (
                    <p
                      className="font-label-caps text-[9px] uppercase tracking-[0.2em] text-on-surface-variant/50"
                      style={{ fontFamily: 'var(--font-hanken)' }}
                    >
                      Session complète
                    </p>
                  ) : (
                    <p
                      className="font-label-caps text-[9px] uppercase tracking-[0.2em] text-primary"
                      style={{ fontFamily: 'var(--font-hanken)' }}
                    >
                      {s.places_disponibles} place{s.places_disponibles > 1 ? 's' : ''} disponible{s.places_disponibles > 1 ? 's' : ''}
                    </p>
                  )}
                </div>

                {isFull ? (
                  <button
                    onClick={() => setWaitlist(s.id)}
                    className="shrink-0 border border-outline-variant text-on-surface-variant px-6 py-3 text-[10px] uppercase tracking-widest hover:border-on-surface hover:text-on-surface transition-colors whitespace-nowrap min-h-[44px]"
                    style={{ fontFamily: 'var(--font-hanken)', fontWeight: 500 }}
                  >
                    Liste d'attente
                  </button>
                ) : (
                  <button
                    onClick={() => openFlow(s.id)}
                    className="shrink-0 border border-primary text-primary px-6 py-4 text-[10px] uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-colors whitespace-nowrap min-h-[44px] flex items-center gap-2"
                    style={{ fontFamily: 'var(--font-hanken)', fontWeight: 500 }}
                  >
                    S'inscrire et payer
                    <span className="material-symbols-outlined text-[16px]"
                          style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>
                      arrow_forward
                    </span>
                  </button>
                )}
              </div>
            )
          }) : (
            <div className="py-10 text-center">
              <p className="text-on-surface-variant text-sm italic" style={{ fontFamily: 'var(--font-hanken)', fontWeight: 300 }}>
                Aucune session disponible pour le moment.
              </p>
              <p className="text-on-surface-variant text-xs mt-2 tracking-wide" style={{ fontFamily: 'var(--font-hanken)' }}>
                Contactez-nous pour être informée des prochaines dates.
              </p>
            </div>
          )}
        </div>

        {/* Pricing summary + programme download */}
        <div className="pt-6 space-y-4">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <p className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-[0.2em]"
                 style={{ fontFamily: 'var(--font-hanken)' }}>
                ACOMPTE
              </p>
              <p className="font-playfair text-2xl text-on-surface">{acompte} €</p>
            </div>
            <div className="text-right space-y-1">
              <p className="font-label-caps text-[9px] text-on-surface-variant uppercase tracking-[0.2em]"
                 style={{ fontFamily: 'var(--font-hanken)' }}>
                SOLDE (dernier jour)
              </p>
              <p className="font-playfair text-2xl text-on-surface-variant">{solde} €</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-on-surface-variant/50 pt-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>
            <span className="font-label-caps text-[9px] uppercase tracking-[0.2em]"
                  style={{ fontFamily: 'var(--font-hanken)' }}>
              Paiement 100% sécurisé · Stripe
            </span>
          </div>

          {formation.programme_pdf_url && (
            <a
              href={formation.programme_pdf_url}
              target="_blank" rel="noopener noreferrer" download
              className="inline-flex items-center gap-2 text-primary hover:opacity-70 transition-opacity text-[10px] uppercase tracking-widest"
              style={{ fontFamily: 'var(--font-hanken)', fontWeight: 500 }}
            >
              <span className="material-symbols-outlined text-[14px]"
                    style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>
                download
              </span>
              Télécharger le programme (PDF)
            </a>
          )}
        </div>
      </div>

      {/* ── Waitlist modal ─────────────────────────────────────── */}
      {waitlistSessionId && (
        <WaitlistModal
          sessionId={waitlistSessionId}
          onClose={() => setWaitlist(null)}
        />
      )}

      {/* ── 4-step booking modal ───────────────────────────────── */}
      {selectedSessionId && (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center overflow-y-auto py-6 px-4 animate-backdrop-in"
          style={{ background: 'transparent' }}
          onClick={step < 4 ? closeFlow : undefined}
        >
          {/* Backdrop */}
          <div className="fixed inset-0 bg-surface-container-lowest/80 backdrop-blur-md z-0" />

          {/* Modal Card Container */}
          <section
            className="w-full max-w-[800px] bg-surface-container-lowest shadow-[0_32px_64px_rgba(27,28,28,0.18)] overflow-hidden relative z-10 animate-modal-in border border-outline-variant/20 flex flex-col shrink-0"
            onClick={e => e.stopPropagation()}
          >
            {/* Close Button */}
            {step < 4 && (
              <button
                onClick={closeFlow}
                className="absolute top-8 right-8 text-outline hover:text-primary transition-all duration-300 z-50 flex items-center justify-center w-8 h-8 rounded-full hover:bg-surface-container-low"
              >
                <span className="material-symbols-outlined !text-[20px] font-light" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>close</span>
              </button>
            )}

            {/* Progress Header */}
            <div className="px-6 md:px-10 py-5 md:py-7 border-b border-surface-container shrink-0">
              <div className="flex justify-between items-center max-w-md mx-auto relative">
                {/* Progress Line */}
                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-outline-variant -translate-y-1/2 z-0"></div>
                <div
                  className="absolute top-1/2 left-0 h-[1px] bg-primary -translate-y-1/2 z-0 transition-all duration-700"
                  style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
                ></div>

                {STEPS.map((label, i) => {
                  const n = i + 1
                  const done = step > n
                  const active = step === n

                  if (done) {
                    return (
                      <div key={label} className="relative z-10 flex flex-col items-center gap-2">
                        <div className="w-7 h-7 bg-primary text-on-primary flex items-center justify-center">
                          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 600, 'GRAD' 0, 'opsz' 20" }}>check</span>
                        </div>
                        <span className="font-label-caps text-[9px] md:text-[10px] text-on-surface-variant tracking-widest">{label}</span>
                      </div>
                    )
                  } else if (active) {
                    return (
                      <div key={label} className="relative z-10 flex flex-col items-center gap-2">
                        <div className="w-7 h-7 bg-surface-container-lowest border-2 border-primary text-primary flex items-center justify-center text-xs font-medium" style={{ fontFamily: 'var(--font-hanken)' }}>
                          {n}
                        </div>
                        <span className="font-label-caps text-[9px] md:text-[10px] text-primary tracking-widest">{label}</span>
                      </div>
                    )
                  } else {
                    return (
                      <div key={label} className="relative z-10 flex flex-col items-center gap-2">
                        <div className="w-7 h-7 bg-surface-container-lowest border border-outline-variant/60 text-on-surface-variant/40 flex items-center justify-center text-xs" style={{ fontFamily: 'var(--font-hanken)' }}>
                          {n}
                        </div>
                        <span className="font-label-caps text-[9px] md:text-[10px] text-on-surface-variant/40 tracking-widest">{label}</span>
                      </div>
                    )
                  }
                })}
              </div>
            </div>

            {/* Modal Content - px-12 py-16 on desktop */}
            <div className="flex-1 overflow-y-auto px-6 md:px-12 py-10 md:py-16" style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#d1c5b6 transparent'
            }}>
              {/* Step Context Headers */}
              {step === 2 && !loading && (
                <header className="text-center mb-10 max-w-lg mx-auto">
                  <h1 className="font-headline-md text-headline-md text-on-surface mb-2" style={{ fontFamily: 'var(--font-playfair)' }}>Votre Contrat</h1>
                  <p className="font-body-md text-on-surface-variant text-sm font-light" style={{ fontFamily: 'var(--font-hanken)' }}>
                    Prenez le temps de lire votre convention de formation.
                  </p>
                </header>
              )}
              {step === 4 && (
                <header className="text-center mb-10 max-w-lg mx-auto">
                  <h1 className="font-headline-md text-headline-md text-on-surface mb-2" style={{ fontFamily: 'var(--font-playfair)' }}>Paiement Sécurisé</h1>
                  <p className="font-body-md text-on-surface-variant text-sm font-light" style={{ fontFamily: 'var(--font-hanken)' }}>
                    Finalisez votre inscription en réglant l'acompte de {acompte} €. Le solde de {solde} € sera à régler plus tard.
                  </p>
                </header>
              )}

              {loading && step === 1 && (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <p className="text-sm text-on-surface-variant" style={{ fontFamily: 'var(--font-hanken)' }}>
                    Chargement du contrat…
                  </p>
                </div>
              )}

              {!loading && step === 1 && (
                <Step1Form initial={formData} onNext={onStep1Next} onCancel={closeFlow} />
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
          </section>
        </div>
      )}
    </>
  )
}
