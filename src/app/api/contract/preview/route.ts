import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { renderTemplate, buildTemplateVars } from '@/lib/contract/template'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      formation_id, session_id, client_type,
      prenom, nom, adresse, email, telephone,
      raison_sociale, siret, instagram,
    } = body

    if (!formation_id || !client_type || !prenom || !nom || !email) {
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })
    }

    const supabase = await createAdminClient()

    const { data: template, error } = await supabase
      .from('contract_templates')
      .select('contenu, version')
      .eq('formation_id', formation_id)
      .eq('type', client_type)
      .single()

    if (error || !template) {
      return NextResponse.json({
        error: "Template de contrat manquant pour cette formation. Contactez l'administrateur.",
      }, { status: 404 })
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
      prenom, nom,
      adresse: adresse ?? '',
      email,
      telephone: telephone ?? '',
      raison_sociale, siret, instagram,
      formation_titre: formation?.titre ?? '',
      date_debut: dateDebut,
      date_fin:   dateFin,
      duree_formation: formation?.duree_formation ?? '',
      prix: formation?.prix ?? 0,
    })

    const html = renderTemplate(template.contenu, vars)
    return NextResponse.json({ html, template_version: template.version })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
