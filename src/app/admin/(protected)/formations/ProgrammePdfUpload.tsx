'use client'

import { useState, useTransition, useRef } from 'react'
import { uploadProgrammePdf } from './actions'

interface Props {
  formationId: string
  currentUrl: string | null
}

export default function ProgrammePdfUpload({ formationId, currentUrl }: Props) {
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<{ success?: boolean; url?: string; error?: string } | null>(null)
  const [localUrl, setLocalUrl] = useState(currentUrl)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = (file: File) => {
    const fd = new FormData()
    fd.set('formation_id', formationId)
    fd.set('pdf_file', file)
    startTransition(async () => {
      setResult(null)
      const res = await uploadProgrammePdf(fd)
      if ('error' in res && res.error) {
        setResult({ error: res.error })
      } else if ('url' in res) {
        setLocalUrl(res.url as string)
        setResult({ success: true })
      }
    })
  }

  return (
    <div className="border-t border-surface-container-highest pt-3 mt-3 space-y-2">
      <p className="text-[9px] uppercase tracking-[0.2em] text-on-surface-variant" style={{ fontFamily: 'var(--font-hanken)', fontWeight: 500 }}>
        Programme PDF
      </p>

      {localUrl ? (
        <div className="flex items-center gap-2">
          <svg width="12" height="14" viewBox="0 0 12 14" fill="none" className="shrink-0 text-primary">
            <path d="M1 1h7l3 3v9H1V1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
            <path d="M7 1v3h3" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
          </svg>
          <a
            href={localUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:opacity-70 transition-opacity truncate max-w-[120px]"
            style={{ fontFamily: 'var(--font-hanken)' }}
          >
            PDF actuel
          </a>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={pending}
            className="text-[9px] uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors disabled:opacity-40 ml-auto"
            style={{ fontFamily: 'var(--font-hanken)' }}
          >
            {pending ? '…' : 'Changer'}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pending}
          className="w-full flex items-center justify-center gap-2 border border-dashed border-outline-variant py-2.5 text-[9px] uppercase tracking-widest text-on-surface-variant hover:text-primary hover:border-primary transition-colors disabled:opacity-40"
          style={{ fontFamily: 'var(--font-hanken)' }}
        >
          {pending ? (
            <>
              <div className="w-3 h-3 border border-primary/30 border-t-primary rounded-full animate-spin" />
              Upload…
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 9V3M3 6l3-3 3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M1 10h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              Ajouter un PDF
            </>
          )}
        </button>
      )}

      {result?.error && (
        <p className="text-[9px] text-error" style={{ fontFamily: 'var(--font-hanken)' }}>{result.error}</p>
      )}
      {result?.success && (
        <p className="text-[9px] text-green-700" style={{ fontFamily: 'var(--font-hanken)' }}>PDF mis à jour ✓</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleUpload(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}
