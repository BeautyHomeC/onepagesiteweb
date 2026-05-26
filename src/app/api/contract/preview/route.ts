import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import { createAdminClient } from '@/lib/supabase/server'
import { renderTemplate, buildTemplateVarsV2, buildTemplateVars } from '@/lib/contract/template'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      formation_id, session_id, client_type,
      prenom, nom, adresse, email, telephone,
      siret, instagram,
    } = body

    if (!client_type || !prenom || !nom || !email) {
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // ── 1. Try formation-specific DB override first ──────────────────────────
    let html: string | null = null
    let templateVersion: number | null = null

    if (formation_id) {
      const { data: dbTemplate } = await supabase
        .from('contract_templates')
        .select('contenu, version')
        .eq('formation_id', formation_id)
        .eq('type', client_type)
        .maybeSingle()

      if (dbTemplate?.contenu) {
        // Legacy DB template — use flat variable names
        const { data: sessionData } = await supabase
          .from('sessions')
          .select('date_debut, date_fin, formations(titre, prix, duree_formation)')
          .eq('id', session_id)
          .maybeSingle()

        const formation = (sessionData as any)?.formations
        const dateDebut = new Date(sessionData?.date_debut ?? Date.now()).toLocaleDateString('fr-FR')
        const dateFin   = new Date(sessionData?.date_fin   ?? Date.now()).toLocaleDateString('fr-FR')

        const vars = buildTemplateVars({
          prenom, nom,
          adresse: adresse ?? '',
          email,
          telephone: telephone ?? '',
          siret, instagram,
          formation_titre: formation?.titre ?? '',
          date_debut: dateDebut,
          date_fin:   dateFin,
          duree_formation: formation?.duree_formation ?? '',
          prix: formation?.prix ?? 0,
        })

        html = renderTemplate(dbTemplate.contenu, vars)
        templateVersion = dbTemplate.version
      }
    }

    // ── 2. Static HTML template (Claude Design) ──────────────────────────────
    if (!html) {
      const filename = client_type === 'pro' ? 'convention-pro.html' : 'contrat-particulier.html'
      const tplPath  = join(process.cwd(), 'public', 'templates', filename)

      let rawHtml: string
      try {
        rawHtml = readFileSync(tplPath, 'utf-8')
      } catch {
        return NextResponse.json({ error: `Template "${filename}" introuvable.` }, { status: 404 })
      }

      // Fetch session + formation data
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
        adresse:          adresse ?? '',
        email,
        telephone:        telephone ?? '',
        siret,
        instagram,
        formation_titre:  formation?.titre ?? '',
        date_debut:       sessionData?.date_debut ?? new Date().toISOString(),
        date_fin:         sessionData?.date_fin   ?? new Date().toISOString(),
        duree_formation:  formation?.duree_formation ?? '',
        horaire:          formation?.horaire ?? '',
        prix:             formation?.prix ?? 0,
      })

      html = renderTemplate(rawHtml, vars)
    }

    return NextResponse.json({ html, template_version: templateVersion ?? 1 })
  } catch (err: any) {
    console.error('[contract/preview]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
