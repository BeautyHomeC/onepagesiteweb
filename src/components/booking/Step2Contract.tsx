'use client'
import { useState, useEffect } from 'react'

interface Props {
  html: string
  onSign: () => void
  onBack: () => void
}

/**
 * Injected into the iframe <head> before </head>.
 *
 * The template's mobile CSS does:
 *   .page { transform: scale(0.55); height: calc(297mm * 0.55); overflow: hidden; }
 * The height + overflow combo CLIPS each page to ~55% of its content.
 *
 * Fix strategy:
 *  1. Hide the toolbar.
 *  2. Override the media-query CSS so pages keep their FULL 297mm height (no clipping).
 *  3. A small inline script measures the real viewport width and sets --s (scale) and --vw
 *     so pages scale to fit the iframe width, centered, with correct negative margin to
 *     collapse the excess layout space created by keeping full height.
 *  4. postMessage sends scroll progress to the parent (more reliable than contentWindow access).
 */
function buildInjection(): string {
  const style = `
<style id="__bhc_override">
.toolbar { display: none !important; }
@media (max-width: 900px) {
  body {
    padding-top: 12px !important;
    overflow-x: hidden !important;
    background: #e8e3d8 !important;
  }
  .page {
    /* Keep FULL A4 height — no content clipping */
    height: 297mm !important;
    /* Dynamic scale set by the JS below */
    transform: scale(var(--s, 0.58)) !important;
    transform-origin: top left !important;
    /* Center the scaled page horizontally */
    margin-left: calc((var(--vw, 500px) - 210mm * var(--s, 0.58)) / 2) !important;
    /* Collapse the layout space that exceeds visual height, keep a small gap */
    margin-bottom: calc(297mm * var(--s, 0.58) - 297mm + 10px) !important;
    margin-top: 0 !important;
  }
}
</style>`

  const script = `
<script id="__bhc_scale">
(function(){
  var PAGE_W = 210 * 96 / 25.4; /* 210mm in px at 96dpi ≈ 793.7 */
  var r = document.documentElement;

  function applyScale() {
    var vw = window.innerWidth;
    /* Fit page width with 20px side padding */
    var s = Math.min(1, (vw - 20) / PAGE_W);
    r.style.setProperty('--s', s.toFixed(4));
    r.style.setProperty('--vw', vw + 'px');
  }

  function reportScroll() {
    var sT = window.scrollY || r.scrollTop;
    var sH = r.scrollHeight;
    var cH = window.innerHeight;
    var max = Math.max(1, sH - cH);
    var fits = sH <= cH + 10;
    window.parent.postMessage(
      { t: 'c', p: fits ? 100 : Math.round(sT / max * 100), f: fits },
      '*'
    );
  }

  applyScale();
  window.addEventListener('resize', function(){ applyScale(); reportScroll(); });
  window.addEventListener('scroll', reportScroll, { passive: true });
  /* Report after fonts/images settle */
  window.addEventListener('load', function(){ applyScale(); reportScroll(); });
  /* Also fire once DOM is ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ applyScale(); reportScroll(); });
  } else {
    setTimeout(function(){ applyScale(); reportScroll(); }, 60);
  }
})();
<\/script>`

  return style + script
}

const INJECTION = buildInjection()

export default function Step2Contract({ html, onSign, onBack }: Props) {
  const [hasScrolled, setHasScrolled] = useState(false)
  const [scrollPct, setScrollPct] = useState(0)

  // Inject overrides before </head>
  const processedHtml = html.includes('</head>')
    ? html.replace('</head>', INJECTION + '</head>')
    : INJECTION + html

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

      {/* Contract iframe — fixed height, internal scroll */}
      <div
        className="relative border border-outline-variant overflow-hidden"
        style={{ height: '62vh' }}
      >
        <iframe
          key={html.slice(0, 40)}
          srcDoc={processedHtml}
          className="w-full h-full border-0"
          title="Votre contrat de formation"
          sandbox="allow-scripts allow-same-origin"
        />

        {/* Scroll-down fade hint */}
        {!hasScrolled && (
          <div
            className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, transparent, rgba(250,249,249,0.97))',
            }}
          />
        )}
      </div>

      {/* Read state */}
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
