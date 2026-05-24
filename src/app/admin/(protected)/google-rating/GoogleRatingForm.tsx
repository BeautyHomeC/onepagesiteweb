'use client'

import { useState, useTransition } from 'react'
import { updateGoogleRating } from './actions'

interface Props {
  current: { note: number; nb_avis: number; google_url: string }
}

export default function GoogleRatingForm({ current }: Props) {
  const [note, setNote] = useState(String(current.note))
  const [nbAvis, setNbAvis] = useState(String(current.nb_avis))
  const [url, setUrl] = useState(current.google_url)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('saving')
    const fd = new FormData()
    fd.set('note', note)
    fd.set('nb_avis', nbAvis)
    fd.set('google_url', url)

    startTransition(async () => {
      const result = await updateGoogleRating(fd)
      if (result?.error) {
        setErrorMsg(result.error)
        setStatus('error')
        setTimeout(() => setStatus('idle'), 4000)
      } else {
        setStatus('saved')
        setTimeout(() => setStatus('idle'), 3000)
      }
    })
  }

  const inputClass = "w-full border border-surface-container-highest bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary"

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      <div>
        <label htmlFor="note" className="block text-sm font-medium text-on-surface mb-1">
          Note (ex : 4.9)
        </label>
        <input
          id="note"
          type="number"
          step="0.1"
          min="0"
          max="5"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={inputClass}
          required
        />
      </div>

      <div>
        <label htmlFor="nb_avis" className="block text-sm font-medium text-on-surface mb-1">
          Nombre d'avis
        </label>
        <input
          id="nb_avis"
          type="number"
          min="0"
          value={nbAvis}
          onChange={(e) => setNbAvis(e.target.value)}
          className={inputClass}
          required
        />
      </div>

      <div>
        <label htmlFor="google_url" className="block text-sm font-medium text-on-surface mb-1">
          URL Google Maps (lien vers votre fiche)
        </label>
        <input
          id="google_url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://maps.google.com/..."
          className={inputClass}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs">
          {status === 'saved' && <span className="text-green-700">✓ Enregistré</span>}
          {status === 'error' && <span className="text-red-600">{errorMsg}</span>}
        </div>
        <button
          type="submit"
          disabled={isPending || status === 'saving'}
          className="bg-primary text-on-primary px-5 py-2 text-xs font-label-caps tracking-widest uppercase hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {status === 'saving' ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </form>
  )
}
