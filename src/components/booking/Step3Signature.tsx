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
  const [tab, setTab] = useState<'text' | 'draw'>('draw')
  const [textVal, setTextVal] = useState(defaultName)
  const [drawVal, setDrawVal] = useState<string | null>(null)
  const [consentChecked, setConsentChecked] = useState(false)

  const handleConfirm = () => {
    const valeur = tab === 'text' ? textVal.trim() : (drawVal ?? '')
    if (!valeur || !consentChecked) return
    onConfirm({
      type: tab,
      valeur,
      timestamp: new Date().toISOString(),
      ip: '',
      userAgent: navigator.userAgent,
    })
  }

  const canSubmit = (tab === 'text' ? textVal.trim().length > 0 : drawVal !== null) && consentChecked

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="text-center mb-10 max-w-lg mx-auto">
        <h2
          className="text-[32px] md:text-[36px] text-primary mb-3 italic leading-tight"
          style={{ fontFamily: 'var(--font-playfair)', fontWeight: 400 }}
        >
          Signature Numérique
        </h2>
        <p className="text-sm text-on-surface-variant/80" style={{ fontFamily: 'var(--font-hanken)', fontWeight: 300 }}>
          Veuillez apposer votre signature pour valider les conditions du programme.
        </p>
      </header>

      {/* Mode Switcher */}
      <div className="flex justify-center mb-6">
        <div className="flex bg-surface-container-low p-1 rounded-full border border-outline-variant/30">
          <button
            type="button"
            onClick={() => setTab('draw')}
            className={`px-8 py-2 rounded-full font-label-caps text-[10px] tracking-widest uppercase transition-all duration-300 ${
              tab === 'draw'
                ? 'bg-surface-container-lowest text-primary shadow-sm font-medium'
                : 'text-on-surface-variant hover:text-on-surface font-light'
            }`}
            style={{ fontFamily: 'var(--font-hanken)' }}
          >
            DESSINER
          </button>
          <button
            type="button"
            onClick={() => setTab('text')}
            className={`px-8 py-2 rounded-full font-label-caps text-[10px] tracking-widest uppercase transition-all duration-300 ${
              tab === 'text'
                ? 'bg-surface-container-lowest text-primary shadow-sm font-medium'
                : 'text-on-surface-variant hover:text-on-surface font-light'
            }`}
            style={{ fontFamily: 'var(--font-hanken)' }}
          >
            ÉCRIRE
          </button>
        </div>
      </div>

      {/* Input area based on active tab */}
      {tab === 'draw' ? (
        <div className="block animation-fade-in">
          <SignatureCanvas onChange={setDrawVal} />
        </div>
      ) : (
        <div className="flex flex-col gap-6 border border-outline-variant/50 bg-surface-container-low/30 p-8 h-64 w-full transition-all justify-between animation-fade-in">
          <div className="relative">
            <input
              type="text"
              value={textVal}
              onChange={e => setTextVal(e.target.value)}
              className="w-full bg-transparent border-b border-outline-variant focus:border-primary outline-none py-3 font-body-md text-on-surface placeholder:text-on-surface-variant/40 transition-colors"
              style={{ fontFamily: 'var(--font-hanken)' }}
              placeholder="Entrez votre nom complet"
            />
          </div>
          <div className="flex-grow flex items-center justify-center overflow-hidden">
            <p className="text-4xl md:text-5xl text-primary opacity-80 min-h-[1.5em] text-center" style={{ fontFamily: "'Dancing Script', cursive" }}>
              {textVal}
            </p>
          </div>
        </div>
      )}

      {/* Legal Consent checkbox */}
      <div className="flex items-start gap-4 p-4 border border-outline-variant/20 bg-surface-container-low/20">
        <div className="mt-0.5">
          <button
            type="button"
            role="checkbox"
            aria-checked={consentChecked}
            onClick={() => setConsentChecked(!consentChecked)}
            className={`w-5 h-5 border transition-colors flex items-center justify-center ${
              consentChecked ? 'bg-primary border-primary text-on-primary' : 'border-outline-variant bg-surface-container-lowest'
            }`}
          >
            {consentChecked && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </div>
        <label
          onClick={() => setConsentChecked(!consentChecked)}
          className="font-body-md text-xs text-on-surface-variant leading-relaxed cursor-pointer select-none"
          style={{ fontFamily: 'var(--font-hanken)' }}
        >
          Je reconnais que cette signature électronique a la même valeur juridique qu'une signature manuscrite et j'accepte les{' '}
          <a
            href="/cgv"
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-4 decoration-primary/30 hover:decoration-primary transition-all text-primary font-medium"
            onClick={e => e.stopPropagation()}
          >
            conditions générales de vente
          </a>.
        </label>
      </div>

      {/* Error display */}
      {error && (
        <div className="border border-error/30 bg-error/5 px-4 py-3">
          <p className="text-xs text-error leading-relaxed" style={{ fontFamily: 'var(--font-hanken)' }}>
            {error}
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="-mx-6 md:-mx-12 -mb-8 md:-mb-16 mt-12 px-6 md:px-12 py-10 bg-surface-container-low flex flex-col md:flex-row justify-between items-center gap-6 shrink-0 border-t border-surface-container">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="w-full md:w-auto px-10 py-4 border border-outline text-on-surface font-label-caps text-[11px] hover:bg-surface transition-all tracking-widest flex items-center justify-center gap-2 disabled:opacity-40"
          style={{ fontFamily: 'var(--font-hanken)' }}
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          RETOUR
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!canSubmit || loading}
          className="w-full md:w-auto px-10 py-4 bg-primary text-on-primary font-label-caps text-[11px] hover:opacity-90 transition-all shadow-lg shadow-primary/20 tracking-widest flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ fontFamily: 'var(--font-hanken)' }}
        >
          {loading ? (
            <>
              <span className="w-3.5 h-3.5 border border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
              TRAITEMENT…
            </>
          ) : (
            <>
              CONTINUER VERS LE PAIEMENT
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
