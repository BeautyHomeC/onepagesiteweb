import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import { createAdminClient } from '@/lib/supabase/server'
import { renderTemplate, buildTemplateVarsV2 } from '@/lib/contract/template'
import type { SignatureData } from '@/lib/contract/pdf'
import { generatePDFFromHtml } from '@/lib/contract/pdf'
import { randomUUID } from 'crypto'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      formation_id, session_id, client_type,
      prenom, nom, adresse, email, telephone,
      raison_sociale, siret, instagram,
      signature_data, rgpd_consent,
    }: {
      formation_id: string
      session_id: string
      client_type: 'particulier' | 'pro'
      template_version?: number
      prenom: string; nom: string; adresse: string
      email: string; telephone: string
      raison_sociale?: string; siret?: string; instagram?: string
      signature_data: SignatureData
      rgpd_consent: boolean
    } = body

    if (!rgpd_consent) {
      return NextResponse.json({ error: 'Consentement RGPD requis' }, { status: 400 })
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || 'IP non disponible'

    const signatureWithIp: SignatureData = {
      ...signature_data,
      ip,
      userAgent: req.headers.get('user-agent') ?? '',
    }

    const supabase = await createAdminClient()

    // Build signature HTML to inject (base64 image or typed name)
    const signatureHtml = signature_data.type === 'draw'
      ? `<img src="${signature_data.valeur}" alt="Signature" style="max-height:60px;max-width:200px;">`
      : `<span style="font-family:'Playfair Display',serif;font-style:italic;font-size:18px;color:#1b1c1c;">${signature_data.valeur}</span>`

    // ── Static HTML template (always used) ──────────────────────────────────
    const filename = client_type === 'pro' ? 'convention-pro.html' : 'contrat-particulier.html'
    const tplPath  = join(process.cwd(), 'public', 'templates', filename)

    let rawHtml: string
    try {
      rawHtml = readFileSync(tplPath, 'utf-8')
    } catch {
      return NextResponse.json({ error: `Template "${filename}" introuvable.` }, { status: 404 })
    }

    const { data: sessionData } = await supabase
      .from('sessions')
      .select('date_debut, date_fin, formations(titre, prix, duree_formation, horaire)')
      .eq('id', session_id)
      .maybeSingle()

    const formation = (sessionData as any)?.formations

    const vars = buildTemplateVarsV2({
      prenom, nom, adresse, email, telephone,
      siret, instagram,
      formation_titre:     formation?.titre           ?? '',
      date_debut:          sessionData?.date_debut    ?? new Date().toISOString(),
      date_fin:            sessionData?.date_fin      ?? new Date().toISOString(),
      duree_formation:     formation?.duree_formation ?? '',
      horaire:             formation?.horaire         ?? '',
      prix:                formation?.prix            ?? 0,
      signature_stagiaire: signatureHtml,
      signature_organisme: '',
    })

    const renderedHtml = renderTemplate(rawHtml, vars)

    // ── Generate PDF via Puppeteer ───────────────────────────────────────────
    const pdfBuffer = await generatePDFFromHtml(renderedHtml)

    const tempUuid    = randomUUID()
    const storagePath = `${tempUuid}/contrat-signe.pdf`

    const { error: uploadError } = await supabase.storage
      .from('contracts')
      .upload(storagePath, pdfBuffer, { contentType: 'application/pdf', upsert: false })

    if (uploadError) {
      console.error('Storage upload error:', uploadError.message)
      return NextResponse.json({ error: `Erreur upload contrat: ${uploadError.message}` }, { status: 500 })
    }

    // ── Create reservation ───────────────────────────────────────────────────
    const { data: sessionMeta } = await supabase
      .from('sessions')
      .select('formations(prix)')
      .eq('id', session_id)
      .maybeSingle()

    const prix = (sessionMeta as any)?.formations?.prix ?? 0

    const { data: reservation, error: insertError } = await supabase
      .from('reservations')
      .insert({
        session_id,
        prenom,
        nom,
        email_client:        email,
        nom_client:          `${prenom} ${nom}`,
        telephone_client:    telephone,
        telephone,
        adresse,
        client_type,
        raison_sociale:      raison_sociale ?? null,
        siret:               siret          ?? null,
        instagram:           instagram      ?? null,
        contrat_signe_url:   storagePath,
        contrat_version:     1,
        signature_data:      signatureWithIp,
        statut:              'en_attente_paiement',
        rgpd_consent_at:     new Date().toISOString(),
      })
      .select('id')
      .single()

    if (insertError || !reservation) {
      console.error('Erreur insertion reservation:', insertError)
      return NextResponse.json({ error: 'Erreur création réservation' }, { status: 500 })
    }

    return NextResponse.json({
      reservation_id: reservation.id,
      temp_uuid:      tempUuid,
      contrat_url:    storagePath,
    })
  } catch (err: any) {
    console.error('contract/sign error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
