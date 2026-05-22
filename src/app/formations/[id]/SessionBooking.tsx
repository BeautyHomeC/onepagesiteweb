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
          formation_id: formation.id,
          session_id: selectedSessionId,
          client_type: data.client_type,
          prenom: data.prenom, nom: data.nom,
          adresse: data.adresse, email: data.email, telephone: data.telephone,
          raison_sociale: data.raison_sociale, siret: data.siret, instagram: data.instagram,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error); return }
      setHtml(json.html); setTv(json.template_version); setStep(2)
    } catch { setError('Erreur réseau — réessayez.') }
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
          raison_sociale: formData.raison_sociale, siret: formData.siret, instagram: formData.instagram,
          signature_data: sig, rgpd_consent: formData.rgpd_consent,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error); setStep(3); return }

      setStep(4)
      const checkoutRes = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: selectedSessionId, reservation_id: json.reservation_id }),
      })
      const checkout = await checkoutRes.json()
      if (checkout.url) { window.location.href = checkout.url }
      else { setError(checkout.error || 'Erreur Stripe'); setStep(3) }
    } catch { setError('Erreur réseau — réessayez.'); setStep(3) }
    finally { setLoading(false) }
  }

  return (
    <>
      {/* Sessions list */}
      <div className="bg-surface p-8 shadow-ambient border border-surface-container-highest">
        <h3 className="font-headline-sm text-headline-sm text-on-surface mb-2">Prochaines Sessions</h3>
        <p className="font-body-md text-on-surface-variant mb-6">Sélectionnez une date pour réserver votre place.</p>
        <div className="space-y-4">
          {sessions.length > 0 ? sessions.map(s => (
            <div key={s.id}
              className="border border-outline-variant p-4 flex flex-col xl:flex-row justify-between items-center gap-4 hover:border-primary transition-colors">
              <div>
                <p className="font-body-md text-on-surface font-medium">
                  Du {new Date(s.date_debut).toLocaleDateString('fr-FR')} au {new Date(s.date_fin).toLocaleDateString('fr-FR')}
                </p>
                <p className="font-label-caps text-label-caps text-primary mt-1 uppercase">
                  {s.places_disponibles} place(s) restante(s)
                </p>
              </div>
              <button onClick={() => openFlow(s.id)}
                className="border border-primary text-primary font-label-caps text-label-caps px-6 py-3 uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-colors whitespace-nowrap min-h-[44px]">
                Réserver — Acompte {acompte}€
              </button>
            </div>
          )) : (
            <p className="text-on-surface-variant font-body-md italic py-4">Aucune session disponible pour le moment.</p>
          )}
        </div>
        {formation.programme_pdf_url && (
          <a href={formation.programme_pdf_url} target="_blank" rel="noopener noreferrer" download
            className="mt-6 inline-flex items-center gap-2 text-primary hover:underline font-label-caps text-xs uppercase tracking-widest">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Télécharger le programme détaillé (PDF)
          </a>
        )}
        <div className="mt-6 pt-6 border-t border-surface-container-highest text-sm text-on-surface-variant font-body-md">
          <p>Le solde de {solde}€ sera réglé le dernier jour de la formation (espèces, virement ou carte).</p>
        </div>
      </div>

      {/* 4-step modal */}
      {selectedSessionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={step < 4 ? closeFlow : undefined}>
          <div className="bg-surface max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-primary text-on-primary px-8 py-6">
              <p className="font-label-caps text-xs uppercase tracking-widest opacity-80 mb-1">
                Étape {step} / 4 — {STEPS[step - 1]}
              </p>
              <h2 className="font-headline-md text-2xl">{formation.titre}</h2>
              <p className="text-sm opacity-80 mt-1">Acompte : {acompte}€ · Solde : {solde}€</p>
            </div>

            <div className="px-8 py-6">
              {loading && step === 1 && (
                <p className="text-sm text-on-surface-variant text-center py-4">Chargement du contrat…</p>
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
                <div className="text-center py-12">
                  <p className="font-headline-sm text-on-surface mb-2">Redirection en cours…</p>
                  <p className="text-sm text-on-surface-variant">Vous allez être redirigé vers le paiement sécurisé.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
