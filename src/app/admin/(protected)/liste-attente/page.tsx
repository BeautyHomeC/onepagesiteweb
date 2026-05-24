import { createAdminClient } from '@/lib/supabase/server'
import ListeAttenteView from './ListeAttenteView'

export default async function ListeAttentePage() {
  const supabase = await createAdminClient()

  // Fetch waitlist entries with session + formation info
  const { data: entries } = await supabase
    .from('liste_attente')
    .select(`
      id, prenom, nom, email, created_at, notified_at,
      sessions (
        id, date_debut, date_fin, places_disponibles,
        formations ( id, titre )
      )
    `)
    .order('created_at', { ascending: true })

  // Group by session
  const bySession = new Map<string, { session: any; formation: any; entries: any[] }>()
  for (const entry of (entries ?? [])) {
    const session = (entry as any).sessions
    if (!session) continue
    const sid = session.id
    if (!bySession.has(sid)) {
      bySession.set(sid, {
        session,
        formation: session.formations,
        entries: [],
      })
    }
    bySession.get(sid)!.entries.push(entry)
  }

  const groups = Array.from(bySession.values())

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-playfair text-3xl text-on-surface mb-2">Liste d'attente</h2>
        <p className="text-on-surface-variant text-sm">
          Personnes en attente d'une place. Les notifications sont envoyées automatiquement lors d'une annulation.
        </p>
      </div>

      <ListeAttenteView groups={groups} />
    </div>
  )
}
