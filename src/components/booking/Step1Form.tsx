'use client'
import { useState } from 'react'

export interface ClientFormData {
  prenom: string; nom: string; email: string
  telephone: string; adresse: string
  client_type: 'particulier' | 'pro'
  raison_sociale?: string; siret?: string; instagram?: string
  rgpd_consent: boolean
}

const EMPTY: ClientFormData = {
  prenom: '', nom: '', email: '', telephone: '', adresse: '',
  client_type: 'particulier', raison_sociale: '', siret: '', instagram: '',
  rgpd_consent: false,
}

interface Props {
  initial: ClientFormData
  onNext: (data: ClientFormData) => void
}

function Field({
  id, label, type = 'text', placeholder = '', required = true, value, error, onChange, span2 = false,
}: {
  id: string; label: string; type?: string; placeholder?: string
  required?: boolean; value: string; error?: string
  onChange: (v: string) => void; span2?: boolean
}) {
  return (
    <div className={span2 ? 'col-span-2' : ''}>
      <label htmlFor={id} className="block text-[10px] uppercase tracking-[0.14em] text-on-surface-variant mb-1.5"
        style={{ fontFamily: 'var(--font-hanken)', fontWeight: 500 }}>
        {label}{required && <span className="text-primary ml-0.5">*</span>}
      </label>
      <input
        id={id} type={type} placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)}
        className={`w-full border px-4 py-3 text-sm text-on-surface bg-surface-container-lowest placeholder:text-on-surface-variant/40 focus:outline-none transition-colors ${
          error ? 'border-error focus:border-error' : 'border-outline-variant focus:border-primary'
        }`}
        style={{ fontFamily: 'var(--font-hanken)' }}
        autoComplete={type === 'email' ? 'email' : type === 'tel' ? 'tel' : 'on'}
      />
      {error && (
        <p className="mt-1 text-[10px] text-error tracking-wide" style={{ fontFamily: 'var(--font-hanken)' }}>
          {error}
        </p>
      )}
    </div>
  )
}

export default function Step1Form({ initial, onNext }: Props) {
  const [data, setData] = useState<ClientFormData>(initial.prenom ? initial : EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof ClientFormData, string>>>({})

  const set = <K extends keyof ClientFormData>(k: K, v: ClientFormData[K]) =>
    setData(prev => ({ ...prev, [k]: v }))

  const validate = (): boolean => {
    const e: typeof errors = {}
    if (!data.prenom.trim())    e.prenom    = 'Ce champ est requis'
    if (!data.nom.trim())       e.nom       = 'Ce champ est requis'
    if (!data.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Adresse email invalide'
    if (!data.telephone.trim()) e.telephone = 'Ce champ est requis'
    if (!data.adresse.trim())   e.adresse   = 'Ce champ est requis'
    if (data.client_type === 'pro') {
      if (!data.raison_sociale?.trim()) e.raison_sociale = 'Raison sociale requise'
      if (!data.siret?.match(/^\d{14}$/)) e.siret = '14 chiffres exactement'
    }
    if (!data.rgpd_consent) e.rgpd_consent = 'Votre consentement est requis'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  return (
    <form onSubmit={e => { e.preventDefault(); if (validate()) onNext(data) }} className="space-y-5">
      {/* Name row */}
      <div className="grid grid-cols-2 gap-4">
        <Field id="prenom" label="Prénom" value={data.prenom} error={errors.prenom} onChange={v => set('prenom', v)} />
        <Field id="nom" label="Nom" value={data.nom} error={errors.nom} onChange={v => set('nom', v)} />
      </div>

      <Field id="email" label="Email" type="email" value={data.email} error={errors.email} onChange={v => set('email', v)} />

      <div className="grid grid-cols-2 gap-4">
        <Field id="telephone" label="Téléphone" type="tel" value={data.telephone} error={errors.telephone} onChange={v => set('telephone', v)} />
        <Field id="adresse" label="Adresse" value={data.adresse} error={errors.adresse} onChange={v => set('adresse', v)} />
      </div>

      {/* Client type */}
      <div>
        <p className="text-[10px] uppercase tracking-[0.14em] text-on-surface-variant mb-2"
          style={{ fontFamily: 'var(--font-hanken)', fontWeight: 500 }}>
          Vous êtes<span className="text-primary ml-0.5">*</span>
        </p>
        <div className="grid grid-cols-2 gap-3">
          {(['particulier', 'pro'] as const).map(t => (
            <label key={t} className={`flex items-center gap-3 px-4 py-3 border cursor-pointer transition-colors select-none ${
              data.client_type === t
                ? 'border-primary bg-primary/5'
                : 'border-outline-variant hover:border-outline'
            }`}>
              <input type="radio" name="client_type" value={t} checked={data.client_type === t}
                onChange={() => set('client_type', t)} className="sr-only" />
              {/* custom radio */}
              <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                data.client_type === t ? 'border-primary' : 'border-outline-variant'
              }`}>
                {data.client_type === t && <span className="w-2 h-2 rounded-full bg-primary" />}
              </span>
              <span className="text-sm text-on-surface" style={{ fontFamily: 'var(--font-hanken)' }}>
                {t === 'particulier' ? 'Particulier' : 'Professionnel'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Pro fields */}
      {data.client_type === 'pro' && (
        <div className="grid grid-cols-2 gap-4 p-4 border border-outline-variant bg-surface-container-lowest">
          <Field id="raison_sociale" label="Raison sociale"
            value={data.raison_sociale ?? ''} error={errors.raison_sociale}
            onChange={v => set('raison_sociale', v)} span2 />
          <Field id="siret" label="N° SIRET" placeholder="12345678901234"
            value={data.siret ?? ''} error={errors.siret}
            onChange={v => set('siret', v)} />
          <Field id="instagram" label="Instagram" placeholder="@votre_compte" required={false}
            value={data.instagram ?? ''} error={errors.instagram}
            onChange={v => set('instagram', v)} />
        </div>
      )}

      {/* RGPD */}
      <div className={`p-4 border ${errors.rgpd_consent ? 'border-error bg-error/5' : 'border-outline-variant bg-surface-container-lowest'}`}>
        <label className="flex items-start gap-3 cursor-pointer">
          <button
            type="button"
            role="checkbox"
            aria-checked={data.rgpd_consent}
            onClick={() => set('rgpd_consent', !data.rgpd_consent)}
            className={`mt-0.5 w-4 h-4 shrink-0 border-2 flex items-center justify-center transition-colors ${
              data.rgpd_consent ? 'bg-primary border-primary' : 'border-outline-variant'
            }`}
          >
            {data.rgpd_consent && (
              <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
          <span className="text-xs text-on-surface-variant leading-relaxed" style={{ fontFamily: 'var(--font-hanken)' }}>
            J'accepte que mes données soient utilisées dans le cadre de ma formation et conservées 5 ans
            conformément aux obligations des organismes de formation (Art. L.6353-8 du Code du travail).<span className="text-primary ml-0.5">*</span>
          </span>
        </label>
        {errors.rgpd_consent && (
          <p className="mt-2 text-[10px] text-error tracking-wide ml-7" style={{ fontFamily: 'var(--font-hanken)' }}>
            {errors.rgpd_consent}
          </p>
        )}
      </div>

      <button
        type="submit"
        className="w-full bg-primary text-on-primary py-4 text-xs uppercase tracking-widest hover:opacity-90 active:opacity-80 transition-opacity min-h-[44px]"
        style={{ fontFamily: 'var(--font-hanken)', fontWeight: 500 }}
      >
        Voir mon contrat →
      </button>
    </form>
  )
}
