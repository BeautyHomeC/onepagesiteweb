import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import WaitlistEmail from '@/emails/WaitlistEmail'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reservationId } = await params
    const supabase = await createAdminClient()

    // Fetch reservation with session + formation
    const { data: reservation, error: fetchErr } = await supabase
      .from('reservations')
      .select(`
        id, statut, session_id,
        sessions (
          id, places_disponibles, date_debut, date_fin,
          formations ( id, titre )
        )
      `)
      .eq('id', reservationId)
      .single()

    if (fetchErr || !reservation) {
      return NextResponse.json({ error: 'Réservation introuvable.' }, { status: 404 })
    }

    const sessionRow = (reservation as any).sessions
    const formation  = sessionRow?.formations

    // Cancel the reservation
    const { error: cancelErr } = await supabase
      .from('reservations')
      .update({ statut: 'annulee' })
      .eq('id', reservationId)

    if (cancelErr) {
      return NextResponse.json({ error: cancelErr.message }, { status: 500 })
    }

    // Increment places_disponibles
    const newPlaces = (sessionRow?.places_disponibles ?? 0) + 1
    await supabase
      .from('sessions')
      .update({ places_disponibles: newPlaces })
      .eq('id', sessionRow.id)

    // Notify unnotified waitlist entries
    const { data: waitlist } = await supabase
      .from('liste_attente')
      .select('id, prenom, nom, email')
      .eq('session_id', sessionRow.id)
      .is('notified_at', null)
      .order('created_at', { ascending: true })

    if (waitlist && waitlist.length > 0) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin

      const dateDebut = new Date(sessionRow.date_debut).toLocaleDateString('fr-FR')
      const dateFin   = new Date(sessionRow.date_fin).toLocaleDateString('fr-FR')
      const dateSession = dateDebut === dateFin ? `le ${dateDebut}` : `du ${dateDebut} au ${dateFin}`
      const bookingUrl = `${siteUrl}/formations/${formation.id}`

      const notifiedIds: string[] = []
      for (const entry of waitlist) {
        try {
          await resend.emails.send({
            from: 'Beauty Home Concept <contact@beautyhomeconcept.fr>',
            to: [entry.email],
            subject: `Une place s'est libérée — ${formation.titre}`,
            react: WaitlistEmail({
              prenom: entry.prenom,
              formationTitre: formation.titre,
              dateSession,
              bookingUrl,
            }),
          })
          notifiedIds.push(entry.id)
        } catch (emailErr) {
          console.error('[cancel] email error for', entry.email, emailErr)
        }
      }

      // Mark as notified
      if (notifiedIds.length > 0) {
        await supabase
          .from('liste_attente')
          .update({ notified_at: new Date().toISOString() })
          .in('id', notifiedIds)
      }

      return NextResponse.json({
        success: true,
        notified: notifiedIds.length,
      })
    }

    return NextResponse.json({ success: true, notified: 0 })
  } catch (err: any) {
    console.error('[cancel]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
