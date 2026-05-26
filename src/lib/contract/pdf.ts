import { createHash } from 'crypto'
import React from 'react'

// ─────────────────────────────────────────────────────────────────────────
//  PDF generation — two strategies:
//
//  1. generatePDFFromHtml(html)  — Puppeteer / headless Chrome
//     Renders the full A4 HTML design faithfully. Used for contract PDF.
//     • Development: local Chrome at CHROME_EXECUTABLE_PATH or standard paths
//     • Production (Vercel): puppeteer-core + @sparticuz/chromium-min
//
//  2. generateContractPDF / generateFichePDF — @react-pdf/renderer (legacy)
//     Kept for the "fiche d'inscription" summary sheet.
//     renderToBuffer() was REMOVED in v4; use renderToStream() instead.
// ─────────────────────────────────────────────────────────────────────────

/** Render an HTML string to a PDF Buffer using headless Chrome (Puppeteer). */
export async function generatePDFFromHtml(html: string): Promise<Buffer> {
  const isVercel = !!process.env.VERCEL
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let browser: any

  if (isVercel) {
    // ── Production: use @sparticuz/chromium-min (no bundled browser) ──────
    const { default: chromium } = await import('@sparticuz/chromium-min')
    const { default: puppeteer } = await import('puppeteer-core')

    // Use env var (set in Vercel dashboard) or fall back to the installed package version
    // NOTE: Vercel runs on x64 Linux; the pack filename requires the .x64 architecture suffix
    const remoteUrl =
      process.env.CHROMIUM_REMOTE_EXEC_PATH ??
      `https://github.com/Sparticuz/chromium/releases/download/v148.0.0/chromium-v148.0.0-pack.x64.tar`

    browser = await puppeteer.launch({
      args: (chromium as any).args,
      executablePath: await (chromium as any).executablePath(remoteUrl),
      headless: true,
    })
  } else {
    // ── Development: use local Chrome installation ─────────────────────────
    const { default: puppeteer } = await import('puppeteer-core')

    const executablePath =
      process.env.CHROME_EXECUTABLE_PATH ??
      (process.platform === 'win32'
        ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
        : process.platform === 'darwin'
          ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
          : '/usr/bin/google-chrome')

    browser = await puppeteer.launch({
      headless: true,
      executablePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
  }

  try {
    const page = await browser.newPage()
    // Set viewport wider than 900px so the template's @media (max-width:900px)
    // mobile-scaling rule never fires during PDF rendering.
    await page.setViewport({ width: 1200, height: 900 })
    await page.emulateMediaType('print')
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30_000 })
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    })
    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}

export interface SignatureData {
  type: 'text' | 'draw'
  valeur: string
  timestamp: string
  ip: string
  userAgent: string
}

export interface ContractPDFParams {
  contenuHtml: string
  formationTitre: string
  signature: SignatureData
}

export interface FichePDFParams {
  prenom: string
  nom: string
  email: string
  telephone: string
  adresse: string
  client_type: 'particulier' | 'pro'
  raison_sociale?: string
  siret?: string
  instagram?: string
  formation_titre: string
  date_session: string
  acompte: number
  created_at: string
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .trim()
}

/** Pipe a Readable stream into a Buffer */
async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = []
  return new Promise<Buffer>((resolve, reject) => {
    stream.on('data', (chunk: Buffer) => chunks.push(chunk))
    stream.on('end', () => resolve(Buffer.concat(chunks)))
    stream.on('error', reject)
  })
}

export async function generateContractPDF(params: ContractPDFParams): Promise<Buffer> {
  const {
    renderToStream,
    Document, Page, Text, View, StyleSheet,
  } = await import('@react-pdf/renderer')

  const styles = StyleSheet.create({
    page:       { fontFamily: 'Helvetica', fontSize: 10, padding: 50, color: '#1b1c1c', lineHeight: 1.6 },
    title:      { fontSize: 14, fontFamily: 'Helvetica-Bold', marginBottom: 20, textAlign: 'center', color: '#755a2d' },
    body:       { fontSize: 10, lineHeight: 1.7, marginBottom: 8 },
    auditBox:   { marginTop: 30, padding: 16, border: '1px solid #755a2d', backgroundColor: '#fdf9f4' },
    auditTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#755a2d', marginBottom: 10 },
    auditRow:   { fontSize: 9, color: '#4e463a', marginBottom: 4 },
    auditLabel: { fontFamily: 'Helvetica-Bold' },
  })

  const plainText = stripHtml(params.contenuHtml)
  const hash = createHash('sha256').update(plainText).digest('hex').slice(0, 16)

  const doc = React.createElement(Document, {},
    React.createElement(Page, { size: 'A4', style: styles.page },
      React.createElement(View, {},
        React.createElement(Text, { style: styles.title }, params.formationTitre),
        ...plainText.split('\n\n').filter(Boolean).map((para, i) =>
          React.createElement(Text, { key: String(i), style: styles.body }, para.trim())
        ),
        React.createElement(View, { style: styles.auditBox },
          React.createElement(Text, { style: styles.auditTitle }, 'CERTIFICAT DE SIGNATURE ÉLECTRONIQUE'),
          React.createElement(Text, { style: styles.auditRow },
            React.createElement(Text, { style: styles.auditLabel }, 'Signataire : '),
            params.signature.valeur
          ),
          React.createElement(Text, { style: styles.auditRow },
            React.createElement(Text, { style: styles.auditLabel }, 'Date : '),
            new Date(params.signature.timestamp).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })
          ),
          React.createElement(Text, { style: styles.auditRow },
            React.createElement(Text, { style: styles.auditLabel }, 'IP : '),
            params.signature.ip
          ),
          React.createElement(Text, { style: styles.auditRow },
            React.createElement(Text, { style: styles.auditLabel }, 'Mode : '),
            params.signature.type === 'text' ? 'Nom tapé' : 'Signature manuscrite numérique'
          ),
          React.createElement(Text, { style: styles.auditRow },
            React.createElement(Text, { style: styles.auditLabel }, 'Empreinte SHA-256 : '),
            hash
          ),
        )
      )
    )
  )

  const stream = await renderToStream(doc)
  return streamToBuffer(stream)
}

export async function generateFichePDF(params: FichePDFParams): Promise<Buffer> {
  const {
    renderToStream,
    Document, Page, Text, View, StyleSheet,
  } = await import('@react-pdf/renderer')

  const styles = StyleSheet.create({
    page:       { fontFamily: 'Helvetica', fontSize: 10, padding: 50, color: '#1b1c1c', lineHeight: 1.6 },
    title:      { fontSize: 14, fontFamily: 'Helvetica-Bold', marginBottom: 20, textAlign: 'center', color: '#755a2d' },
    body:       { fontSize: 10, lineHeight: 1.7, marginBottom: 8 },
    auditLabel: { fontFamily: 'Helvetica-Bold' },
  })

  const rows: [string, string][] = [
    ['Prénom',              params.prenom],
    ['Nom',                 params.nom],
    ['Email',               params.email],
    ['Téléphone',           params.telephone],
    ['Adresse',             params.adresse],
    ['Type de client',      params.client_type === 'pro' ? 'Professionnel' : 'Particulier'],
    ...(params.client_type === 'pro' ? [
      ['Raison sociale', params.raison_sociale ?? ''],
      ['SIRET',          params.siret          ?? ''],
      ['Instagram',      params.instagram      ?? ''],
    ] as [string, string][] : []),
    ['Formation',           params.formation_titre],
    ['Session',             params.date_session],
    ['Acompte réglé',       `${params.acompte} €`],
    ["Date d'inscription",  new Date(params.created_at).toLocaleDateString('fr-FR')],
  ]

  const doc = React.createElement(Document, {},
    React.createElement(Page, { size: 'A4', style: styles.page },
      React.createElement(View, {},
        React.createElement(Text, { style: styles.title }, "Fiche d'inscription — Beauty Home Concept"),
        ...rows.map(([label, value], i) =>
          React.createElement(Text, { key: String(i), style: styles.body },
            React.createElement(Text, { style: styles.auditLabel }, `${label} : `),
            value
          )
        )
      )
    )
  )

  const stream = await renderToStream(doc)
  return streamToBuffer(stream)
}
