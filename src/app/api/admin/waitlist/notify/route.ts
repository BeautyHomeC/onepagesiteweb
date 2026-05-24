import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import WaitlistEmail from '@/emails/WaitlistEmail'

export async function POST(req: Request) {
  try {
    const { entry_id } = await req.json()
    if (!entry_id) return NextResponse.json({ error: 'entry_id requis' }, { status: 400 })

    const supabase = await createAdminClient()

    const { data: entry, error: fetchErr } = await supabase
      .from('liste_attente')
      .select(`
        id, prenom, nom, email, notified_at,
        sessions (
          id, date_debut, date_fin,
          formations ( id, titre )
        )
      `)
      .eq('id', entry_id)
      .single()

    if (fetchErr || !entry) {
      return NextResponse.json({ error: 'Entrée introuvable.' }, { status: 404 })
    }

    const session   = (entry as any).sessions
    const formation = session?.formations
    const siteUrl   = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin

    const dateDebut   = new Date(session.date_debut).toLocaleDateString('fr-FR')
    const dateFin     = new Date(session.date_fin).toLocaleDateString('fr-FR')
    const dateSession = dateDebut === dateFin ? `le ${dateDebut}` : `du ${dateDebut} au ${dateFin}`
    const bookingUrl  = `${siteUrl}/formations/${formation.id}`

    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'Beauty Home Concept <contact@beautyhomeconcept.fr>',
      to: [entry.email],
      subject: `Une place est disponible — ${formation.titre}`,
      react: WaitlistEmail({
        prenom: entry.prenom,
        formationTitre: formation.titre,
        dateSession,
        bookingUrl,
      }),
    })

    await supabase
      .from('liste_attente')
      .update({ notified_at: new Date().toISOString() })
      .eq('id', entry_id)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[waitlist/notify]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
