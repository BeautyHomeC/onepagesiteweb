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

export default function Step1Form({ initial, onNext }: Props) {
  const [data, setData] = useState<ClientFormData>(initial.prenom ? initial : EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof ClientFormData, string>>>({})

  const set = (k: keyof ClientFormData, v: string | boolean) =>
    setData(prev => ({ ...prev, [k]: v }))

  const validate = (): boolean => {
    const e: typeof errors = {}
    if (!data.prenom.trim())    e.prenom    = 'Requis'
    if (!data.nom.trim())       e.nom       = 'Requis'
    if (!data.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Email invalide'
    if (!data.telephone.trim()) e.telephone = 'Requis'
    if (!data.adresse.trim())   e.adresse   = 'Requis'
    if (data.client_type === 'pro') {
      if (!data.raison_sociale?.trim()) e.raison_sociale = 'Requis'
      if (!data.siret?.match(/^\d{14}$/)) e.siret = '14 chiffres requis'
    }
    if (!data.rgpd_consent) e.rgpd_consent = 'Requis'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const field = (
    id: keyof ClientFormData, label: string, type = 'text', placeholder = '', required = true
  ) => (
    <div key={id}>
      <label htmlFor={id} className="block font-label-caps text-xs uppercase tracking-widest text-on-surface-variant mb-1">
        {label}{required && ' *'}
      </label>
      <input
        id={id} type={type} placeholder={placeholder}
        value={(data[id] as string) ?? ''}
        onChange={e => set(id, e.target.value)}
        className={`w-full border px-4 py-3 font-body-md text-sm bg-surface focus:outline-none focus:border-primary transition-colors ${errors[id] ? 'border-error' : 'border-outline-variant'}`}
      />
      {errors[id] && <p className="mt-1 text-xs text-error">{errors[id]}</p>}
    </div>
  )

  return (
    <form onSubmit={e => { e.preventDefault(); if (validate()) onNext(data) }} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        {field('prenom', 'Prénom')}
        {field('nom', 'Nom')}
      </div>
      {field('email', 'Email', 'email')}
      {field('telephone', 'Téléphone', 'tel')}
      {field('adresse', 'Adresse complète')}

      <div>
        <p className="font-label-caps text-xs uppercase tracking-widest text-on-surface-variant mb-2">Type de client *</p>
        <div className="flex gap-3">
          {(['particulier', 'pro'] as const).map(t => (
            <label key={t} className={`flex-1 border px-4 py-3 text-center cursor-pointer transition-colors ${data.client_type === t ? 'border-primary bg-primary/5 text-primary' : 'border-outline-variant text-on-surface'}`}>
              <input type="radio" name="client_type" value={t} checked={data.client_type === t}
                onChange={() => set('client_type', t)} className="sr-only" />
              {t === 'particulier' ? 'Particulier' : 'Professionnel'}
            </label>
          ))}
        </div>
      </div>

      {data.client_type === 'pro' && (
        <div className="space-y-4 p-4 bg-surface-container-lowest border border-outline-variant">
          {field('raison_sociale', 'Raison sociale')}
          {field('siret', 'N° SIRET', 'text', '12345678901234')}
          {field('instagram', 'Instagram', 'text', '@votre_compte', false)}
        </div>
      )}

      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" checked={data.rgpd_consent}
          onChange={e => set('rgpd_consent', e.target.checked)}
          className="mt-1 accent-primary flex-shrink-0" />
        <span className="text-sm text-on-surface">
          J'accepte que mes données personnelles soient utilisées dans le cadre de ma formation et conservées 5 ans conformément aux obligations des organismes de formation (Art. L.6353-8 du Code du travail).
        </span>
      </label>
      {errors.rgpd_consent && <p className="text-xs text-error">{errors.rgpd_consent}</p>}

      <button type="submit"
        className="w-full bg-primary text-on-primary py-4 font-label-caps text-xs uppercase tracking-widest hover:opacity-90 transition-opacity min-h-[44px]">
        Voir mon contrat →
      </button>
    </form>
  )
}
