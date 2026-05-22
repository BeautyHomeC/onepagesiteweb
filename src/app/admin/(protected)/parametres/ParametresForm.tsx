'use client'

import { useState, useTransition } from 'react'
import { saveParametre } from '@/app/admin/actions'

interface Param {
  cle: string
  valeur: string | null
}

interface Props {
  params: Param[]
}

const PARAM_META: Record<string, { label: string; description: string; type?: 'url' | 'text' | 'email' }> = {
  livret_accueil_url: {
    label: "URL du livret d'accueil",
    description: "Lien public direct vers le PDF du livret d'accueil. Envoyé automatiquement par email après chaque inscription confirmée.",
    type: 'url',
  },
  email_admin: {
    label: 'Email de notification admin',
    description: "Adresse email qui reçoit les notifications pour chaque nouvelle inscription (défaut : beautyhomeconcept@gmail.com).",
    type: 'email',
  },
}

export default function ParametresForm({ params }: Props) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    for (const p of params) map[p.cle] = p.valeur ?? ''
    return map
  })
  const [statuses, setStatuses] = useState<Record<string, 'idle' | 'saving' | 'saved' | 'error'>>({})
  const [isPending, startTransition] = useTransition()

  const handleSave = (cle: string) => {
    setStatuses((s) => ({ ...s, [cle]: 'saving' }))
    startTransition(async () => {
      try {
        await saveParametre(cle, values[cle] ?? '')
        setStatuses((s) => ({ ...s, [cle]: 'saved' }))
        setTimeout(() => setStatuses((s) => ({ ...s, [cle]: 'idle' })), 3000)
      } catch {
        setStatuses((s) => ({ ...s, [cle]: 'error' }))
        setTimeout(() => setStatuses((s) => ({ ...s, [cle]: 'idle' })), 4000)
      }
    })
  }

  const knownKeys = Object.keys(PARAM_META)
  // Also show any extra keys from DB that aren't in the meta map
  const extraKeys = params.map((p) => p.cle).filter((k) => !knownKeys.includes(k))
  const allKeys = [...knownKeys, ...extraKeys]

  return (
    <div className="space-y-6 max-w-2xl">
      {allKeys.map((cle) => {
        const meta = PARAM_META[cle]
        const status = statuses[cle] ?? 'idle'
        const inputType = meta?.type ?? 'text'

        return (
          <div key={cle} className="bg-surface border border-surface-container-highest p-6 space-y-4">
            <div>
              <label htmlFor={cle} className="block text-sm font-medium text-on-surface mb-1">
                {meta?.label ?? cle}
              </label>
              {meta?.description && (
                <p className="text-xs text-on-surface-variant mb-3 leading-relaxed">{meta.description}</p>
              )}
              <input
                id={cle}
                type={inputType}
                value={values[cle] ?? ''}
                onChange={(e) => setValues((v) => ({ ...v, [cle]: e.target.value }))}
                placeholder={inputType === 'url' ? 'https://...' : ''}
                className="w-full border border-surface-container-highest bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs">
                {status === 'saved' && <span className="text-green-700">✓ Enregistré</span>}
                {status === 'error' && <span className="text-red-600">Erreur — réessayez</span>}
              </div>
              <button
                type="button"
                onClick={() => handleSave(cle)}
                disabled={isPending || status === 'saving'}
                className="bg-primary text-on-primary px-5 py-2 text-xs font-label-caps tracking-widest uppercase hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {status === 'saving' ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
