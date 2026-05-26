import { NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { createHash } from 'crypto'
import { createAdminClient } from '@/lib/supabase/server'
import { renderTemplate, buildTemplateVarsV2 } from '@/lib/contract/template'
import type { SignatureData } from '@/lib/contract/pdf'
import { generatePDFFromHtml } from '@/lib/contract/pdf'
import { randomUUID } from 'crypto'

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Reduce a raw User-Agent to a concise "Browser · OS" label. */
function simplifyUserAgent(ua: string): string {
  const edgeMatch  = /Edg\/(\d+)/.exec(ua)
  const operaMatch = /OPR\/(\d+)/.exec(ua)
  const ffMatch    = /Firefox\/(\d+)/.exec(ua)
  const chrMatch   = /Chrome\/(\d+)/.exec(ua)
  const safMatch   = /Version\/(\d+)/.exec(ua)

  const browser =
    edgeMatch  ? `Edge ${edgeMatch[1]}`   :
    operaMatch ? `Opera ${operaMatch[1]}` :
    ffMatch    ? `Firefox ${ffMatch[1]}`  :
    chrMatch   ? `Chrome ${chrMatch[1]}`  :
    safMatch   ? `Safari ${safMatch[1]}`  :
    'Navigateur inconnu'

  const os =
    /Windows NT 10/.test(ua)              ? 'Windows 10/11' :
    /Windows NT 6\.3/.test(ua)            ? 'Windows 8.1'   :
    /Macintosh/.test(ua)                  ? 'macOS'         :
    /Android (\d+)/.exec(ua)?.[1]
      ? `Android ${/Android (\d+)/.exec(ua)![1]}` :
    /iPhone/.test(ua)                     ? 'iOS (iPhone)'  :
    /iPad/.test(ua)                       ? 'iOS (iPad)'    :
    /Linux/.test(ua)                      ? 'Linux'         :
    'OS inconnu'

  return `${browser} · ${os}`
}

/** Build the full HTML for the audit certificate page (page 6 of the PDF). */
function buildAuditHtml(params: {
  signataire: string
  timestamp:  string
  ip:         string
  userAgent:  string
  mode:       'text' | 'draw'
  hash:       string
  docType:    'contrat' | 'convention'
}): string {
  const { signataire, timestamp, ip, userAgent, mode, hash, docType } = params

  const horodatage = new Date(timestamp).toLocaleString('fr-FR', {
    timeZone:  'Europe/Paris',
    day:       '2-digit',
    month:     'long',
    year:      'numeric',
    hour:      '2-digit',
    minute:    '2-digit',
    second:    '2-digit',
  })

  const modeLabel =
    mode === 'text'
      ? 'Nom tapé (signature textuelle)'
      : 'Signature manuscrite numérique (tracé)'

  const runnerLabel =
    docType === 'convention' ? 'Convention de formation' : 'Contrat de formation'

  const navLabel = simplifyUserAgent(userAgent)

  // Re-uses the template's CSS custom properties and class definitions
  return `
<article class="page" data-screen-label="06 Certificat" style="background: var(--paper);">
  <div class="runner top">
    <span>EI Camille Grignon</span>
    <span class="mono">Certificat électronique</span>
    <span class="num">06</span>
  </div>
  <div class="frame" style="padding-top: 28mm;">
    <p class="eyebrow" style="margin-bottom: 4px;">Preuve de signature</p>
    <h2 class="chapter" style="font-size: 28px; line-height: 1.1;">Certificat de signature<br>électronique.</h2>
    <div class="rule short" style="margin-top: 12px; margin-bottom: 14px;"></div>
    <p style="font-size: 10.5px; color: var(--muted); line-height: 1.6; margin-bottom: 16px;">
      Ce certificat constitue la trace d'audit de la signature électronique apposée sur ce document.
      Il est généré automatiquement par le système Beauty Home Concept et lié cryptographiquement
      au contenu du ${docType} signé.
    </p>

    <!-- ── Audit data table ── -->
    <div style="display: grid; grid-template-columns: 150px 1fr; border: 1px solid var(--rule); margin-bottom: 16px;">
      <div style="padding: 7px 10px; background: var(--paper-warm); border-bottom: 1px solid var(--rule); font-family: var(--sans); font-size: 8px; letter-spacing: 0.26em; text-transform: uppercase; color: var(--muted);">Signataire</div>
      <div style="padding: 7px 12px; border-bottom: 1px solid var(--rule); border-left: 1px solid var(--rule); font-family: var(--serif); font-size: 13px; color: var(--ink);">${signataire}</div>

      <div style="padding: 7px 10px; background: var(--paper-warm); border-bottom: 1px solid var(--rule); font-family: var(--sans); font-size: 8px; letter-spacing: 0.26em; text-transform: uppercase; color: var(--muted);">Horodatage</div>
      <div style="padding: 7px 12px; border-bottom: 1px solid var(--rule); border-left: 1px solid var(--rule); font-family: var(--sans); font-size: 11px; color: var(--ink-soft);">${horodatage} (heure de Paris)</div>

      <div style="padding: 7px 10px; background: var(--paper-warm); border-bottom: 1px solid var(--rule); font-family: var(--sans); font-size: 8px; letter-spacing: 0.26em; text-transform: uppercase; color: var(--muted);">Adresse IP</div>
      <div style="padding: 7px 12px; border-bottom: 1px solid var(--rule); border-left: 1px solid var(--rule); font-family: var(--sans); font-size: 11px; color: var(--ink-soft);">${ip}</div>

      <div style="padding: 7px 10px; background: var(--paper-warm); border-bottom: 1px solid var(--rule); font-family: var(--sans); font-size: 8px; letter-spacing: 0.26em; text-transform: uppercase; color: var(--muted);">Navigateur</div>
      <div style="padding: 7px 12px; border-bottom: 1px solid var(--rule); border-left: 1px solid var(--rule); font-family: var(--sans); font-size: 11px; color: var(--ink-soft);">${navLabel}</div>

      <div style="padding: 7px 10px; background: var(--paper-warm); font-family: var(--sans); font-size: 8px; letter-spacing: 0.26em; text-transform: uppercase; color: var(--muted);">Mode</div>
      <div style="padding: 7px 12px; border-left: 1px solid var(--rule); font-family: var(--sans); font-size: 11px; color: var(--ink-soft);">${modeLabel}</div>
    </div>

    <!-- ── Hash ── -->
    <p class="eyebrow muted" style="margin-bottom: 5px; font-size: 8px;">Empreinte SHA-256 — intégrité du document</p>
    <div style="padding: 10px 12px; background: var(--paper-warm); border: 1px solid var(--rule); font-family: ui-monospace, 'SF Mono', Menlo, monospace; font-size: 9.5px; letter-spacing: 0.06em; color: var(--ink-soft); word-break: break-all; margin-bottom: 16px;">${hash}</div>

    <!-- ── Legal boxes ── -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
      <div style="padding: 10px 12px; border: 1px solid var(--rule);">
        <p class="eyebrow" style="margin-bottom: 5px; font-size: 8px;">Fondement juridique</p>
        <p style="font-size: 9.5px; line-height: 1.6; color: var(--muted);">
          Art. 1367 Code civil · Règlement (UE) n°&nbsp;910/2014 (eIDAS) · L.&nbsp;6353-1 Code du travail.
          La signature électronique simple (SES) a pleine valeur probante en droit français.
        </p>
      </div>
      <div style="padding: 10px 12px; border: 1px solid var(--rule);">
        <p class="eyebrow" style="margin-bottom: 5px; font-size: 8px;">Valeur probante</p>
        <p style="font-size: 9.5px; line-height: 1.6; color: var(--muted);">
          Ce certificat est conservé et l'empreinte SHA-256 permet de vérifier à tout moment
          l'intégrité du ${docType} signé sans modification ultérieure.
        </p>
      </div>
    </div>

    <!-- ── RGPD note ── -->
    <div style="padding: 9px 12px; background: var(--paper-warm); border: 1px solid var(--rule-soft);">
      <p style="font-size: 9px; line-height: 1.6; color: var(--muted);">
        <strong style="color: var(--ink-soft); font-weight: 500;">Protection des données (RGPD)</strong> —
        Conformément au Règlement (UE) 2016/679, les données personnelles (nom, adresse e-mail, adresse IP) figurant
        sur ce certificat sont conservées pendant 5 ans aux fins de preuve de la signature électronique,
        en application des obligations légales relatives aux contrats de formation professionnelle.
        Droits d'accès, rectification et effacement : <span style="color: var(--gold);">beautyhomeconcept@gmail.com</span>
      </p>
    </div>

    <div class="legal" style="margin-top: auto; padding-top: 14px;">
      <div>
        <strong>EI Camille Grignon</strong> — Beauty Home Concept · SIRET 91093414000047<br>
        Ce certificat fait partie intégrante du ${docType} de formation.
      </div>
      <div style="text-align: right;">
        Système de signature électronique Beauty Home Concept.<br>
        <em style="font-family: var(--serif); font-style: italic; color: var(--gold);">Document généré automatiquement.</em>
      </div>
    </div>
  </div>
  <div class="runner bot"><span>${runnerLabel}</span></div>
</article>`
}

// ── Inline local asset images as base64 data URLs ────────────────────────────
// Puppeteer's setContent() has no base URL, so relative src="assets/..." fail.
// This function replaces them with inline base64 data URIs before rendering.
function inlineLocalAssets(html: string, templatesDir: string): string {
  const MIME: Record<string, string> = {
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
    gif: 'image/gif', svg: 'image/svg+xml', webp: 'image/webp',
  }
  return html.replace(/src="(assets\/[^"]+)"/g, (match, assetPath) => {
    const filePath = join(templatesDir, assetPath)
    if (!existsSync(filePath)) return match
    try {
      const data = readFileSync(filePath)
      const ext  = (assetPath.split('.').pop() ?? '').toLowerCase()
      const mime = MIME[ext] ?? 'application/octet-stream'
      return `src="data:${mime};base64,${data.toString('base64')}"`
    } catch {
      return match
    }
  })
}

// ── Route handler ─────────────────────────────────────────────────────────────

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

    const baseVars = buildTemplateVarsV2({
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

    // Convert the typed vars to a plain record so we can spread extra keys
    const varsRecord: Record<string, string> = Object.fromEntries(
      Object.entries(baseVars).map(([k, v]) => [k, String(v ?? '')])
    )

    // ── Pass 1: render without audit bloc → compute SHA-256 hash ────────────
    const pass1Html = renderTemplate(rawHtml, { ...varsRecord, 'audit.bloc': '' })
    const hash = createHash('sha256').update(pass1Html).digest('hex')

    // ── Build the audit certificate page ────────────────────────────────────
    const auditHtml = buildAuditHtml({
      signataire: `${prenom} ${nom}`,
      timestamp:  signature_data.timestamp,
      ip,
      userAgent:  req.headers.get('user-agent') ?? '',
      mode:       signature_data.type,
      hash,
      docType:    client_type === 'pro' ? 'convention' : 'contrat',
    })

    // ── Pass 2: render final HTML with audit page injected ──────────────────
    const renderedHtml = renderTemplate(rawHtml, { ...varsRecord, 'audit.bloc': auditHtml })

    // ── Inject PDF-specific CSS override before Puppeteer rendering ──────────
    // Neutralises the template's @media (max-width:900px) mobile-scaling block
    // which clips pages to ~55% height. Belt-and-suspenders alongside setViewport(1200px).
    const PDF_OVERRIDE = `<style id="__pdf_override">
.toolbar{display:none!important}
@media(max-width:900px){
  body{padding-top:0!important}
  .page{transform:none!important;height:297mm!important;margin-bottom:0!important}
}
</style>`
    const htmlForPDF = renderedHtml.includes('</head>')
      ? renderedHtml.replace('</head>', PDF_OVERRIDE + '</head>')
      : PDF_OVERRIDE + renderedHtml

    // ── Inline local images (logo, organisme signature) as base64 ───────────
    // Puppeteer's setContent() has no base URL, so src="assets/..." would 404.
    const templatesDir = join(process.cwd(), 'public', 'templates')
    const htmlForPDFInlined = inlineLocalAssets(htmlForPDF, templatesDir)

    // ── Generate PDF via Puppeteer ───────────────────────────────────────────
    const pdfBuffer = await generatePDFFromHtml(htmlForPDFInlined)

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
