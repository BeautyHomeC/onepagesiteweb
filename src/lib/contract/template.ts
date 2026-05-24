export const RGPD_CLAUSE = `Conformément au Règlement (UE) 2016/679 (RGPD), les données collectées sont utilisées exclusivement pour la gestion de votre formation. Durée de conservation : 5 ans. Droit d'accès, rectification et effacement : contact@beautyhomeconcept.fr — sous réserve des obligations légales de conservation.`

export interface TemplateVars {
  nom_prenom: string
  nom: string        // alias: last name only (for {{nom}})
  prenom: string
  adresse: string
  email: string
  telephone: string
  raison_sociale?: string
  siret?: string
  instagram?: string
  formation: string
  formation_titre: string  // alias for {{formation_titre}}
  date_session: string
  duree: string
  prix_total: string
  prix: string             // alias for {{prix}}
  acompte: string
  solde: string
  date_signature: string
  // clause_rgpd is intentionally absent: renderTemplate always injects RGPD_CLAUSE directly
}

export function renderTemplate(contenu: string, vars: TemplateVars): string {
  let result = contenu
  const entries: [string, string][] = [
    // Primary keys
    ['nom_prenom',      vars.nom_prenom],
    ['prenom',          vars.prenom],
    ['nom',             vars.nom],
    ['adresse',         vars.adresse],
    ['email',           vars.email],
    ['telephone',       vars.telephone],
    ['raison_sociale',  vars.raison_sociale ?? ''],
    ['siret',           vars.siret ?? ''],
    ['instagram',       vars.instagram ?? ''],
    // Formation info — both key forms accepted
    ['formation_titre', vars.formation_titre],
    ['formation',       vars.formation],
    // Date & duration
    ['date_session',    vars.date_session],
    ['duree',           vars.duree],
    // Prices — both key forms accepted
    ['prix_total',      vars.prix_total],
    ['prix',            vars.prix],
    ['acompte',         vars.acompte],
    ['solde',           vars.solde],
    // Signature
    ['date_signature',  vars.date_signature],
    // RGPD
    ['clause_rgpd',     RGPD_CLAUSE],
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
    nom_prenom:      `${params.prenom} ${params.nom}`,
    nom:             params.nom,
    prenom:          params.prenom,
    adresse:         params.adresse,
    email:           params.email,
    telephone:       params.telephone,
    raison_sociale:  params.raison_sociale,
    siret:           params.siret,
    instagram:       params.instagram,
    formation:       params.formation_titre,
    formation_titre: params.formation_titre,
    date_session:    dateSession,
    duree:           params.duree_formation,
    prix_total:      `${params.prix} €`,
    prix:            `${params.prix} €`,
    acompte:         `${acompte} €`,
    solde:           `${solde} €`,
    date_signature:  new Date().toLocaleDateString('fr-FR'),
  }
}
