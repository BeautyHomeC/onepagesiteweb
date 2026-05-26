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
  onCancel?: () => void
}

function Field({
  id, label, type = 'text', placeholder = '', required = true, value, error, onChange, span2 = false,
}: {
  id: string; label: string; type?: string; placeholder?: string
  required?: boolean; value: string; error?: string
  onChange: (v: string) => void; span2?: boolean
}) {
  return (
    <div className={`flex flex-col gap-1.5 group ${span2 ? 'col-span-2' : ''}`}>
      <label
        htmlFor={id}
        className="font-label-caps text-[11px] tracking-widest text-outline/70 group-focus-within:text-primary transition-colors uppercase"
        style={{ fontFamily: 'var(--font-hanken)' }}
      >
        {label}{required && <span className="text-primary ml-0.5">*</span>}
      </label>
      <input
        id={id} type={type} placeholder={placeholder} value={value}
        onChange={e => onChange(e.target.value)}
        className={`bg-transparent border-b py-3 text-on-surface text-[15px] transition-all placeholder:text-outline-variant/40 outline-none ${
          error ? 'border-error' : 'border-outline-variant/40 focus:border-primary'
        }`}
        style={{ fontFamily: 'var(--font-hanken)', fontWeight: 300 }}
        autoComplete={type === 'email' ? 'email' : type === 'tel' ? 'tel' : 'on'}
      />
      {error && (
        <p className="mt-0.5 text-[10px] text-error tracking-wide" style={{ fontFamily: 'var(--font-hanken)' }}>
          {error}
        </p>
      )}
    </div>
  )
}

export default function Step1Form({ initial, onNext, onCancel }: Props) {
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
    <form onSubmit={e => { e.preventDefault(); if (validate()) onNext(data) }} className="space-y-0">

      {/* ── Title block ─────────────────────────────── */}
      <div className="text-center mb-12 max-w-lg mx-auto">
        <h2
          className="text-[32px] md:text-[36px] text-primary mb-3 italic leading-tight"
          style={{ fontFamily: 'var(--font-playfair)', fontWeight: 400 }}
        >
          Informations Personnelles
        </h2>
        <p className="text-sm text-on-surface-variant/80" style={{ fontFamily: 'var(--font-hanken)', fontWeight: 300 }}>
          Ces informations figureront sur votre contrat de formation.
        </p>
      </div>

      {/* ── Fields grid ─────────────────────────────── */}
      <div className="space-y-10">

        {/* Name row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-gutter gap-y-10">
          <Field id="prenom" label="Prénom" value={data.prenom} error={errors.prenom} onChange={v => set('prenom', v)} />
          <Field id="nom" label="Nom" value={data.nom} error={errors.nom} onChange={v => set('nom', v)} />
          <Field id="email" label="Email" type="email" value={data.email} error={errors.email} onChange={v => set('email', v)} />
          <Field id="telephone" label="Téléphone" type="tel" value={data.telephone} error={errors.telephone} onChange={v => set('telephone', v)} />
        </div>

        {/* Address — full width */}
        <Field id="adresse" label="Adresse" placeholder="Numéro, rue, code postal et ville"
          value={data.adresse} error={errors.adresse} onChange={v => set('adresse', v)} />

        {/* Client type */}
        <div className="space-y-3">
          <p className="font-label-caps text-[11px] tracking-widest text-outline/70 uppercase" style={{ fontFamily: 'var(--font-hanken)' }}>
            Vous êtes<span className="text-primary ml-0.5">*</span>
          </p>
          <div className="relative">
            <select
              value={data.client_type}
              onChange={e => set('client_type', e.target.value as 'particulier' | 'pro')}
              className="w-full bg-transparent border-b border-outline-variant/40 focus:border-primary outline-none py-3 text-on-surface text-[15px] appearance-none transition-all"
              style={{ fontFamily: 'var(--font-hanken)', fontWeight: 300 }}
            >
              <option value="particulier">Particulier</option>
              <option value="pro">Professionnel</option>
            </select>
            <span
              className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-outline/40 text-[20px]"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}
            >
              expand_more
            </span>
          </div>
        </div>

        {/* Pro fields */}
        {data.client_type === 'pro' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-gutter gap-y-10 pt-4 border-t border-outline-variant/20">
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
        <div className="flex items-start gap-4 pt-4">
          <div className="relative flex items-start pt-0.5">
            <button
              type="button"
              role="checkbox"
              aria-checked={data.rgpd_consent}
              onClick={() => set('rgpd_consent', !data.rgpd_consent)}
              className={`w-[18px] h-[18px] shrink-0 border flex items-center justify-center transition-all ${
                errors.rgpd_consent
                  ? 'border-error bg-error/5'
                  : data.rgpd_consent
                  ? 'bg-primary border-primary'
                  : 'border-outline-variant'
              }`}
            >
              {data.rgpd_consent && (
                <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                  <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>
          <div>
            <label
              onClick={() => set('rgpd_consent', !data.rgpd_consent)}
              className="text-[13px] text-on-surface-variant/80 leading-[1.8] cursor-pointer select-none"
              style={{ fontFamily: 'var(--font-hanken)', fontWeight: 300 }}
            >
              J'accepte que mes données soient utilisées dans le cadre de ma formation et conservées 5 ans
              conformément aux obligations des organismes de formation (Art. L.6353-8 du Code du travail).<span className="text-primary ml-0.5">*</span>
            </label>
            {errors.rgpd_consent && (
              <p className="mt-1 text-[10px] text-error tracking-wide" style={{ fontFamily: 'var(--font-hanken)' }}>
                {errors.rgpd_consent}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Footer actions ──────────────────────────── */}
      <div className="-mx-6 md:-mx-12 -mb-10 md:-mb-16 mt-14 px-6 md:px-12 py-8 md:py-10 bg-surface-container-low/40 flex flex-col md:flex-row justify-between items-center gap-6 border-t border-outline-variant/10">
        <button
          type="button"
          onClick={onCancel}
          className="group font-label-caps text-[10px] tracking-[0.2em] text-outline/60 hover:text-primary transition-all flex items-center gap-3 uppercase"
          style={{ fontFamily: 'var(--font-hanken)' }}
        >
          <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-1 transition-transform"
            style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>
            west
          </span>
          Annuler
        </button>
        <button
          type="submit"
          className="w-full md:w-auto px-12 py-5 bg-primary text-on-primary font-label-caps text-[11px] tracking-[0.25em] uppercase hover:bg-[#5b4317] hover:shadow-[0_20px_40px_-12px_rgba(117,90,45,0.3)] transition-all duration-500 flex items-center justify-center gap-4 group"
          style={{ fontFamily: 'var(--font-hanken)', fontWeight: 500 }}
        >
          Continuer
          <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform"
            style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>
            east
          </span>
        </button>
      </div>
    </form>
  )
}
