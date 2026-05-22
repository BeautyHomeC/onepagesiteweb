export const RGPD_CLAUSE = `Conformément au Règlement (UE) 2016/679 (RGPD), les données collectées sont utilisées exclusivement pour la gestion de votre formation. Durée de conservation : 5 ans. Droit d'accès, rectification et effacement : contact@beautyhomeconcept.fr — sous réserve des obligations légales de conservation.`

export interface TemplateVars {
  nom_prenom: string
  prenom: string
  adresse: string
  email: string
  telephone: string
  raison_sociale?: string
  siret?: string
  instagram?: string
  formation: string
  date_session: string
  duree: string
  prix_total: string
  acompte: string
  solde: string
  date_signature: string
  // clause_rgpd is intentionally absent: renderTemplate always injects RGPD_CLAUSE directly
}

export function renderTemplate(contenu: string, vars: TemplateVars): string {
  let result = contenu
  const entries: [string, string][] = [
    ['nom_prenom',     vars.nom_prenom],
    ['prenom',         vars.prenom],
    ['adresse',        vars.adresse],
    ['email',          vars.email],
    ['telephone',      vars.telephone],
    ['raison_sociale', vars.raison_sociale ?? ''],
    ['siret',          vars.siret ?? ''],
    ['instagram',      vars.instagram ?? ''],
    ['formation',      vars.formation],
    ['date_session',   vars.date_session],
    ['duree',          vars.duree],
    ['prix_total',     vars.prix_total],
    ['acompte',        vars.acompte],
    ['solde',          vars.solde],
    ['date_signature', vars.date_signature],
    ['clause_rgpd',    RGPD_CLAUSE],
  ]
  for (const [key, value] of entries) {
    result = result.replaceAll(`{{${key}}}`, value)
  }
  return result
}

export function buildTemplateVars(params: {
  prenom: string
  nom: string
  adresse: string
  email: string
  telephone: string
  raison_sociale?: string
  siret?: string
  instagram?: string
  formation_titre: string
  date_debut: string
  date_fin: string
  duree_formation: string
  prix: number
}): TemplateVars {
  const acompte = Math.round(params.prix * 0.3)
  const solde   = params.prix - acompte
  const dateSession = params.date_debut === params.date_fin
    ? `le ${params.date_debut}`
    : `du ${params.date_debut} au ${params.date_fin}`

  return {
    nom_prenom:     `${params.prenom} ${params.nom}`,
    prenom:         params.prenom,
    adresse:        params.adresse,
    email:          params.email,
    telephone:      params.telephone,
    raison_sociale: params.raison_sociale,
    siret:          params.siret,
    instagram:      params.instagram,
    formation:      params.formation_titre,
    date_session:   dateSession,
    duree:          params.duree_formation,
    prix_total:     `${params.prix} €`,
    acompte:        `${acompte} €`,
    solde:          `${solde} €`,
    date_signature: new Date().toLocaleDateString('fr-FR'),
  }
}
