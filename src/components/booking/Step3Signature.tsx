'use client'
import { useState } from 'react'
import SignatureCanvas from './SignatureCanvas'

export interface SignatureData {
  type: 'text' | 'draw'
  valeur: string
  timestamp: string
  ip: string
  userAgent: string
}

interface Props {
  defaultName: string
  loading: boolean
  error: string | null
  onConfirm: (sig: SignatureData) => void
  onBack: () => void
}

export default function Step3Signature({ defaultName, loading, error, onConfirm, onBack }: Props) {
  const [tab, setTab] = useState<'text' | 'draw'>('text')
  const [textVal, setTextVal] = useState(defaultName)
  const [drawVal, setDrawVal] = useState<string | null>(null)

  const handleConfirm = () => {
    const valeur = tab === 'text' ? textVal.trim() : (drawVal ?? '')
    if (!valeur) return
    onConfirm({
      type: tab,
      valeur,
      timestamp: new Date().toISOString(),
      ip: '',
      userAgent: navigator.userAgent,
    })
  }

  const canSubmit = tab === 'text' ? textVal.trim().length > 0 : drawVal !== null

  return (
    <div className="space-y-5">
      <div className="flex border border-outline-variant">
        {(['text', 'draw'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-3 font-label-caps text-xs uppercase tracking-widest transition-colors ${tab === t ? 'bg-primary text-on-primary' : 'text-on-surface hover:bg-surface-container-low'}`}>
            {t === 'text' ? 'Taper mon nom' : 'Dessiner'}
          </button>
        ))}
      </div>

      {tab === 'text' ? (
        <div>
          <label className="block font-label-caps text-xs uppercase tracking-widest text-on-surface-variant mb-2">
            Votre nom complet
          </label>
          <input
            type="text" value={textVal}
            onChange={e => setTextVal(e.target.value)}
            className="w-full border border-outline-variant px-4 py-3 text-sm bg-surface focus:border-primary focus:outline-none"
          />
          {textVal.trim() && (
            <p className="mt-3 font-serif italic text-xl text-on-surface border-b border-outline-variant pb-2">
              {textVal}
            </p>
          )}
        </div>
      ) : (
        <SignatureCanvas onChange={setDrawVal} />
      )}

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="flex gap-3">
        <button onClick={onBack} disabled={loading}
          className="border border-outline-variant px-6 py-3 font-label-caps text-xs uppercase tracking-widest text-on-surface hover:bg-surface-container-low transition-colors min-h-[44px]">
          ← Retour
        </button>
        <button onClick={handleConfirm} disabled={!canSubmit || loading}
          className="flex-1 bg-primary text-on-primary py-3 font-label-caps text-xs uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed min-h-[44px]">
          {loading ? 'Traitement...' : "Signer et payer l'acompte →"}
        </button>
      </div>
    </div>
  )
}
