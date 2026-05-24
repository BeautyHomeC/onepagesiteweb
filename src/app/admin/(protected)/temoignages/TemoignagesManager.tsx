'use client'

import { useState, useTransition } from 'react'
import { createTemoignage, updateTemoignage, deleteTemoignage, moveTemoignage } from './actions'

interface Temoignage {
  id: string
  nom: string
  role: string | null
  texte: string
  note: number
  photo_url: string | null
  video_url: string | null
  video_type: string | null
  featured: boolean
  ordre: number
}

function StarInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`material-symbols-outlined text-xl transition-colors ${n <= value ? 'text-primary' : 'text-outline-variant'}`}
          style={{ fontVariationSettings: "'FILL' 1, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}
        >
          star
        </button>
      ))}
    </div>
  )
}

function VideoTypeLabel({ type }: { type: string | null }) {
  if (!type) return null
  const labels: Record<string, string> = { youtube: 'YouTube', vimeo: 'Vimeo', upload: 'Fichier' }
  return (
    <span className="inline-block text-[9px] uppercase tracking-widest px-2 py-0.5 bg-primary/10 text-primary">
      {labels[type] ?? type}
    </span>
  )
}

function TemoignageForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
  pending,
}: {
  initial?: Partial<Temoignage>
  onSubmit: (fd: FormData) => void
  onCancel?: () => void
  submitLabel: string
  pending: boolean
}) {
  const [note, setNote] = useState(initial?.note ?? 5)
  const [videoMode, setVideoMode] = useState<'link' | 'file'>(
    initial?.video_type === 'upload' ? 'file' : 'link'
  )

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        fd.set('note', String(note))
        onSubmit(fd)
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-on-surface-variant mb-1.5" style={{ fontFamily: 'var(--font-hanken)', fontWeight: 500 }}>
            Nom <span className="text-primary">*</span>
          </label>
          <input
            name="nom"
            required
            defaultValue={initial?.nom}
            className="w-full border border-outline-variant px-3 py-2.5 text-sm bg-surface-container-lowest focus:outline-none focus:border-primary transition-colors"
            style={{ fontFamily: 'var(--font-hanken)' }}
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-on-surface-variant mb-1.5" style={{ fontFamily: 'var(--font-hanken)', fontWeight: 500 }}>
            Titre / Rôle
          </label>
          <input
            name="role"
            defaultValue={initial?.role ?? ''}
            placeholder="ex: Prothésiste — Amiens"
            className="w-full border border-outline-variant px-3 py-2.5 text-sm bg-surface-container-lowest focus:outline-none focus:border-primary transition-colors placeholder:text-on-surface-variant/40"
            style={{ fontFamily: 'var(--font-hanken)' }}
          />
        </div>
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-widest text-on-surface-variant mb-1.5" style={{ fontFamily: 'var(--font-hanken)', fontWeight: 500 }}>
          Témoignage <span className="text-primary">*</span>
        </label>
        <textarea
          name="texte"
          required
          rows={4}
          defaultValue={initial?.texte}
          className="w-full border border-outline-variant px-3 py-2.5 text-sm bg-surface-container-lowest focus:outline-none focus:border-primary transition-colors resize-none"
          style={{ fontFamily: 'var(--font-hanken)' }}
        />
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-1.5" style={{ fontFamily: 'var(--font-hanken)', fontWeight: 500 }}>Note</p>
        <StarInput value={note} onChange={setNote} />
      </div>

      {/* Video */}
      <div className="border border-outline-variant p-4 bg-surface-container-lowest space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant" style={{ fontFamily: 'var(--font-hanken)', fontWeight: 500 }}>
            Vidéo (optionnel)
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setVideoMode('link')}
              className={`text-[9px] uppercase tracking-widest px-2 py-1 border transition-colors ${videoMode === 'link' ? 'border-primary text-primary bg-primary/5' : 'border-outline-variant text-on-surface-variant'}`}
              style={{ fontFamily: 'var(--font-hanken)' }}
            >
              Lien URL
            </button>
            <button
              type="button"
              onClick={() => setVideoMode('file')}
              className={`text-[9px] uppercase tracking-widest px-2 py-1 border transition-colors ${videoMode === 'file' ? 'border-primary text-primary bg-primary/5' : 'border-outline-variant text-on-surface-variant'}`}
              style={{ fontFamily: 'var(--font-hanken)' }}
            >
              Fichier
            </button>
          </div>
        </div>

        {videoMode === 'link' ? (
          <input
            name="video_url"
            type="url"
            defaultValue={initial?.video_type !== 'upload' ? (initial?.video_url ?? '') : ''}
            placeholder="https://youtube.com/watch?v=... ou https://vimeo.com/..."
            className="w-full border border-outline-variant px-3 py-2.5 text-sm bg-surface focus:outline-none focus:border-primary transition-colors placeholder:text-on-surface-variant/40"
            style={{ fontFamily: 'var(--font-hanken)' }}
          />
        ) : (
          <input
            name="video_file"
            type="file"
            accept="video/mp4,video/webm,video/mov"
            className="w-full text-sm text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:border file:border-primary file:bg-primary/5 file:text-primary file:text-[9px] file:uppercase file:tracking-widest"
            style={{ fontFamily: 'var(--font-hanken)' }}
          />
        )}

        {initial?.video_url && (
          <label className="flex items-center gap-2 text-xs text-on-surface-variant cursor-pointer">
            <input type="checkbox" name="clear_video" value="1" />
            <span style={{ fontFamily: 'var(--font-hanken)' }}>Supprimer la vidéo actuelle</span>
          </label>
        )}
      </div>

      {/* Photo */}
      <div className="border border-outline-variant p-4 bg-surface-container-lowest space-y-3">
        <p className="text-[10px] uppercase tracking-widest text-on-surface-variant" style={{ fontFamily: 'var(--font-hanken)', fontWeight: 500 }}>
          Photo (optionnel, affiché si pas de vidéo)
        </p>
        <input
          name="photo_file"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="w-full text-sm text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:border file:border-primary file:bg-primary/5 file:text-primary file:text-[9px] file:uppercase file:tracking-widest"
          style={{ fontFamily: 'var(--font-hanken)' }}
        />
        {initial?.photo_url && (
          <label className="flex items-center gap-2 text-xs text-on-surface-variant cursor-pointer">
            <input type="checkbox" name="clear_photo" value="1" />
            <span style={{ fontFamily: 'var(--font-hanken)' }}>Supprimer la photo actuelle</span>
          </label>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="bg-primary text-on-primary px-6 py-3 text-xs uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-opacity min-h-[44px]"
          style={{ fontFamily: 'var(--font-hanken)', fontWeight: 500 }}
        >
          {pending ? '…' : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="border border-outline-variant text-on-surface-variant px-6 py-3 text-xs uppercase tracking-widest hover:border-outline transition-colors min-h-[44px]"
            style={{ fontFamily: 'var(--font-hanken)' }}
          >
            Annuler
          </button>
        )}
      </div>
    </form>
  )
}

export default function TemoignagesManager({ initialTemoignages }: { initialTemoignages: Temoignage[] }) {
  const [temoignages, setTemoignages] = useState<Temoignage[]>(initialTemoignages)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const handleCreate = (fd: FormData) => {
    startTransition(async () => {
      setError(null)
      const res = await createTemoignage(fd)
      if ('error' in res && res.error) { setError(res.error); return }
      setShowCreate(false)
      // Refresh page to get new data
      window.location.reload()
    })
  }

  const handleUpdate = (id: string, fd: FormData) => {
    startTransition(async () => {
      setError(null)
      const res = await updateTemoignage(id, fd)
      if ('error' in res && res.error) { setError(res.error); return }
      setEditingId(null)
      window.location.reload()
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm('Supprimer ce témoignage ?')) return
    startTransition(async () => {
      setError(null)
      const res = await deleteTemoignage(id)
      if ('error' in res && res.error) { setError(res.error); return }
      setTemoignages((prev) => prev.filter((t) => t.id !== id))
    })
  }

  const handleMove = (id: string, dir: 'up' | 'down') => {
    startTransition(async () => {
      await moveTemoignage(id, dir)
      window.location.reload()
    })
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-error/10 border border-error text-error text-sm" style={{ fontFamily: 'var(--font-hanken)' }}>
          {error}
        </div>
      )}

      {/* Create form */}
      {showCreate ? (
        <div className="bg-surface border border-outline-variant p-6 space-y-4">
          <h3 className="font-playfair text-xl text-on-surface">Nouveau témoignage</h3>
          <TemoignageForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreate(false)}
            submitLabel="Ajouter"
            pending={pending}
          />
        </div>
      ) : (
        <button
          onClick={() => setShowCreate(true)}
          className="bg-primary text-on-primary px-6 py-3 text-xs uppercase tracking-widest hover:opacity-90 transition-opacity min-h-[44px]"
          style={{ fontFamily: 'var(--font-hanken)', fontWeight: 500 }}
        >
          + Ajouter un témoignage
        </button>
      )}

      {/* List */}
      <div className="space-y-4">
        {temoignages.length === 0 && (
          <p className="text-on-surface-variant italic text-sm">Aucun témoignage pour le moment.</p>
        )}

        {temoignages.map((t, idx) => (
          <div key={t.id} className="bg-surface border border-surface-container-highest overflow-hidden">
            {editingId === t.id ? (
              <div className="p-6 space-y-4">
                <h3 className="font-playfair text-xl text-on-surface">Modifier — {t.nom}</h3>
                <TemoignageForm
                  initial={t}
                  onSubmit={(fd) => handleUpdate(t.id, fd)}
                  onCancel={() => setEditingId(null)}
                  submitLabel="Enregistrer"
                  pending={pending}
                />
              </div>
            ) : (
              <div className="flex gap-4 p-5">
                {/* Order controls */}
                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={() => handleMove(t.id, 'up')}
                    disabled={idx === 0 || pending}
                    className="w-8 h-8 flex items-center justify-center border border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary disabled:opacity-25 transition-colors"
                    aria-label="Monter"
                  >
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                      <path d="M1 5L5 1L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <span className="w-8 h-6 flex items-center justify-center text-[10px] text-on-surface-variant" style={{ fontFamily: 'var(--font-hanken)' }}>
                    {idx + 1}
                  </span>
                  <button
                    onClick={() => handleMove(t.id, 'down')}
                    disabled={idx === temoignages.length - 1 || pending}
                    className="w-8 h-8 flex items-center justify-center border border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary disabled:opacity-25 transition-colors"
                    aria-label="Descendre"
                  >
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                      <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>

                {/* Thumbnail */}
                {t.photo_url && !t.video_url ? (
                  <img src={t.photo_url} alt={t.nom} className="w-16 h-16 object-cover shrink-0" />
                ) : t.video_url ? (
                  <div className="w-16 h-16 shrink-0 bg-surface-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl text-primary/60" style={{ fontVariationSettings: "'FILL' 1, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>play_circle</span>
                  </div>
                ) : (
                  <div className="w-16 h-16 shrink-0 bg-surface-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl text-on-surface-variant/30">person</span>
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-sm text-on-surface" style={{ fontFamily: 'var(--font-hanken)' }}>{t.nom}</p>
                      {t.role && <p className="text-xs text-on-surface-variant" style={{ fontFamily: 'var(--font-hanken)' }}>{t.role}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <VideoTypeLabel type={t.video_type} />
                      <div className="flex text-primary">
                        {[...Array(5)].map((_, j) => (
                          <span key={j} className={`material-symbols-outlined text-[14px] ${j >= t.note ? 'opacity-20' : ''}`}
                            style={{ fontVariationSettings: "'FILL' 1, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>
                            star
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-2 line-clamp-2" style={{ fontFamily: 'var(--font-hanken)', fontWeight: 300 }}>
                    {t.texte}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => setEditingId(t.id)}
                    className="px-3 py-2 text-[9px] uppercase tracking-widest border border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary transition-colors"
                    style={{ fontFamily: 'var(--font-hanken)' }}
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    disabled={pending}
                    className="px-3 py-2 text-[9px] uppercase tracking-widest border border-error/30 text-error/70 hover:border-error hover:text-error transition-colors disabled:opacity-40"
                    style={{ fontFamily: 'var(--font-hanken)' }}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
