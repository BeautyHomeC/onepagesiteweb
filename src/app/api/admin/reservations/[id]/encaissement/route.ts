import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import Stripe from 'stripe'
import FinalInvoiceEmail from '@/emails/FinalInvoiceEmail'
import { revalidatePath } from 'next/cache'

interface Params {
  params: Promise<{ id: string }>
}

export async function POST(req: Request, { params }: Params) {
  // Auth check — admin only
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: reservationId } = await params

  const body = await req.json()
  const { methods, useStripe } = body as {
    methods?: Array<{ label: string; amount: number }>
    useStripe?: boolean
  }

  const supabaseAdmin = await createAdminClient()

  // Fetch full reservation data
  const { data: reservation, error } = await supabaseAdmin
    .from('reservations')
    .select(`
      id, prenom, nom, nom_client, email_client,
      telephone, telephone_client, adresse, client_type, raison_sociale, siret,
      acompte_amount, acompte_paid_at, stripe_payment_id, solde_paid_at,
      sessions (
        date_debut, date_fin,
        formations ( titre, prix )
      )
    `)
    .eq('id', reservationId)
    .single()

  if (error || !reservation) {
    return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 })
  }

  if (reservation.solde_paid_at) {
    return NextResponse.json({ error: 'Le solde de cette réservation est déjà encaissé.' }, { status: 400 })
  }

  const formation: any = (reservation as any).sessions?.formations
  const sessionRow: any = (reservation as any).sessions
  const dateDebut = new Date(sessionRow?.date_debut ?? Date.now()).toLocaleDateString('fr-FR')
  const dateFin = new Date(sessionRow?.date_fin ?? Date.now()).toLocaleDateString('fr-FR')
  const dateSession = dateDebut === dateFin ? `le ${dateDebut}` : `du ${dateDebut} au ${dateFin}`
  const formationTitre = formation?.titre ?? 'Formation'
  const prixTotal = formation?.prix ?? 0
  const acompte = reservation.acompte_amount ?? 0
  const solde = Math.max(0, prixTotal - acompte)
  const nomComplet = (`${reservation.prenom ?? ''} ${reservation.nom ?? ''}`.trim() || reservation.nom_client) ?? 'client'

  // ── STRIPE ONLINE MODE ──────────────────────────────────────────────────
  if (useStripe) {
    if (solde <= 0) {
      return NextResponse.json({ error: 'Aucun solde à encaisser.' }, { status: 400 })
    }
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-04-22.dahlia' })
    const siteOrigin = new URL(req.url).origin

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Solde formation — ${formationTitre}`,
            description: `Session ${dateSession} — Règlement du solde final`,
          },
          unit_amount: Math.round(solde * 100),
        },
        quantity: 1,
      }],
      metadata: {
        reservation_id: reservationId,
        is_final_payment: 'true',
        formation_titre: formationTitre,
      },
      customer_email: reservation.email_client ?? undefined,
      success_url: `${siteOrigin}/admin/facturation?stripe_success=1`,
      cancel_url: `${siteOrigin}/admin/facturation`,
    })

    await supabaseAdmin
      .from('reservations')
      .update({ stripe_solde_session_id: checkoutSession.id })
      .eq('id', reservationId)

    return NextResponse.json({ stripeUrl: checkoutSession.url })
  }

  // ── MANUAL PAYMENT MODE ─────────────────────────────────────────────────
  if (!methods || methods.length === 0) {
    return NextResponse.json({ error: 'Modes de paiement requis' }, { status: 400 })
  }

  const totalPaid = methods.reduce((sum, m) => sum + m.amount, 0)
  if (Math.abs(totalPaid - solde) > 0.5) {
    return NextResponse.json({
      error: `Total des paiements (${totalPaid} €) ne correspond pas au solde (${solde} €)`,
    }, { status: 400 })
  }

  const soldePaymentMethod = methods.map(m => m.label).join(' + ')
  const soldePaidAt = new Date().toISOString()

  // Generate final invoice PDF
  let facturePdfBuffer: Buffer | null = null
  let facturePath: string | null = null

  try {
    const { generateFactureFinaleHTML } = await import('@/lib/contract/facture-finale')
    const { generatePDFFromHtml } = await import('@/lib/contract/pdf')

    const factureHtml = generateFactureFinaleHTML({
      prenom: reservation.prenom ?? '',
      nom: reservation.nom ?? '',
      email: reservation.email_client ?? '',
      telephone: reservation.telephone ?? reservation.telephone_client ?? '',
      adresse: reservation.adresse ?? '',
      clientType: (reservation.client_type ?? 'particulier') as 'particulier' | 'pro',
      raisonSociale: reservation.raison_sociale ?? undefined,
      siret: reservation.siret ?? undefined,
      formationTitre,
      dateSession,
      prixTotal,
      acompte,
      acompteStripeId: reservation.stripe_payment_id ?? reservationId,
      acomptePaidAt: reservation.acompte_paid_at ?? soldePaidAt,
      solde,
      soldePaidAt,
      soldePaymentMethod,
    })

    facturePdfBuffer = await generatePDFFromHtml(factureHtml)

    // Upload to Storage (contracts bucket, alongside the signed contract)
    const { error: uploadError } = await supabaseAdmin.storage
      .from('contracts')
      .upload(`${reservationId}/facture-finale.pdf`, facturePdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (!uploadError) {
      facturePath = `${reservationId}/facture-finale.pdf`
    } else {
      console.error('[encaissement] Storage upload error:', uploadError)
    }
  } catch (e) {
    console.error('[encaissement] PDF generation error:', e)
    // Continue even if PDF fails — update DB and try to send email
  }

  // Update reservation
  await supabaseAdmin
    .from('reservations')
    .update({
      solde_paid_at: soldePaidAt,
      solde_payment_method: soldePaymentMethod,
      ...(facturePath ? { facture_finale_url: facturePath } : {}),
    })
    .eq('id', reservationId)

  // Send email with invoice PDF
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const attachments: Array<{ filename: string; content: string }> = []

    if (facturePdfBuffer) {
      attachments.push({
        filename: `Facture_solde_${nomComplet.replace(/\s+/g, '_')}.pdf`,
        content: facturePdfBuffer.toString('base64'),
      })
    }

    await resend.emails.send({
      from: 'Beauty Home Concept <contact@beautyhomeconcept.fr>',
      to: [reservation.email_client!],
      subject: `Paiement complet — ${formationTitre}`,
      react: FinalInvoiceEmail({
        nomClient: nomComplet,
        prenom: reservation.prenom ?? nomComplet.split(' ')[0],
        formationTitre,
        dateSession,
        prixTotal,
        acompte,
        solde,
        soldePaymentMethod,
      }),
      attachments,
    })
  } catch (e) {
    console.error('[encaissement] Email send error:', e)
    // Don't fail the whole request if email fails
  }

  revalidatePath('/admin/facturation')
  revalidatePath('/admin')

  return NextResponse.json({ done: true })
}
