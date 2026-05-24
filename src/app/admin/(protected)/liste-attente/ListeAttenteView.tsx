'use client'

import { useState, useTransition } from 'react'

interface Entry {
  id: string
  prenom: string
  nom: string
  email: string
  created_at: string
  notified_at: string | null
}

interface Group {
  session: { id: string; date_debut: string; date_fin: string; places_disponibles: number }
  formation: { id: string; titre: string }
  entries: Entry[]
}

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function NotifyButton({ reservationId, onDone }: { reservationId?: string; onDone: (count: number) => void }) {
  // This triggers cancel on a reservation to free a spot + notify waitlist
  // For manual "notify all" without a reservation, we use the direct notify action
  return null
}

export default function ListeAttenteView({ groups }: { groups: Group[] }) {
  const [pending, startTransition] = useTransition()
  const [notifications, setNotifications] = useState<Record<string, string>>({})

  const sendNotification = (sessionId: string, entryId: string, prenom: string, email: string) => {
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/waitlist/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entry_id: entryId }),
        })
        const json = await res.json()
        if (res.ok) {
          setNotifications((prev) => ({ ...prev, [entryId]: 'Envoyé ✓' }))
        } else {
          setNotifications((prev) => ({ ...prev, [entryId]: json.error ?? 'Erreur' }))
        }
      } catch {
        setNotifications((prev) => ({ ...prev, [entryId]: 'Erreur réseau' }))
      }
    })
  }

  if (groups.length === 0) {
    return (
      <div className="bg-surface border border-surface-container-highest p-10 text-center">
        <p className="text-on-surface-variant italic text-sm">Aucune personne en liste d'attente pour le moment.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {groups.map(({ session, formation, entries }) => {
        const debut   = fmt(session.date_debut)
        const fin     = fmt(session.date_fin)
        const sameDay = debut === fin
        const dateLabel = sameDay ? `le ${debut}` : `du ${debut} au ${fin}`
        const unnotified = entries.filter((e) => !e.notified_at).length

        return (
          <div key={session.id} className="bg-surface border border-surface-container-highest overflow-hidden">
            {/* Session header */}
            <div className="px-6 py-4 border-b border-surface-container-highest flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-lowest">
              <div>
                <p className="font-playfair text-lg text-on-surface">{formation.titre}</p>
                <p className="text-xs text-on-surface-variant uppercase tracking-widest mt-0.5" style={{ fontFamily: 'var(--font-hanken)' }}>
                  {dateLabel} · {session.places_disponibles} place{session.places_disponibles !== 1 ? 's' : ''} disponible{session.places_disponibles !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] uppercase tracking-widest px-3 py-1.5 bg-surface-container text-on-surface-variant" style={{ fontFamily: 'var(--font-hanken)' }}>
                  {entries.length} en attente
                </span>
                {unnotified > 0 && (
                  <span className="text-[10px] uppercase tracking-widest px-3 py-1.5 bg-primary/10 text-primary" style={{ fontFamily: 'var(--font-hanken)' }}>
                    {unnotified} non notifié{unnotified > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Entries table */}
            <div className="divide-y divide-surface-container-highest">
              {entries.map((entry, idx) => (
                <div key={entry.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-container-lowest transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] text-on-surface-variant/50 w-5 shrink-0" style={{ fontFamily: 'var(--font-hanken)' }}>
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm text-on-surface font-medium" style={{ fontFamily: 'var(--font-hanken)' }}>
                        {entry.prenom} {entry.nom}
                      </p>
                      <p className="text-xs text-on-surface-variant" style={{ fontFamily: 'var(--font-hanken)' }}>
                        {entry.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 ml-9 sm:ml-0">
                    <div className="text-right">
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-wider" style={{ fontFamily: 'var(--font-hanken)' }}>
                        Inscrit le {fmt(entry.created_at)}
                      </p>
                      {entry.notified_at && (
                        <p className="text-[10px] text-primary uppercase tracking-wider" style={{ fontFamily: 'var(--font-hanken)' }}>
                          Notifié le {fmt(entry.notified_at)}
                        </p>
                      )}
                    </div>

                    {notifications[entry.id] ? (
                      <span className="text-[10px] text-primary uppercase tracking-widest" style={{ fontFamily: 'var(--font-hanken)' }}>
                        {notifications[entry.id]}
                      </span>
                    ) : (
                      <button
                        onClick={() => sendNotification(session.id, entry.id, entry.prenom, entry.email)}
                        disabled={pending || !!entry.notified_at}
                        className="px-3 py-2 text-[9px] uppercase tracking-widest border border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary disabled:opacity-30 transition-colors whitespace-nowrap"
                        style={{ fontFamily: 'var(--font-hanken)' }}
                        title={entry.notified_at ? 'Déjà notifié' : 'Envoyer un email de notification'}
                      >
                        {entry.notified_at ? 'Notifié ✓' : 'Notifier'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
