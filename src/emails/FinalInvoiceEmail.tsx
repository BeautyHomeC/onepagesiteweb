import {
  Html, Head, Body, Container, Section, Text, Font,
} from '@react-email/components'

interface FinalInvoiceEmailProps {
  nomClient: string
  prenom: string
  formationTitre: string
  dateSession: string
  prixTotal: number
  acompte: number
  solde: number
  soldePaymentMethod: string
}

export default function FinalInvoiceEmail({
  nomClient, prenom, formationTitre, dateSession,
  prixTotal, acompte, solde, soldePaymentMethod,
}: FinalInvoiceEmailProps) {
  const gold = '#755a2d'
  const dark = '#1b1c1c'
  const muted = '#5a5248'
  const subtle = '#8c8278'
  const line = '#e9e8e8'
  const green = '#166534'

  return (
    <Html lang="fr">
      <Head>
        <Font
          fontFamily="Playfair Display"
          fallbackFontFamily="Georgia"
          webFont={{
            url: 'https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvUDQZNLo_U2r.woff2',
            format: 'woff2',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Body style={{ backgroundColor: '#f5f3f0', margin: 0, padding: '32px 0', fontFamily: 'Arial, Helvetica, sans-serif' }}>
        <Container style={{ maxWidth: 600, margin: '0 auto', backgroundColor: '#ffffff' }}>
          {/* Top gold bar */}
          <div style={{ height: 4, backgroundColor: gold }} />

          {/* Header */}
          <Section style={{ padding: '36px 48px 20px' }}>
            <Text style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: dark, letterSpacing: '0.08em', textTransform: 'uppercase' as const, margin: 0 }}>
              Beauty Home Concept
            </Text>
            <Text style={{ fontFamily: 'Arial, sans-serif', fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase' as const, color: subtle, margin: '4px 0 0', fontWeight: 400 }}>
              Academy · Formation Professionnelle
            </Text>
          </Section>

          <div style={{ height: 1, backgroundColor: line, margin: '0 48px' }} />

          {/* Title */}
          <Section style={{ padding: '32px 48px 8px' }}>
            <Text style={{ fontFamily: 'Arial, sans-serif', fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase' as const, color: gold, fontWeight: 500, margin: '0 0 8px' }}>
              Confirmation de paiement complet
            </Text>
            <Text style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: dark, margin: 0, lineHeight: 1.2 }}>
              Formation intégralement réglée
            </Text>
          </Section>

          {/* Green badge */}
          <Section style={{ padding: '20px 48px' }}>
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '16px 20px' }}>
              <Text style={{ fontFamily: 'Arial, sans-serif', fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase' as const, color: green, fontWeight: 500, margin: '0 0 6px' }}>
                ✓ Paiement complet
              </Text>
              <Text style={{ fontSize: 14, color: green, fontWeight: 500, margin: 0 }}>
                {formationTitre} — {dateSession}
              </Text>
            </div>
          </Section>

          {/* Message */}
          <Section style={{ padding: '0 48px 24px' }}>
            <Text style={{ fontSize: 15, color: muted, fontWeight: 300, lineHeight: 1.7, margin: '0 0 12px' }}>
              Bonjour {prenom},
            </Text>
            <Text style={{ fontSize: 15, color: muted, fontWeight: 300, lineHeight: 1.7, margin: 0 }}>
              Votre formation <strong style={{ color: dark, fontWeight: 500 }}>{formationTitre}</strong> est désormais intégralement réglée. Votre facture de solde est jointe à cet email en pièce jointe PDF — conservez-la pour votre dossier.
            </Text>
          </Section>

          {/* Summary table */}
          <Section style={{ padding: '0 48px 24px' }}>
            <Text style={{ fontFamily: 'Arial, sans-serif', fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase' as const, color: subtle, fontWeight: 500, margin: '0 0 14px' }}>
              Récapitulatif financier
            </Text>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr style={{ borderBottom: `1px solid ${line}` }}>
                  <td style={{ padding: '9px 0', fontSize: 13, color: muted, fontWeight: 300 }}>Acompte versé</td>
                  <td style={{ padding: '9px 0', fontSize: 13, color: dark, textAlign: 'right' as const }}>{acompte.toLocaleString('fr-FR')} €</td>
                </tr>
                <tr style={{ borderBottom: `1px solid ${line}` }}>
                  <td style={{ padding: '9px 0', fontSize: 13, color: muted, fontWeight: 300 }}>Solde réglé ({soldePaymentMethod})</td>
                  <td style={{ padding: '9px 0', fontSize: 13, color: dark, textAlign: 'right' as const }}>{solde.toLocaleString('fr-FR')} €</td>
                </tr>
                <tr style={{ borderBottom: `1px solid ${line}` }}>
                  <td style={{ padding: '12px 0 9px', fontSize: 16, fontFamily: 'Georgia, serif', color: gold }}>Total acquitté</td>
                  <td style={{ padding: '12px 0 9px', fontSize: 18, fontFamily: 'Georgia, serif', color: gold, textAlign: 'right' as const }}>{prixTotal.toLocaleString('fr-FR')} €</td>
                </tr>
                <tr>
                  <td style={{ padding: '9px 0', fontSize: 12, color: green, fontWeight: 500 }}>✓ Reste dû</td>
                  <td style={{ padding: '9px 0', fontSize: 12, color: green, fontWeight: 500, textAlign: 'right' as const }}>0,00 €</td>
                </tr>
              </tbody>
            </table>
          </Section>

          <div style={{ height: 1, backgroundColor: line, margin: '0 48px 32px' }} />

          {/* Signature */}
          <Section style={{ padding: '0 48px 32px' }}>
            <Text style={{ fontSize: 14, color: muted, fontWeight: 300, lineHeight: 1.8, margin: '0 0 4px' }}>
              Avec plaisir,
            </Text>
            <Text style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: gold, margin: '0 0 4px', fontStyle: 'italic' }}>
              Camille Grignon
            </Text>
            <Text style={{ fontFamily: 'Arial, sans-serif', fontSize: 11, color: subtle, margin: 0, letterSpacing: '0.1em' }}>
              Beauty Home Concept — Directrice Pédagogique
            </Text>
          </Section>

          {/* Footer */}
          <div style={{ height: 1, backgroundColor: line }} />
          <Section style={{ padding: '16px 48px', backgroundColor: '#faf9f9' }}>
            <Text style={{ fontSize: 10, color: subtle, fontWeight: 300, lineHeight: 1.7, margin: 0 }}>
              Beauty Home Concept · EI Camille Grignon · SIRET 910 934 140 000 47<br />
              N° de déclaration d'activité : 32 80 02643 80 · TVA non applicable (art. 293B CGI)<br />
              22A rue du Général Leclerc, 80000 Amiens · contact@beautyhomeconcept.fr
            </Text>
          </Section>
          <div style={{ height: 4, backgroundColor: gold }} />
        </Container>
      </Body>
    </Html>
  )
}
