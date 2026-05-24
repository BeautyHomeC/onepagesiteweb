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
  const [scrollPct, setScrollPct] = useState(0)

  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const pct = (el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight)) * 100
    setScrollPct(Math.round(pct))
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) setHasScrolled(true)
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    if (el.scrollHeight <= el.clientHeight + 10) { setHasScrolled(true); setScrollPct(100) }
  }, [html])

  return (
    <div className="space-y-4">
      <p className="text-sm text-on-surface-variant leading-relaxed" style={{ fontFamily: 'var(--font-hanken)' }}>
        Lisez votre contrat en entier. Le bouton de signature s'active après lecture complète.
      </p>

      {/* Progress bar */}
      <div className="h-0.5 bg-surface-container-high overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${scrollPct}%` }}
        />
      </div>

      {/* Contract viewer with fade hint */}
      <div className="relative">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="border border-outline-variant bg-white max-h-[52vh] overflow-y-auto"
        >
          <div
            className="p-6 text-sm text-on-surface leading-relaxed prose prose-sm max-w-none"
            style={{ fontFamily: 'var(--font-hanken)' }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>

        {/* Fade gradient — disappears when scrolled to bottom */}
        {!hasScrolled && (
          <div
            className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, transparent, rgba(250,249,249,0.95))',
            }}
          />
        )}
      </div>

      {/* Scroll hint */}
      {!hasScrolled && (
        <div className="flex items-center justify-center gap-2 text-on-surface-variant">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="animate-bounce">
            <path d="M6 1v10M2 7l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-[10px] uppercase tracking-widest" style={{ fontFamily: 'var(--font-hanken)' }}>
            Faites défiler jusqu'en bas
          </span>
        </div>
      )}

      {hasScrolled && (
        <div className="flex items-center justify-center gap-2 text-primary">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 6l3.5 3.5L11 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-[10px] uppercase tracking-widest" style={{ fontFamily: 'var(--font-hanken)' }}>
            Lu en entier — vous pouvez signer
          </span>
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <button
          onClick={onBack}
          className="border border-outline-variant px-6 py-3 text-xs uppercase tracking-widest text-on-surface hover:bg-surface-container-low transition-colors min-h-[44px]"
          style={{ fontFamily: 'var(--font-hanken)', fontWeight: 500 }}
        >
          ← Retour
        </button>
        <button
          onClick={onSign}
          disabled={!hasScrolled}
          className="flex-1 bg-primary text-on-primary py-3 text-xs uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed min-h-[44px]"
          style={{ fontFamily: 'var(--font-hanken)', fontWeight: 500 }}
        >
          Signer →
        </button>
      </div>
    </div>
  )
}
