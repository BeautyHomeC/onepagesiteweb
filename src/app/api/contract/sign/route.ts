import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { renderTemplate, buildTemplateVars } from '@/lib/contract/template'
import type { SignatureData } from '@/lib/contract/pdf'
import { randomUUID } from 'crypto'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      formation_id, session_id, client_type, template_version,
      prenom, nom, adresse, email, telephone,
      raison_sociale, siret, instagram,
      signature_data, rgpd_consent,
    }: {
      formation_id: string
      session_id: string
      client_type: 'particulier' | 'pro'
      template_version: number
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

    const { data: template } = await supabase
      .from('contract_templates')
      .select('contenu, version')
      .eq('formation_id', formation_id)
      .eq('type', client_type)
      .single()

    if (!template) {
      return NextResponse.json({ error: 'Template introuvable' }, { status: 404 })
    }
    if (template.version !== template_version) {
      return NextResponse.json({
        error: 'Le contrat a été mis à jour. Veuillez recharger la page.',
      }, { status: 409 })
    }

    const { data: sessionData } = await supabase
      .from('sessions')
      .select('date_debut, date_fin, formations(titre, prix, duree_formation)')
      .eq('id', session_id)
      .single()

    const formation = (sessionData as any)?.formations
    const dateDebut = new Date(sessionData?.date_debut ?? Date.now()).toLocaleDateString('fr-FR')
    const dateFin   = new Date(sessionData?.date_fin   ?? Date.now()).toLocaleDateString('fr-FR')

    const vars = buildTemplateVars({
      prenom, nom, adresse, email, telephone,
      raison_sociale, siret, instagram,
      formation_titre: formation?.titre ?? '',
      date_debut: dateDebut,
      date_fin:   dateFin,
      duree_formation: formation?.duree_formation ?? '',
      prix: formation?.prix ?? 0,
    })

    const contenuRendu = renderTemplate(template.contenu, vars)

    const { generateContractPDF } = await import('@/lib/contract/pdf')
    const pdfBuffer = await generateContractPDF({
      contenuHtml: contenuRendu,
      formationTitre: formation?.titre ?? '',
      signature: signatureWithIp,
    })

    const tempUuid = randomUUID()
    const storagePath = `${tempUuid}/contrat-signe.pdf`

    const { error: uploadError } = await supabase.storage
      .from('contracts')
      .upload(storagePath, pdfBuffer, { contentType: 'application/pdf', upsert: false })

    if (uploadError) {
      return NextResponse.json({ error: 'Erreur upload contrat' }, { status: 500 })
    }

    const prix = formation?.prix ?? 0
    const { data: reservation, error: insertError } = await supabase
      .from('reservations')
      .insert({
        session_id,
        prenom,
        nom,
        email_client: email,
        nom_client: `${prenom} ${nom}`,
        telephone_client: telephone,
        telephone,
        adresse,
        client_type,
        raison_sociale: raison_sociale ?? null,
        siret: siret ?? null,
        instagram: instagram ?? null,
        contrat_signe_url: storagePath,
        contrat_version: template.version,
        signature_data: signatureWithIp,
        statut: 'en_attente_paiement',
        rgpd_consent_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (insertError || !reservation) {
      console.error('Erreur insertion reservation:', insertError)
      return NextResponse.json({ error: 'Erreur création réservation' }, { status: 500 })
    }

    return NextResponse.json({
      reservation_id: reservation.id,
      temp_uuid: tempUuid,
      contrat_url: storagePath,
    })
  } catch (err: any) {
    console.error('contract/sign error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
