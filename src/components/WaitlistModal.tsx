'use client'
import { useState } from 'react'

interface Props {
  sessionId: string
  onClose: () => void
}

export default function WaitlistModal({ sessionId, onClose }: Props) {
  const [form, setForm] = useState({ prenom: '', nom: '', email: '' })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, ...form }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Erreur.'); return }
      setDone(true)
    } catch {
      setError('Erreur réseau. Réessayez.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-backdrop-in"
      style={{ background: 'rgba(27,28,28,0.55)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}
    >
      <div
        className="animate-modal-in bg-surface w-full sm:max-w-md max-h-[90vh] overflow-y-auto flex flex-col"
        style={{ boxShadow: '0 32px 80px rgba(27,28,28,0.3)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gold top accent — signature de l'identité BHC */}
        <div style={{ height: 2, backgroundColor: '#755a2d', flexShrink: 0 }} />

        {/* Header — fond blanc, eyebrow or, titre serif */}
        <div
          className="relative px-7 py-6 shrink-0"
          style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e9e8e8' }}
        >
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-on-surface-variant opacity-40 hover:opacity-80 transition-opacity"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          <p
            className="text-[9px] uppercase tracking-[0.3em] mb-2"
            style={{ fontFamily: 'var(--font-hanken)', color: '#755a2d' }}
          >
            Session complète
          </p>
          <h2
            className="text-xl font-normal leading-snug text-on-surface"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Rejoindre la liste d&apos;attente
          </h2>
        </div>

        {/* Body */}
        <div className="px-7 py-6 flex-1" style={{ backgroundColor: '#faf9f9' }}>
          {done ? (
            <div className="py-8 text-center space-y-4">
              <div
                className="w-10 h-10 mx-auto flex items-center justify-center"
                style={{ border: '1px solid rgba(117,90,45,0.3)' }}
              >
                <svg width="16" height="13" viewBox="0 0 16 13" fill="none">
                  <path d="M1 6.5L6 11.5L15 1.5" stroke="#755a2d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p
                className="text-xl font-normal text-on-surface"
                style={{ fontFamily: 'var(--font-playfair)' }}
              >
                Vous êtes inscrite !
              </p>
              <p
                className="text-sm text-on-surface-variant leading-relaxed"
                style={{ fontFamily: 'var(--font-hanken)', fontWeight: 300 }}
              >
                Vous recevrez un email dès qu&apos;une place se libère. Les notifications sont envoyées dans l&apos;ordre d&apos;inscription.
              </p>
              <button
                onClick={onClose}
                className="mt-4 border border-outline-variant text-on-surface-variant px-6 py-3 text-xs uppercase tracking-widest hover:border-outline transition-colors"
                style={{ fontFamily: 'var(--font-hanken)' }}
              >
                Fermer
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <p
                className="text-sm text-on-surface-variant leading-relaxed"
                style={{ fontFamily: 'var(--font-hanken)', fontWeight: 300 }}
              >
                Laissez vos coordonnées. Vous serez automatiquement prévenue par email si une place se libère.
              </p>

              <div className="grid grid-cols-2 gap-x-gutter gap-y-6">
                {(['prenom', 'nom'] as const).map((field) => (
                  <div key={field} className="flex flex-col gap-1.5 group">
                    <label
                      className="text-[11px] tracking-widest uppercase transition-colors"
                      style={{
                        fontFamily: 'var(--font-hanken)',
                        color: 'rgba(117,90,45,0.7)',
                      }}
                    >
                      {field === 'prenom' ? 'Prénom' : 'Nom'}{' '}
                      <span style={{ color: '#755a2d' }}>*</span>
                    </label>
                    <input
                      value={form[field]}
                      onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                      required
                      className="bg-transparent py-3 text-on-surface text-[15px] outline-none transition-colors"
                      style={{
                        fontFamily: 'var(--font-hanken)',
                        fontWeight: 300,
                        borderBottom: '1px solid rgba(117,90,45,0.25)',
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  className="text-[11px] tracking-widest uppercase"
                  style={{ fontFamily: 'var(--font-hanken)', color: 'rgba(117,90,45,0.7)' }}
                >
                  Email <span style={{ color: '#755a2d' }}>*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                  className="bg-transparent py-3 text-on-surface text-[15px] outline-none transition-colors"
                  style={{
                    fontFamily: 'var(--font-hanken)',
                    fontWeight: 300,
                    borderBottom: '1px solid rgba(117,90,45,0.25)',
                  }}
                />
              </div>

              {error && (
                <p className="text-xs text-error" style={{ fontFamily: 'var(--font-hanken)' }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 text-xs uppercase tracking-widest hover:opacity-90 active:opacity-80 transition-opacity min-h-[44px] disabled:opacity-50"
                style={{
                  fontFamily: 'var(--font-hanken)',
                  fontWeight: 500,
                  backgroundColor: '#755a2d',
                  color: '#ffffff',
                }}
              >
                {loading ? '…' : "M'inscrire sur la liste d'attente"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
