'use client'
import { useRef, useState, useEffect } from 'react'

interface Props {
  html: string
  onSign: () => void
  onBack: () => void
}

// Injected into the iframe to fix layout + track scroll via postMessage
const STYLE_OVERRIDES = `<style>
.toolbar { display: none !important; }
body { overflow-x: hidden !important; }
html { overflow-y: scroll; }
@media (max-width: 900px) {
  .page {
    transform-origin: top left !important;
    margin-left: calc((100% - 437px) / 2) !important;
  }
}
</style>`

const SCROLL_SCRIPT = `<script>
(function(){
  function report() {
    var sT = window.scrollY || document.documentElement.scrollTop;
    var sH = document.documentElement.scrollHeight;
    var cH = window.innerHeight;
    var max = Math.max(1, sH - cH);
    if (sH <= cH + 10) {
      window.parent.postMessage({t:'c',p:100,f:true},'*');
      return;
    }
    window.parent.postMessage({t:'c',p:Math.round(sT/max*100),f:false},'*');
  }
  window.addEventListener('scroll', report, {passive:true});
  window.addEventListener('load', report);
})();
<\/script>`

export default function Step2Contract({ html, onSign, onBack }: Props) {
  const [hasScrolled, setHasScrolled] = useState(false)
  const [scrollPct, setScrollPct] = useState(0)

  // Inject overrides before </head>
  const processedHtml = html.replace(
    '</head>',
    STYLE_OVERRIDES + SCROLL_SCRIPT + '</head>'
  )

  useEffect(() => {
    setHasScrolled(false)
    setScrollPct(0)
  }, [html])

  // Listen for scroll messages from the iframe
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (!e.data || e.data.t !== 'c') return
      const pct = e.data.p as number
      setScrollPct(pct)
      if (pct >= 98 || e.data.f) setHasScrolled(true)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

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

      {/* Contract iframe */}
      <div
        className="relative border border-outline-variant overflow-hidden"
        style={{ height: '60vh' }}
      >
        <iframe
          srcDoc={processedHtml}
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
