import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { readFileSync } from 'fs'
import { join } from 'path'
import ConfirmationEmail from '@/emails/ConfirmationEmail'
import AdminNotificationEmail from '@/emails/AdminNotificationEmail'

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-04-22.dahlia' })
  const resend = new Resend(process.env.RESEND_API_KEY)

  const payload = await req.text()
  const signature = req.headers.get('stripe-signature')
  if (!signature) return NextResponse.json({ error: 'No signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') return NextResponse.json({ received: true })

  const session = event.data.object as Stripe.Checkout.Session
  const reservationId = session.metadata?.reservation_id
  const supabaseSessionId = session.metadata?.supabase_session_id
  if (!reservationId) {
    console.error('reservation_id manquant dans metadata')
    return NextResponse.json({ received: true })
  }

  const supabase = await createAdminClient()

  // Idempotence
  const { data: existing } = await supabase
    .from('reservations')
    .select('statut')
    .eq('id', reservationId)
    .single()
  if (existing?.statut === 'confirmee') return NextResponse.json({ received: true })

  const stripeId = (session.payment_intent as string) || session.id
  const acompteAmount = Math.round((session.amount_total ?? 0) / 100)

  // Update reservation to confirmee
  const { data: reservation, error: updateError } = await supabase
    .from('reservations')
    .update({
      statut: 'confirmee',
      stripe_payment_id: stripeId,
      acompte_amount: acompteAmount,
      acompte_paid_at: new Date().toISOString(),
    })
    .eq('id', reservationId)
    .select('*, sessions(date_debut, date_fin, formations(titre, prix, duree_formation, programme_pdf_url))')
    .single()

  if (updateError || !reservation) {
    console.error('Erreur update reservation:', updateError)
    return NextResponse.json({ received: true })
  }

  // Decrement available spots
  const { error: rpcError } = await supabase.rpc('decrement_places', { session_id: supabaseSessionId })
  if (rpcError) {
    const { data: sess } = await supabase
      .from('sessions')
      .select('places_disponibles')
      .eq('id', supabaseSessionId)
      .single()
    if (sess) {
      await supabase
        .from('sessions')
        .update({ places_disponibles: Math.max(0, sess.places_disponibles - 1) })
        .eq('id', supabaseSessionId)
    }
  }

  // Move PDF in Storage from temp path to reservation_id path
  const oldPath = reservation.contrat_signe_url as string | null
  const newPath = `${reservationId}/contrat-signe.pdf`
  let contratFinalPath = oldPath
  if (oldPath && oldPath !== newPath) {
    try {
      await supabase.storage.from('contracts').move(oldPath, newPath)
      await supabase.from('reservations').update({ contrat_signe_url: newPath }).eq('id', reservationId)
      contratFinalPath = newPath
    } catch (e) { console.error('Erreur move PDF:', e) }
  }

  try {
    const formation: any = (reservation as any).sessions?.formations
    const sessionRow: any = (reservation as any).sessions
    const dateDebut = new Date(sessionRow?.date_debut ?? Date.now()).toLocaleDateString('fr-FR')
    const dateFin   = new Date(sessionRow?.date_fin   ?? Date.now()).toLocaleDateString('fr-FR')
    const dateSession = dateDebut === dateFin ? `le ${dateDebut}` : `du ${dateDebut} au ${dateFin}`
    const formationTitre = formation?.titre ?? session.metadata?.formation_titre ?? 'Formation'
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin

    // Stripe invoice
    let invoiceUrl: string | null = null
    let invoicePdfBase64: string | null = null
    if (session.invoice) {
      try {
        const invoice = await stripe.invoices.retrieve(session.invoice as string)
        invoiceUrl = invoice.hosted_invoice_url ?? null
        if (invoice.invoice_pdf) {
          const r = await fetch(invoice.invoice_pdf)
          if (r.ok) invoicePdfBase64 = Buffer.from(await r.arrayBuffer()).toString('base64')
        }
      } catch (e) { console.error('Facture Stripe:', e) }
    }

    // Signed contract from Storage
    let contratBase64: string | null = null
    if (contratFinalPath) {
      try {
        const { data: signedUrl } = await supabase.storage
          .from('contracts')
          .createSignedUrl(contratFinalPath, 3600)
        if (signedUrl?.signedUrl) {
          const r = await fetch(signedUrl.signedUrl)
          if (r.ok) contratBase64 = Buffer.from(await r.arrayBuffer()).toString('base64')
        }
      } catch (e) { console.error('Récup contrat signé:', e) }
    }

    // Règlement intérieur — généré depuis le template HTML et mis en cache dans Supabase Storage
    let reglementBase64: string | null = null
    try {
      // v2 = cache key bumped to force regeneration after toolbar-stripping fix
      const REGLEMENT_STORAGE_PATH = 'reglement/reglement-interieur-v2.pdf'

      // 1. Essayer le cache Supabase Storage
      const { data: cachedBlob, error: cacheErr } = await supabase.storage
        .from('contracts')
        .download(REGLEMENT_STORAGE_PATH)

      if (!cacheErr && cachedBlob) {
        reglementBase64 = Buffer.from(await cachedBlob.arrayBuffer()).toString('base64')
      } else {
        // 2. Générer depuis le template HTML avec Puppeteer
        const { existsSync } = await import('fs')
        const { generatePDFFromHtml } = await import('@/lib/contract/pdf')

        const templatesDir = join(process.cwd(), 'public', 'templates')
        const htmlPath = join(templatesDir, 'reglement-interieur.html')

        if (existsSync(htmlPath)) {
          let rawHtml = readFileSync(htmlPath, 'utf-8')

          // Remplacer les assets relatifs par des data URIs base64
          const MIME: Record<string, string> = {
            png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
            gif: 'image/gif', svg: 'image/svg+xml', webp: 'image/webp',
          }
          rawHtml = rawHtml.replace(/src="(assets\/[^"]+)"/g, (_match, assetPath: string) => {
            const filePath = join(templatesDir, assetPath)
            if (!existsSync(filePath)) return _match
            try {
              const data = readFileSync(filePath)
              const ext  = (assetPath.split('.').pop() ?? '').toLowerCase()
              const mime = MIME[ext] ?? 'application/octet-stream'
              return `src="data:${mime};base64,${data.toString('base64')}"`
            } catch { return _match }
          })

          // Masquer la barre d'outils (bouton "Imprimer") qui ne doit pas apparaître dans le PDF
          rawHtml = rawHtml.replace(
            '</head>',
            '<style>.toolbar,.no-print,[class*="toolbar"]{display:none!important;visibility:hidden!important;}</style></head>'
          )

          const pdfBuffer = await generatePDFFromHtml(rawHtml)
          reglementBase64 = pdfBuffer.toString('base64')

          // 3. Mettre en cache dans Supabase Storage pour les prochains appels
          await supabase.storage
            .from('contracts')
            .upload(REGLEMENT_STORAGE_PATH, pdfBuffer, {
              contentType: 'application/pdf',
              upsert: true,
            })
        }
      }
    } catch (e) {
      console.error('Règlement intérieur (ignoré):', e)
    }

    // Livret d'accueil from parametres_admin
    let livretBase64: string | null = null
    try {
      const { data: param } = await supabase
        .from('parametres_admin')
        .select('valeur')
        .eq('cle', 'livret_accueil_url')
        .single()
      if (param?.valeur) {
        const r = await fetch(param.valeur)
        if (r.ok) livretBase64 = Buffer.from(await r.arrayBuffer()).toString('base64')
      }
    } catch (e) { console.error('Livret accueil:', e) }

    // Programme PDF
    let programmeBase64: string | null = null
    const programmeUrl = formation?.programme_pdf_url
    if (programmeUrl) {
      try {
        const r = await fetch(programmeUrl)
        if (r.ok) programmeBase64 = Buffer.from(await r.arrayBuffer()).toString('base64')
      } catch (e) { console.error('Programme PDF:', e) }
    }

    // Fiche inscription PDF
    const { generateFichePDF } = await import('@/lib/contract/pdf')
    const ficheBuffer = await generateFichePDF({
      prenom: reservation.prenom ?? '',
      nom: reservation.nom ?? '',
      email: reservation.email_client ?? '',
      telephone: reservation.telephone ?? reservation.telephone_client ?? '',
      adresse: reservation.adresse ?? '',
      client_type: (reservation.client_type ?? 'particulier') as 'particulier' | 'pro',
      raison_sociale: reservation.raison_sociale ?? undefined,
      siret: reservation.siret ?? undefined,
      instagram: reservation.instagram ?? undefined,
      formation_titre: formationTitre,
      date_session: dateSession,
      acompte: acompteAmount,
      created_at: new Date().toISOString(),
    })
    const ficheBase64 = ficheBuffer.toString('base64')

    const docLabel = reservation.client_type === 'pro' ? 'Convention' : 'Contrat'
    const nomComplet = (`${reservation.prenom ?? ''} ${reservation.nom ?? ''}`.trim()
      || reservation.nom_client) ?? ''

    // Client email attachments
    const clientAttachments: Array<{ filename: string; content: string }> = []
    if (contratBase64) {
      clientAttachments.push({
        filename: `${docLabel}_${formationTitre.replace(/\s+/g, '_')}.pdf`,
        content: contratBase64,
      })
    }
    if (reglementBase64) clientAttachments.push({ filename: 'Reglement_Interieur.pdf', content: reglementBase64 })
    if (programmeBase64) {
      clientAttachments.push({
        filename: `Programme_${formationTitre.replace(/\s+/g, '_')}.pdf`,
        content: programmeBase64,
      })
    }
    if (livretBase64) clientAttachments.push({ filename: 'Livret_Accueil.pdf', content: livretBase64 })
    if (invoicePdfBase64) clientAttachments.push({ filename: 'Facture_acompte.pdf', content: invoicePdfBase64 })

    const clientEmailResult = await resend.emails.send({
      from: 'Beauty Home Concept <contact@beautyhomeconcept.fr>',
      to: [reservation.email_client!],
      subject: `Votre inscription est confirmée — ${formationTitre}`,
      react: ConfirmationEmail({
        nomClient: nomComplet,
        prenom: reservation.prenom ?? nomComplet.split(' ')[0],
        formationTitre,
        dateSession,
        acompte: acompteAmount,
        solde: Math.round((formation?.prix ?? 0) * 0.7),
        invoiceUrl,
        clientType: (reservation.client_type ?? 'particulier') as 'particulier' | 'pro',
      }),
      attachments: clientAttachments,
    })
    console.log('[stripe-webhook] email client:', JSON.stringify(clientEmailResult))

    // Admin email
    const adminAttachments: Array<{ filename: string; content: string }> = [
      { filename: 'Fiche_Inscription.pdf', content: ficheBase64 },
    ]
    if (contratBase64) {
      adminAttachments.push({
        filename: `${docLabel}_${nomComplet.replace(/\s+/g, '_')}.pdf`,
        content: contratBase64,
      })
    }

    const adminEmailResult = await resend.emails.send({
      from: 'Beauty Home Concept <contact@beautyhomeconcept.fr>',
      to: ['beautyhomeconcept@gmail.com'],
      subject: `Nouvelle inscription — ${nomComplet} · ${formationTitre}`,
      react: AdminNotificationEmail({
        nomClient: nomComplet,
        emailClient: reservation.email_client!,
        telephoneClient: reservation.telephone ?? reservation.telephone_client ?? '',
        adresse: reservation.adresse ?? '',
        clientType: (reservation.client_type ?? 'particulier') as 'particulier' | 'pro',
        raisonSociale: reservation.raison_sociale ?? undefined,
        siret: reservation.siret ?? undefined,
        instagram: reservation.instagram ?? undefined,
        formationTitre,
        dateSession,
        acompte: acompteAmount,
        reservationId,
        siteUrl,
      }),
      attachments: adminAttachments,
    })
    console.log('[stripe-webhook] email admin:', JSON.stringify(adminEmailResult))
  } catch (err) {
    console.error('[stripe-webhook] Erreur email/PDF:', err)
  }

  return NextResponse.json({ received: true })
}
