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
      type: tab, valeur,
      timestamp: new Date().toISOString(),
      ip: '', userAgent: navigator.userAgent,
    })
  }

  const canSubmit = tab === 'text' ? textVal.trim().length > 0 : drawVal !== null

  return (
    <div className="space-y-5">
      {/* Intro */}
      <p className="text-sm text-on-surface-variant leading-relaxed" style={{ fontFamily: 'var(--font-hanken)' }}>
        Apposez votre signature électronique. Elle a la même valeur juridique qu'une signature manuscrite.
      </p>

      {/* Tab switcher */}
      <div className="border border-outline-variant grid grid-cols-2">
        {(['text', 'draw'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`py-3 text-xs uppercase tracking-widest transition-colors ${
              tab === t
                ? 'bg-primary text-on-primary'
                : 'text-on-surface-variant hover:bg-surface-container-low'
            }`}
            style={{ fontFamily: 'var(--font-hanken)', fontWeight: 500 }}
          >
            {t === 'text' ? 'Taper mon nom' : 'Dessiner'}
          </button>
        ))}
      </div>

      {tab === 'text' ? (
        <div className="space-y-3">
          <div>
            <label htmlFor="sig-text" className="block text-[10px] uppercase tracking-[0.14em] text-on-surface-variant mb-1.5"
              style={{ fontFamily: 'var(--font-hanken)', fontWeight: 500 }}>
              Votre nom complet
            </label>
            <input
              id="sig-text"
              type="text"
              value={textVal}
              onChange={e => setTextVal(e.target.value)}
              className="w-full border border-outline-variant px-4 py-3 text-sm bg-surface-container-lowest focus:border-primary focus:outline-none transition-colors"
              style={{ fontFamily: 'var(--font-hanken)' }}
              placeholder={defaultName}
            />
          </div>

          {/* Signature preview */}
          {textVal.trim() && (
            <div className="border border-outline-variant bg-surface-container-lowest px-6 py-4">
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-3" style={{ fontFamily: 'var(--font-hanken)' }}>
                Aperçu de votre signature
              </p>
              <p className="text-2xl text-on-surface" style={{
                fontFamily: 'var(--font-playfair)',
                fontStyle: 'italic',
                fontWeight: 400,
                borderBottom: '1px solid var(--color-outline-variant)',
                paddingBottom: '8px',
                letterSpacing: '0.01em',
              }}>
                {textVal}
              </p>
              <p className="text-[9px] text-on-surface-variant mt-2 tracking-wide" style={{ fontFamily: 'var(--font-hanken)' }}>
                {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.14em] text-on-surface-variant mb-1.5"
              style={{ fontFamily: 'var(--font-hanken)', fontWeight: 500 }}>
              Dessinez votre signature
            </p>
            <SignatureCanvas onChange={setDrawVal} />
          </div>
          {!drawVal && (
            <p className="text-[10px] text-on-surface-variant/60 tracking-wide text-center" style={{ fontFamily: 'var(--font-hanken)' }}>
              Utilisez votre souris ou votre doigt
            </p>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="border border-error/30 bg-error/5 px-4 py-3">
          <p className="text-xs text-error leading-relaxed" style={{ fontFamily: 'var(--font-hanken)' }}>
            {error}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          onClick={onBack}
          disabled={loading}
          className="border border-outline-variant px-6 py-3 text-xs uppercase tracking-widest text-on-surface hover:bg-surface-container-low transition-colors min-h-[44px] disabled:opacity-40"
          style={{ fontFamily: 'var(--font-hanken)', fontWeight: 500 }}
        >
          ← Retour
        </button>
        <button
          onClick={handleConfirm}
          disabled={!canSubmit || loading}
          className="flex-1 bg-primary text-on-primary py-3 text-xs uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center gap-2"
          style={{ fontFamily: 'var(--font-hanken)', fontWeight: 500 }}
        >
          {loading ? (
            <>
              <span className="w-3.5 h-3.5 border border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
              Traitement…
            </>
          ) : (
            "Signer et payer l'acompte →"
          )}
        </button>
      </div>

      {/* Legal note */}
      <p className="text-[9px] text-on-surface-variant/60 text-center leading-relaxed" style={{ fontFamily: 'var(--font-hanken)' }}>
        Signature horodatée et conservée avec votre adresse IP. Valeur légale identique à une signature manuscrite.
      </p>
    </div>
  )
}
