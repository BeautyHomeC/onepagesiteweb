// ─────────────────────────────────────────────────────────────────────────────
//  contract/template.ts
//
//  Variable substitution for both template formats:
//    - Legacy flat keys:    {{nom_prenom}}, {{formation}}, {{prix}}…
//    - Design dot keys:     {{stagiaire.nom_prenom}}, {{formation.intitule}}…
//
//  The renderTemplate() function handles both. New routes should use the
//  dot-notation keys (aligned with public/templates/*.html from Claude Design).
// ─────────────────────────────────────────────────────────────────────────────

export const RGPD_CLAUSE = `Conformément au Règlement (UE) 2016/679 (RGPD), les données collectées sont utilisées exclusivement pour la gestion de votre formation. Durée de conservation : 5 ans. Droit d'accès, rectification et effacement : beautyhomeconcept@gmail.com — sous réserve des obligations légales de conservation.`

// ── Legacy flat-key interface (DB templates via Tiptap editor) ──────────────
export interface TemplateVars {
  nom_prenom: string
  nom: string
  prenom: string
  adresse: string
  email: string
  telephone: string
  raison_sociale?: string
  siret?: string
  instagram?: string
  formation: string
  formation_titre: string
  date_session: string
  duree: string
  prix_total: string
  prix: string
  acompte: string
  solde: string
  date_signature: string
}

// ── New dot-notation interface (static HTML templates from Claude Design) ───
export interface TemplateVarsV2 {
  // Stagiaire
  'stagiaire.nom_prenom': string
  'stagiaire.adresse': string
  'stagiaire.telephone': string
  'stagiaire.email': string
  'stagiaire.siret': string
  'stagiaire.instagram': string
  // Formation
  'formation.intitule': string
  'formation.duree': string
  'formation.dates': string
  'formation.horaires': string
  // Tarif (numbers only — templates add € TTC themselves)
  'tarif.total': string
  'tarif.acompte': string
  'tarif.solde': string
  // Contrat
  'contrat.lieu': string
  'contrat.date_signature': string
  // Signatures (HTML/base64 image — injected after signing)
  'signature.organisme': string
  'signature.stagiaire': string
  // Audit certificate page (injected by sign route after SHA-256 computation)
  'audit.bloc'?: string
}

/** Replace all {{key}} placeholders — supports both flat and dot-notation keys */
export function renderTemplate(contenu: string, vars: TemplateVars | TemplateVarsV2 | Record<string, string>): string {
  let result = contenu
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value ?? '')
  }
  // Always inject RGPD clause for legacy templates
  result = result.replaceAll('{{clause_rgpd}}', RGPD_CLAUSE)
  return result
}

// ── Legacy builder (kept for DB-template routes) ────────────────────────────
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

// ── New dot-notation builder (static HTML templates from Claude Design) ──────
export function buildTemplateVarsV2(params: {
  prenom: string
  nom: string
  adresse: string
  email: string
  telephone: string
  siret?: string
  instagram?: string
  formation_titre: string
  date_debut: string        // ISO date string e.g. "2026-03-15"
  date_fin: string          // ISO date string e.g. "2026-03-15"
  duree_formation: string   // e.g. "1 jour · 7 heures"
  horaire?: string          // e.g. "9 h 30 – 17 h 00"
  prix: number
  signature_stagiaire?: string  // base64 img or SVG HTML (injected after signing)
  signature_organisme?: string  // pre-set organisme signature
}): TemplateVarsV2 {
  const acompte = Math.round(params.prix * 0.3)
  const solde   = params.prix - acompte

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const dates = params.date_debut === params.date_fin
    ? formatDate(params.date_debut)
    : `du ${formatDate(params.date_debut)} au ${formatDate(params.date_fin)}`

  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  return {
    'stagiaire.nom_prenom':    `${params.prenom} ${params.nom}`,
    'stagiaire.adresse':       params.adresse || '—',
    'stagiaire.telephone':     params.telephone || '—',
    'stagiaire.email':         params.email,
    'stagiaire.siret':         params.siret || '—',
    'stagiaire.instagram':     params.instagram || '—',
    'formation.intitule':      params.formation_titre,
    'formation.duree':         params.duree_formation || '—',
    'formation.dates':         dates,
    'formation.horaires':      params.horaire || '9 h 30 – 17 h 00',
    'tarif.total':             String(params.prix),
    'tarif.acompte':           String(acompte),
    'tarif.solde':             String(solde),
    'contrat.lieu':            'Amiens',
    'contrat.date_signature':  today,
    'signature.organisme':     params.signature_organisme || '',
    'signature.stagiaire':     params.signature_stagiaire || '',
  }
}
