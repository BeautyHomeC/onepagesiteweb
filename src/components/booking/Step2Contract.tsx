'use client'
import { useRef, useState, useEffect } from 'react'

interface Props {
  html: string
  onSign: () => void
  onBack: () => void
}

export default function Step2Contract({ html, onSign, onBack }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [hasScrolled, setHasScrolled] = useState(false)

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) setHasScrolled(true)
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    if (el.scrollHeight <= el.clientHeight + 10) setHasScrolled(true)
  }, [html])

  return (
    <div className="space-y-5">
      <p className="font-body-md text-sm text-on-surface-variant">
        Lisez votre contrat en entier avant de signer. Le bouton de signature s'active après lecture complète.
      </p>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="border border-outline-variant bg-white max-h-[55vh] overflow-y-auto p-6 font-body-md text-sm text-on-surface leading-relaxed"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {!hasScrolled && (
        <p className="text-xs text-on-surface-variant italic text-center">
          ↓ Faites défiler jusqu'en bas pour activer la signature
        </p>
      )}

      <div className="flex gap-3">
        <button onClick={onBack}
          className="border border-outline-variant px-6 py-3 font-label-caps text-xs uppercase tracking-widest text-on-surface hover:bg-surface-container-low transition-colors min-h-[44px]">
          ← Retour
        </button>
        <button onClick={onSign} disabled={!hasScrolled}
          className="flex-1 bg-primary text-on-primary py-3 font-label-caps text-xs uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed min-h-[44px]">
          Signer →
        </button>
      </div>
    </div>
  )
}
