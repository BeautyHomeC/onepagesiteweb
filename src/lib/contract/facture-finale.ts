import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

export interface FactureFinaleParams {
  prenom: string
  nom: string
  email: string
  telephone: string
  adresse: string
  clientType: 'particulier' | 'pro'
  raisonSociale?: string
  siret?: string
  formationTitre: string
  dateSession: string
  prixTotal: number           // formation.prix
  acompte: number             // reservation.acompte_amount
  acompteStripeId: string     // reservation.stripe_payment_id
  acomptePaidAt: string       // reservation.acompte_paid_at (ISO string)
  acompteFactureRef?: string  // optionnel — auto-calculé si absent (BHC-YYYYMM-XXXXXX)
  solde: number               // prixTotal - acompte
  soldePaidAt: string         // now() at payment time (ISO string)
  soldePaymentMethod: string  // e.g. "Espèces + Virement"
}

function logoBase64(): string | null {
  try {
    const p = join(process.cwd(), 'public', 'templates', 'assets', 'logo-bhc.png')
    if (!existsSync(p)) return null
    return `data:image/png;base64,${readFileSync(p).toString('base64')}`
  } catch { return null }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

/** Formats a monetary amount with exactly 2 decimal places (French accounting standard) */
function formatEur(amount: number): string {
  return amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Numéro de facture finale : BHC-YYYYMM-XXXXXX-F */
function invoiceRef(stripeId: string, paidAt: string): string {
  const d = new Date(paidAt)
  const yy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const suffix = stripeId.replace(/^(pi_|ch_)/, '').slice(-6).toUpperCase()
  return `BHC-${yy}${mm}-${suffix}-F`
}

/** Numéro de la facture d'acompte associée : BHC-YYYYMM-XXXXXX (sans suffixe -F) */
function acompteRef(stripeId: string, paidAt: string): string {
  const d = new Date(paidAt)
  const yy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const suffix = stripeId.replace(/^(pi_|ch_)/, '').slice(-6).toUpperCase()
  return `BHC-${yy}${mm}-${suffix}`
}

export function generateFactureFinaleHTML(p: FactureFinaleParams): string {
  const gold       = '#755a2d'
  const goldLight  = 'rgba(117,90,45,0.07)'
  const goldBorder = 'rgba(117,90,45,0.2)'
  const dark       = '#1b1c1c'
  const muted      = '#5a5248'
  const subtle     = '#8c8278'
  const line       = '#e9e8e8'
  const green      = '#166534'
  const greenLight = 'rgba(22,101,52,0.06)'
  const serif      = "'Playfair Display', Georgia, serif"
  const sans       = "'Hanken Grotesk', Arial, Helvetica, sans-serif"

  const logo        = logoBase64()
  const ref         = invoiceRef(p.acompteStripeId, p.soldePaidAt)
  // Référence de la facture d'acompte — fournie explicitement ou calculée
  const acompteRef_ = p.acompteFactureRef ?? acompteRef(p.acompteStripeId, p.acomptePaidAt)
  const dateEmission  = formatDate(p.soldePaidAt)
  const dateAcompte   = formatDate(p.acomptePaidAt)
  const nomClient     = `${p.prenom} ${p.nom}`.trim()
  const docType       = p.clientType === 'pro' ? 'Convention' : 'Contrat'

  // ─── Conditions de règlement — selon type client ────────────────────────────
  // B2B (pro) : mentions obligatoires Art. L.441-10 + D.441-5 Code de Commerce
  // B2C (particulier) : confirmation d'acquittement et note d'archivage
  const conditionsHTML = p.clientType === 'pro'
    ? `<p style="margin:0 0 4px;">
        <strong style="font-weight:500; color:${dark};">Règlement acquitté le ${dateEmission}.</strong>
        Cette facture atteste du règlement intégral de la prestation. Aucun solde n'est dû.
       </p>
       <p style="margin:0;">
        Conformément à l'Art. L.441-10 et D.441-5 du Code de Commerce, tout retard de paiement
        aurait entraîné des pénalités au taux de 3 fois le taux d'intérêt légal ainsi qu'une
        indemnité forfaitaire de 40 € pour frais de recouvrement.
       </p>`
    : `<p style="margin:0;">
        Votre formation est intégralement réglée.
        Ce document constitue votre
        <strong style="font-weight:500; color:${dark};">reçu officiel de formation</strong>
        (${formatEur(p.prixTotal)} €). Conservez-le pour vos archives et déclarations fiscales.
        Il complète la facture d'acompte ${acompteRef_}.
       </p>`

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Hanken+Grotesk:wght@300;400;500&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 210mm; background: #fff; color: ${dark}; }
  @page { size: A4; margin: 0; }
  @media print { html, body { width: 210mm; } }
  body { font-family: ${sans}; font-size: 13px; font-weight: 300; line-height: 1.6; }
  .page { width: 210mm; min-height: 297mm; display: flex; flex-direction: column; padding: 0; }
  .gold-bar { height: 4px; background: ${gold}; }
  .gold-bar-sm { height: 1px; background: ${goldBorder}; }
  .header { padding: 32px 48px 28px; display: flex; align-items: center; justify-content: space-between; }
  .logo-area { display: flex; flex-direction: column; gap: 4px; }
  .logo-img { height: 48px; object-fit: contain; object-position: left; }
  .logo-text { font-family: ${serif}; font-size: 18px; font-weight: 400; color: ${dark}; letter-spacing: 0.08em; text-transform: uppercase; }
  .logo-sub { font-family: ${sans}; font-size: 9px; letter-spacing: 0.28em; text-transform: uppercase; color: ${subtle}; font-weight: 400; }
  .invoice-title-block { text-align: right; }
  .invoice-type { font-family: ${sans}; font-size: 9px; letter-spacing: 0.32em; text-transform: uppercase; color: ${gold}; font-weight: 500; margin-bottom: 6px; }
  .invoice-ref { font-family: ${serif}; font-size: 24px; font-weight: 400; color: ${dark}; }
  .invoice-date { font-family: ${sans}; font-size: 11px; color: ${muted}; font-weight: 300; margin-top: 4px; }
  .parties { padding: 24px 48px; display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
  .party-label { font-family: ${sans}; font-size: 9px; letter-spacing: 0.28em; text-transform: uppercase; color: ${gold}; font-weight: 500; margin-bottom: 10px; }
  .party-name { font-family: ${serif}; font-size: 16px; font-weight: 400; color: ${dark}; margin-bottom: 6px; }
  .party-detail { font-family: ${sans}; font-size: 12px; color: ${muted}; font-weight: 300; line-height: 1.7; }
  .section { padding: 0 48px 24px; }
  .section-label { font-family: ${sans}; font-size: 9px; letter-spacing: 0.28em; text-transform: uppercase; color: ${subtle}; font-weight: 500; margin-bottom: 14px; }
  table.lines { width: 100%; border-collapse: collapse; }
  table.lines thead tr { border-bottom: 1px solid ${goldBorder}; }
  table.lines thead th { font-family: ${sans}; font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: ${subtle}; font-weight: 500; padding: 0 0 10px; text-align: left; }
  table.lines thead th:last-child { text-align: right; }
  table.lines tbody tr { border-bottom: 1px solid ${line}; }
  table.lines tbody td { font-family: ${sans}; font-size: 13px; font-weight: 300; color: ${dark}; padding: 12px 0; vertical-align: top; }
  table.lines tbody td:last-child { text-align: right; font-weight: 400; }
  table.lines tbody td.desc-sub { font-size: 11px; color: ${muted}; margin-top: 2px; display: block; }
  .totals-box { background: ${goldLight}; border: 1px solid ${goldBorder}; padding: 20px 24px; margin: 0 48px 20px; }
  table.totals { width: 100%; border-collapse: collapse; }
  table.totals td { font-family: ${sans}; font-size: 13px; font-weight: 300; color: ${muted}; padding: 5px 0; }
  table.totals td:last-child { text-align: right; font-weight: 400; color: ${dark}; }
  table.totals tr.total-row td { font-family: ${serif}; font-size: 16px; font-weight: 400; color: ${gold}; padding-top: 12px; border-top: 1px solid ${goldBorder}; }
  table.totals tr.total-row td:last-child { font-family: ${serif}; font-size: 18px; }
  table.totals tr.zero-row td { font-family: ${sans}; font-size: 12px; font-weight: 500; color: ${green}; padding-top: 6px; }
  /* Badge : label uppercase + référence Stripe en casse originale */
  .paid-badge-wrap { margin: 0 48px 20px; display: flex; align-items: center; gap: 10px; }
  .paid-badge-label { display: inline-flex; align-items: center; gap: 6px; background: ${green}; color: #fff; font-family: ${sans}; font-size: 9px; letter-spacing: 0.3em; text-transform: uppercase; font-weight: 500; padding: 5px 14px; white-space: nowrap; }
  .paid-badge-ref { font-family: ${sans}; font-size: 10px; color: ${muted}; font-weight: 300; letter-spacing: 0.02em; }
  /* Conditions de règlement */
  .conditions { margin: 0 48px 20px; padding: 14px 16px; border: 1px solid ${line}; background: #fafaf9; }
  .conditions p { font-family: ${sans}; font-size: 10px; color: ${subtle}; font-weight: 300; line-height: 1.65; }
  /* Bandeau "Formation intégralement réglée" — distinct du badge vert */
  .acquitte-banner { margin: 0 48px 20px; padding: 12px 16px; background: ${greenLight}; border: 1px solid rgba(22,101,52,0.15); display: flex; align-items: center; gap: 8px; }
  .acquitte-banner-text { font-family: ${sans}; font-size: 10px; color: ${green}; font-weight: 500; letter-spacing: 0.05em; }
  .spacer { flex: 1; }
  .footer { margin-top: auto; padding: 20px 48px; border-top: 1px solid ${line}; display: flex; justify-content: space-between; align-items: flex-end; }
  .footer-left { font-family: ${sans}; font-size: 10px; color: ${subtle}; font-weight: 300; line-height: 1.7; }
  .footer-right { text-align: right; font-family: ${sans}; font-size: 10px; color: ${subtle}; font-weight: 300; line-height: 1.7; }
  .footer-brand { font-family: ${serif}; font-size: 13px; color: ${dark}; font-weight: 400; display: block; margin-bottom: 4px; }
</style>
</head>
<body>
<div class="page">

  <div class="gold-bar"></div>

  <!-- En-tête -->
  <div class="header">
    <div class="logo-area">
      ${logo
        ? `<img src="${logo}" alt="Beauty Home Concept" class="logo-img" />`
        : `<span class="logo-text">Beauty Home Concept</span>`}
      <span class="logo-sub">Academy · Formation Professionnelle</span>
    </div>
    <div class="invoice-title-block">
      <div class="invoice-type">Facture de solde</div>
      <div class="invoice-ref">${ref}</div>
      <div class="invoice-date">Émise le ${dateEmission}</div>
    </div>
  </div>

  <div class="gold-bar-sm" style="margin: 0 48px;"></div>

  <!-- Parties -->
  <div class="parties">
    <div class="party-block">
      <div class="party-label">Facturée à</div>
      <div class="party-name">${nomClient}</div>
      <div class="party-detail">
        ${p.email}<br>
        ${p.telephone ? p.telephone + '<br>' : ''}
        ${p.adresse ? p.adresse + '<br>' : ''}
        ${p.clientType === 'pro' && p.raisonSociale ? p.raisonSociale + '<br>' : ''}
        ${p.clientType === 'pro' && p.siret ? 'SIRET : ' + p.siret : ''}
      </div>
    </div>
    <div class="party-block">
      <div class="party-label">Émise par</div>
      <div class="party-name">Beauty Home Concept</div>
      <div class="party-detail">
        EI Camille Grignon<br>
        22A rue du Général Leclerc<br>
        80000 Amiens, France<br>
        contact@beautyhomeconcept.fr<br>
        SIRET : 910 934 140 000 47
      </div>
    </div>
  </div>

  <div class="gold-bar-sm" style="margin: 0 48px 24px;"></div>

  <!-- Lignes de facturation -->
  <div class="section">
    <div class="section-label">Détail de la prestation</div>
    <table class="lines">
      <thead>
        <tr>
          <th>Désignation</th>
          <th>Type</th>
          <th>Montant</th>
        </tr>
      </thead>
      <tbody>
        <!-- Ligne 1 : prix total de la formation -->
        <tr>
          <td>
            <strong style="font-weight:500;">${p.formationTitre}</strong>
            <span class="desc-sub">${docType} de formation — ${p.dateSession}</span>
            <span class="desc-sub">Organisme certifié Qualiopi · NDA 32 80 02643 80</span>
          </td>
          <td style="color:${muted}; font-size:12px;">Prix total</td>
          <td>${formatEur(p.prixTotal)} €</td>
        </tr>
        <!-- Ligne 2 : acompte déjà réglé (référence facture + référence Stripe) -->
        <tr>
          <td>
            <span style="color:${muted};">Acompte versé le ${dateAcompte}</span>
            <span class="desc-sub">Facture ${acompteRef_} · Réf. Stripe ${p.acompteStripeId}</span>
          </td>
          <td style="color:${muted}; font-size:12px;">Acompte (30%) — déjà réglé</td>
          <td style="color:${muted};">&#8722;${formatEur(p.acompte)} €</td>
        </tr>
        <!-- Ligne 3 : solde réglé aujourd'hui -->
        <tr>
          <td>
            <strong style="font-weight:500;">Solde de la formation</strong>
            <span class="desc-sub">Mode de règlement : ${p.soldePaymentMethod}</span>
          </td>
          <td style="color:${muted}; font-size:12px;">Solde (70%) — réglé le ${dateEmission}</td>
          <td>${formatEur(p.solde)} €</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Récapitulatif des montants -->
  <div class="totals-box">
    <table class="totals">
      <tbody>
        <tr>
          <td>Acompte versé le ${dateAcompte}</td>
          <td>${formatEur(p.acompte)} €</td>
        </tr>
        <tr>
          <td>Solde réglé le ${dateEmission} — ${p.soldePaymentMethod}</td>
          <td>${formatEur(p.solde)} €</td>
        </tr>
        <tr class="total-row">
          <td>Total acquitté</td>
          <td>${formatEur(p.prixTotal)} €</td>
        </tr>
        <tr class="zero-row">
          <td>&#10003;&nbsp;Reste dû</td>
          <td>0,00 €</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Badge de paiement : label uppercase + référence Stripe en casse originale -->
  <div class="paid-badge-wrap">
    <div class="paid-badge-label">
      &#10003;&nbsp;Formation intégralement réglée
    </div>
    <span class="paid-badge-ref">${p.soldePaymentMethod} · Réf. ${p.acompteStripeId}</span>
  </div>

  <!-- Conditions de règlement / note d'archivage -->
  <div class="conditions">
    ${conditionsHTML}
  </div>

  <div class="spacer"></div>

  <!-- Pied de page légal -->
  <div class="footer">
    <div class="footer-left">
      <span class="footer-brand">Beauty Home Concept</span>
      EI Camille Grignon · SIRET 910 934 140 000 47<br>
      N° de déclaration d'activité : 32 80 02643 80<br>
      TVA non applicable — article 293B du CGI
    </div>
    <div class="footer-right">
      22A rue du Général Leclerc<br>
      80000 Amiens, France<br>
      contact@beautyhomeconcept.fr
    </div>
  </div>

  <div class="gold-bar"></div>

</div>
</body>
</html>`
}
