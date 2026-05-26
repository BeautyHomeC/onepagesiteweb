'use client'
import { useRef, useState, useEffect } from 'react'

interface Props {
  html: string
  onSign: () => void
  onBack: () => void
}

export default function Step2Contract({ html, onSign, onBack }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [hasScrolled, setHasScrolled] = useState(false)
  const [scrollPct, setScrollPct] = useState(0)

  // Hide the template's own print/download toolbar inside the iframe
  const htmlWithOverrides = html.replace(
    '</head>',
    '<style>.toolbar { display: none !important; }</style></head>'
  )

  useEffect(() => {
    setHasScrolled(false)
    setScrollPct(0)
  }, [html])

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    let scrollListener: (() => void) | null = null

    const onLoad = () => {
      const win = iframe.contentWindow
      const doc = iframe.contentDocument
      if (!win || !doc) return

      // If content fits without scrolling, mark as read immediately
      const totalH  = doc.documentElement.scrollHeight
      const visible = win.innerHeight
      if (totalH <= visible + 20) { setHasScrolled(true); setScrollPct(100); return }

      scrollListener = () => {
        const scrollTop = win.scrollY
        const max = doc.documentElement.scrollHeight - win.innerHeight
        const pct = Math.round((scrollTop / Math.max(1, max)) * 100)
        setScrollPct(pct)
        if (scrollTop + win.innerHeight >= doc.documentElement.scrollHeight - 20) {
          setHasScrolled(true)
        }
      }

      win.addEventListener('scroll', scrollListener, { passive: true })
    }

    iframe.addEventListener('load', onLoad)
    return () => {
      iframe.removeEventListener('load', onLoad)
      if (scrollListener) iframe.contentWindow?.removeEventListener('scroll', scrollListener)
    }
  }, [html])

  return (
    <div className="space-y-4">
      <p
        className="text-sm text-on-surface-variant leading-relaxed"
        style={{ fontFamily: 'var(--font-hanken)' }}
      >
        Lisez votre contrat en entier. Le bouton de signature s'active après lecture complète.
      </p>

      {/* Progress bar */}
      <div className="h-0.5 bg-surface-container-high overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${scrollPct}%` }}
        />
      </div>

      {/* Contract iframe — full width, no inner padding */}
      <div className="relative border border-outline-variant overflow-hidden" style={{ height: '58vh' }}>
        <iframe
          ref={iframeRef}
          srcDoc={htmlWithOverrides}
          className="w-full h-full border-0"
          title="Votre contrat de formation"
          sandbox="allow-scripts allow-same-origin"
        />

        {/* Fade hint at bottom */}
        {!hasScrolled && (
          <div
            className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, transparent, rgba(250,249,249,0.96))',
            }}
          />
        )}
      </div>

      {/* Scroll state indicator */}
      {!hasScrolled ? (
        <div className="flex items-center justify-center gap-2 text-on-surface-variant">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="animate-bounce">
            <path d="M6 1v10M2 7l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-[10px] uppercase tracking-widest" style={{ fontFamily: 'var(--font-hanken)' }}>
            Faites défiler jusqu'en bas
          </span>
        </div>
      ) : (
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
          className="flex-1 border border-primary text-primary py-3 text-xs uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-colors disabled:opacity-30 disabled:cursor-not-allowed min-h-[44px]"
          style={{ fontFamily: 'var(--font-hanken)', fontWeight: 500 }}
        >
          Signer →
        </button>
      </div>
    </div>
  )
}
