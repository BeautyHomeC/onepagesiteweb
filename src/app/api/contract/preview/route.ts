import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import { createAdminClient } from '@/lib/supabase/server'
import { renderTemplate, buildTemplateVarsV2 } from '@/lib/contract/template'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      session_id, client_type,
      prenom, nom, adresse, email, telephone,
      siret, instagram,
    } = body

    if (!client_type || !prenom || !nom || !email) {
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // ── Static HTML template (always used) ──────────────────────────────────
    const filename = client_type === 'pro' ? 'convention-pro.html' : 'contrat-particulier.html'
    const tplPath  = join(process.cwd(), 'public', 'templates', filename)

    let rawHtml: string
    try {
      rawHtml = readFileSync(tplPath, 'utf-8')
    } catch {
      return NextResponse.json({ error: `Template "${filename}" introuvable.` }, { status: 404 })
    }

    const { data: sessionData } = session_id
      ? await supabase
          .from('sessions')
          .select('date_debut, date_fin, formations(titre, prix, duree_formation, horaire)')
          .eq('id', session_id)
          .maybeSingle()
      : { data: null }

    const formation = (sessionData as any)?.formations

    const vars = buildTemplateVarsV2({
      prenom, nom,
      adresse:         adresse     ?? '',
      email,
      telephone:       telephone   ?? '',
      siret,
      instagram,
      formation_titre: formation?.titre           ?? '',
      date_debut:      sessionData?.date_debut    ?? new Date().toISOString(),
      date_fin:        sessionData?.date_fin      ?? new Date().toISOString(),
      duree_formation: formation?.duree_formation ?? '',
      horaire:         formation?.horaire         ?? '',
      prix:            formation?.prix            ?? 0,
    })

    const html = renderTemplate(rawHtml, vars)

    return NextResponse.json({ html, template_version: 1 })
  } catch (err: any) {
    console.error('[contract/preview]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
