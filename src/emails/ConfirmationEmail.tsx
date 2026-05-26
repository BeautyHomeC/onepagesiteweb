import React from 'react'
import {
  Html, Head, Preview, Body, Container, Text, Button, Hr, Section, Link,
} from '@react-email/components'

interface Props {
  nomClient: string
  prenom: string
  formationTitre: string
  dateSession: string
  acompte: number
  solde: number
  invoiceUrl: string | null
  clientType: 'particulier' | 'pro'
}

/* ─── Tokens ─────────────────────────────────────────────────────────────── */
const gold      = '#755a2d'
const goldLight = 'rgba(117,90,45,0.08)'
const goldBorder= 'rgba(117,90,45,0.18)'
const white     = '#ffffff'
const bg        = '#faf9f9'
const dark      = '#1b1c1c'
const muted     = '#5a5248'
const subtle    = '#8c8278'
const line      = '#ebebeb'

const serif  = 'Playfair Display, Georgia, Times New Roman, serif'
const grotesk= 'Hanken Grotesk, Arial, Helvetica, sans-serif'

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const eyebrow: React.CSSProperties = {
  fontFamily: grotesk, fontSize: 9, letterSpacing: '0.32em',
  textTransform: 'uppercase', color: gold, margin: '0 0 10px 0', fontWeight: 500,
}
const bodyText: React.CSSProperties = {
  fontFamily: grotesk, fontSize: 14, fontWeight: 300,
  color: muted, lineHeight: 1.75, margin: 0,
}
const labelCell: React.CSSProperties = {
  width: 120, fontFamily: grotesk, fontSize: 9, letterSpacing: '0.18em',
  textTransform: 'uppercase', color: subtle, verticalAlign: 'top',
  paddingTop: 12, paddingBottom: 10, paddingRight: 16,
}
const valueCell: React.CSSProperties = {
  fontFamily: grotesk, fontSize: 14, fontWeight: 300,
  color: dark, lineHeight: 1.5, paddingTop: 10, paddingBottom: 10,
}

export default function ConfirmationEmail({
  prenom, formationTitre, dateSession,
  acompte, solde, invoiceUrl, clientType,
}: Props) {
  const docLabel = clientType === 'pro' ? 'convention' : 'contrat'

  return (
    <Html lang="fr">
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Hanken+Grotesk:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </Head>
      <Preview>Votre inscription est confirmée — {formationTitre}</Preview>

      <Body style={{ backgroundColor: bg, margin: 0, padding: '32px 16px' }}>
        <Container style={{ maxWidth: 600, margin: '0 auto' }}>

          {/* ── Gold top accent ─────────────────────────────────────────── */}
          <div style={{ height: 3, backgroundColor: gold }} />

          {/* ── Header ──────────────────────────────────────────────────── */}
          <div style={{ backgroundColor: white, padding: '40px 48px 32px' }}>
            <Text style={eyebrow}>Beauty Home Concept Academy</Text>
            <Text style={{
              fontFamily: serif, fontSize: 34, fontWeight: 400,
              color: dark, margin: 0, lineHeight: 1.15,
            }}>
              Inscription Confirmée
            </Text>
            <div style={{ width: 40, height: 1, backgroundColor: gold, marginTop: 20 }} />
          </div>

          {/* ── Salutation ──────────────────────────────────────────────── */}
          <div style={{ backgroundColor: white, padding: '0 48px 28px' }}>
            <Text style={{
              fontFamily: serif, fontSize: 22, fontWeight: 400,
              color: gold, margin: '0 0 16px 0',
            }}>
              Chère {prenom},
            </Text>
            <Text style={bodyText}>
              Votre inscription à la formation{' '}
              <strong style={{ fontWeight: 500, color: dark }}>{formationTitre}</strong>{' '}
              {dateSession} est confirmée. Vous trouverez en pièce jointe votre{' '}
              {docLabel} signé, le programme, le livret d&apos;accueil et le règlement intérieur.
            </Text>
          </div>

          <div style={{ height: 1, backgroundColor: line, margin: '0 48px' }} />

          {/* ── Récapitulatif ────────────────────────────────────────────── */}
          <div style={{ backgroundColor: white, padding: '28px 48px' }}>
            <Text style={{ ...eyebrow, marginBottom: 18 }}>Récapitulatif</Text>
            <table width="100%" cellPadding={0} cellSpacing={0} style={{ borderCollapse: 'collapse' }}>
              <tbody>
                {([
                  ['Formation', formationTitre],
                  ['Date', dateSession],
                  ['Lieu', 'Atelier Beauty Home Concept — Amiens'],
                ] as [string, string][]).map(([lbl, val], i, arr) => (
                  <tr key={lbl} style={{ borderBottom: `1px solid ${i < arr.length - 1 ? '#f2f1f0' : 'transparent'}` }}>
                    <td style={labelCell}>{lbl}</td>
                    <td style={valueCell}>{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ height: 1, backgroundColor: line, margin: '0 48px' }} />

          {/* ── Récapitulatif financier ──────────────────────────────────── */}
          <div style={{ backgroundColor: white, padding: '28px 48px' }}>
            <div style={{
              backgroundColor: goldLight,
              border: `1px solid ${goldBorder}`,
              padding: '22px 24px',
            }}>
              <Text style={{ ...eyebrow, marginBottom: 16 }}>Règlement</Text>
              <table width="100%" cellPadding={0} cellSpacing={0} style={{ borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{
                      fontFamily: grotesk, fontSize: 13, color: muted,
                      fontWeight: 300, paddingBottom: 8,
                    }}>
                      Acompte réglé
                    </td>
                    <td style={{
                      fontFamily: grotesk, fontSize: 13, color: dark,
                      fontWeight: 500, textAlign: 'right', paddingBottom: 8,
                    }}>
                      {acompte} €
                    </td>
                  </tr>
                  <tr style={{ borderTop: `1px solid ${goldBorder}` }}>
                    <td style={{
                      fontFamily: grotesk, fontSize: 13, color: muted,
                      fontWeight: 300, paddingTop: 8,
                    }}>
                      Solde restant
                    </td>
                    <td style={{
                      fontFamily: grotesk, fontSize: 13, color: muted,
                      fontWeight: 300, textAlign: 'right', paddingTop: 8,
                    }}>
                      {solde} € <span style={{ fontSize: 11, opacity: 0.7 }}>(dernier jour)</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ── CTA facture ─────────────────────────────────────────────── */}
          {invoiceUrl && (
            <div style={{ backgroundColor: white, padding: '0 48px 28px' }}>
              <Button
                href={invoiceUrl}
                style={{
                  display: 'inline-block',
                  padding: '14px 28px',
                  border: `1px solid ${gold}`,
                  color: gold,
                  fontFamily: grotesk,
                  fontSize: 10,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  fontWeight: 500,
                  textDecoration: 'none',
                  backgroundColor: 'transparent',
                }}
              >
                Télécharger ma facture
              </Button>
            </div>
          )}

          <div style={{ height: 1, backgroundColor: line, margin: '0 48px' }} />

          {/* ── Prochaines étapes ────────────────────────────────────────── */}
          <div style={{ backgroundColor: white, padding: '28px 48px' }}>
            <Text style={{
              fontFamily: serif, fontSize: 20, fontWeight: 400,
              color: dark, margin: '0 0 22px 0',
            }}>
              Avant la formation
            </Text>
            {[
              'Consultez les pièces jointes : votre contrat signé, le programme et le livret d\'accueil sont disponibles.',
              'Préparez vos outils personnels si mentionné dans le programme, ou profitez du kit fourni sur place.',
              'Nous vous contacterons 48h avant la formation pour finaliser les détails pratiques.',
            ].map((step, i) => (
              <table key={i} width="100%" cellPadding={0} cellSpacing={0}
                style={{ marginBottom: i < 2 ? 16 : 0, borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ width: 28, verticalAlign: 'top', paddingTop: 1 }}>
                      <div style={{
                        width: 20, height: 20, border: `1px solid ${goldBorder}`,
                        textAlign: 'center', lineHeight: '20px',
                        fontFamily: grotesk, fontSize: 9,
                        color: gold, fontWeight: 500,
                      }}>
                        {i + 1}
                      </div>
                    </td>
                    <td style={{
                      paddingLeft: 12, fontFamily: grotesk,
                      fontSize: 13, fontWeight: 300, color: muted, lineHeight: 1.7,
                    }}>
                      {step}
                    </td>
                  </tr>
                </tbody>
              </table>
            ))}
          </div>

          <div style={{ height: 1, backgroundColor: line, margin: '0 48px' }} />

          {/* ── Signature ────────────────────────────────────────────────── */}
          <div style={{ backgroundColor: white, padding: '28px 48px 40px' }}>
            <Text style={{
              fontFamily: serif, fontSize: 22, fontStyle: 'italic',
              color: gold, margin: '0 0 2px 0',
            }}>
              Camille
            </Text>
            <Text style={{
              fontFamily: grotesk, fontSize: 9, letterSpacing: '0.22em',
              textTransform: 'uppercase', color: muted, fontWeight: 500, margin: 0,
            }}>
              Directrice Pédagogique
            </Text>
            <Text style={{
              fontFamily: grotesk, fontSize: 9, letterSpacing: '0.2em',
              textTransform: 'uppercase', color: subtle, margin: '2px 0 0 0',
            }}>
              Beauty Home Concept Academy
            </Text>
            <Text style={{
              fontFamily: grotesk, fontSize: 12, fontWeight: 300,
              color: muted, margin: '24px 0 0 0', lineHeight: 1.6,
            }}>
              Une question ?{' '}
              <Link href="mailto:contact@beautyhomeconcept.fr"
                style={{ color: gold, textDecoration: 'underline' }}>
                contact@beautyhomeconcept.fr
              </Link>
            </Text>
          </div>

          {/* ── Footer ───────────────────────────────────────────────────── */}
          <div style={{ height: 1, backgroundColor: line }} />
          <div style={{ backgroundColor: bg, padding: '20px 48px', textAlign: 'center' }}>
            <Text style={{
              fontFamily: serif, fontSize: 12, fontWeight: 400,
              color: dark, margin: '0 0 4px 0',
            }}>
              BEAUTY HOME CONCEPT
            </Text>
            <Text style={{
              fontFamily: grotesk, fontSize: 9, letterSpacing: '0.18em',
              textTransform: 'uppercase', color: subtle, margin: 0,
            }}>
              © {new Date().getFullYear()} Beauty Home Concept. Tous droits réservés.
            </Text>
          </div>
          <div style={{ height: 3, backgroundColor: gold }} />

        </Container>
      </Body>
    </Html>
  )
}
