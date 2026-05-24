'use client'

import { useState, useTransition } from 'react'
import { markAsRead } from './actions'

interface Message {
  id: string
  prenom: string
  nom: string
  email: string
  message: string
  lu: boolean
  created_at: string
}

export default function MessagesView({ messages }: { messages: Message[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const toggle = (id: string, lu: boolean) => {
    setExpanded((prev) => (prev === id ? null : id))
    if (!lu) {
      startTransition(() => markAsRead(id))
    }
  }

  if (messages.length === 0) {
    return (
      <p className="text-on-surface-variant text-sm italic py-12 text-center">
        Aucun message reçu pour l'instant.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {messages.map((m) => (
        <div
          key={m.id}
          className={`bg-surface border border-surface-container-highest ${!m.lu ? 'border-l-2 border-l-primary' : ''}`}
        >
          <button
            onClick={() => toggle(m.id, m.lu)}
            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-surface-container transition-colors"
          >
            <div className="flex items-center gap-4">
              {!m.lu && (
                <span className="w-2 h-2 bg-primary flex-shrink-0" aria-label="Non lu" />
              )}
              <div>
                <span className="font-medium text-sm text-on-surface">
                  {m.prenom} {m.nom}
                </span>
                <span className="text-on-surface-variant text-xs ml-3">{m.email}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <span className="text-xs text-on-surface-variant">
                {new Date(m.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20" }}>
                {expanded === m.id ? 'expand_less' : 'expand_more'}
              </span>
            </div>
          </button>
          {expanded === m.id && (
            <div className="px-6 pb-6 border-t border-surface-container-highest">
              <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap pt-4">
                {m.message}
              </p>
              <a
                href={`mailto:${m.email}`}
                className="inline-block mt-4 bg-primary text-on-primary px-5 py-2 text-xs font-label-caps tracking-widest uppercase hover:opacity-90 transition-opacity"
              >
                Répondre par email
              </a>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
