import ReactPDF from '@react-pdf/renderer'
import { createHash } from 'crypto'
import React from 'react'

// renderToBuffer is a named export inside the ReactPDF namespace (index.d.ts: `export const renderToBuffer`).
// The CommonJS default export carries all namespace members, so destructuring from ReactPDF works correctly.
const { Document, Page, Text, View, StyleSheet, renderToBuffer } = ReactPDF

const styles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 10, padding: 50, color: '#1b1c1c', lineHeight: 1.6 },
  title: { fontSize: 14, fontFamily: 'Helvetica-Bold', marginBottom: 20, textAlign: 'center', color: '#755a2d' },
  body: { fontSize: 10, lineHeight: 1.7, marginBottom: 8 },
  auditBox: { marginTop: 30, padding: 16, border: '1px solid #755a2d', backgroundColor: '#fdf9f4' },
  auditTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#755a2d', marginBottom: 10 },
  auditRow: { fontSize: 9, color: '#4e463a', marginBottom: 4 },
  auditLabel: { fontFamily: 'Helvetica-Bold' },
})

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

export async function generateContractPDF(params: ContractPDFParams): Promise<Buffer> {
  const plainText = stripHtml(params.contenuHtml)
  const hash = createHash('sha256').update(plainText).digest('hex').slice(0, 16)

  const doc = React.createElement(Document, {},
    React.createElement(Page, { size: 'A4', style: styles.page },
      React.createElement(View, {},
        React.createElement(Text, { style: styles.title }, params.formationTitre),
        ...plainText.split('\n\n').filter(Boolean).map((para, i) =>
          React.createElement(Text, { key: i, style: styles.body }, para.trim())
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

  return renderToBuffer(doc)
}

export async function generateFichePDF(params: FichePDFParams): Promise<Buffer> {
  const rows: [string, string][] = [
    ['Prénom', params.prenom],
    ['Nom', params.nom],
    ['Email', params.email],
    ['Téléphone', params.telephone],
    ['Adresse', params.adresse],
    ['Type de client', params.client_type === 'pro' ? 'Professionnel' : 'Particulier'],
    ...(params.client_type === 'pro' ? [
      ['Raison sociale', params.raison_sociale ?? ''],
      ['SIRET', params.siret ?? ''],
      ['Instagram', params.instagram ?? ''],
    ] as [string, string][] : []),
    ['Formation', params.formation_titre],
    ['Session', params.date_session],
    ['Acompte réglé', `${params.acompte} €`],
    ['Date d\'inscription', new Date(params.created_at).toLocaleDateString('fr-FR')],
  ]

  const doc = React.createElement(Document, {},
    React.createElement(Page, { size: 'A4', style: styles.page },
      React.createElement(View, {},
        React.createElement(Text, { style: styles.title }, 'Fiche d\'inscription — Beauty Home Concept'),
        ...rows.map(([label, value], i) =>
          React.createElement(Text, { key: i, style: styles.body },
            React.createElement(Text, { style: styles.auditLabel }, `${label} : `),
            value
          )
        )
      )
    )
  )

  return renderToBuffer(doc)
}
