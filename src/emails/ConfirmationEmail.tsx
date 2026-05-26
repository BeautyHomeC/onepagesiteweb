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

/* ─── Design tokens ─────────────────────────────────────────────── */
const C = {
  gold:      '#755a2d',
  goldLight: 'rgba(117,90,45,0.07)',
  bg:        '#faf9f9',
  white:     '#ffffff',
  dark:      '#1b1c1c',
  muted:     '#4e463a',
  subtle:    '#7f7669',
  border:    '#e9e8e8',
  borderSub: '#f4f3f3',
}

const T = {
  playfair: 'Playfair Display, Georgia, Times New Roman, serif',
  grotesk:  'Hanken Grotesk, Arial, Helvetica, sans-serif',
}

/* ─── Component ─────────────────────────────────────────────────── */
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
      <Preview>Inscription confirmée — {formationTitre}</Preview>

      <Body style={{ backgroundColor: C.bg, margin: 0, padding: '40px 16px' }}>
        <Container style={{ maxWidth: 600, margin: '0 auto', backgroundColor: C.white }}>

          {/* Top accent */}
          <div style={{ height: 2, backgroundColor: C.gold, width: '100%' }} />

          {/* ── Header : fond or — résistant au dark mode email ── */}
          <div style={{ backgroundColor: C.gold, padding: '36px 48px' }}>
            <Text style={{
              fontFamily: T.grotesk, fontSize: 9, letterSpacing: '0.32em',
              textTransform: 'uppercase', color: '#ffffff', margin: '0 0 10px',
            }}>
              Beauty Home Concept
            </Text>
            <Text style={{
              fontFamily: T.playfair, fontSize: 32, fontWeight: 400,
              color: '#ffffff', margin: 0, lineHeight: 1.2,
            }}>
              Inscription Confirmée
            </Text>
            <div style={{ width: 48, height: 1, backgroundColor: 'rgba(255,255,255,0.3)', margin: '18px 0 0' }} />
          </div>

          {/* ── Salutation ─────────────────────────────────────── */}
          <Section style={{ backgroundColor: C.white, padding: '0 48px 32px' }}>
            <Text style={{
              fontFamily: T.playfair, fontSize: 24, fontWeight: 400,
              color: C.gold, margin: '0 0 18px',
            }}>
              Chère {prenom},
            </Text>
            <Text style={{
              fontFamily: T.grotesk, fontSize: 14, fontWeight: 300,
              color: C.muted, lineHeight: 1.75, margin: 0,
            }}>
              Votre inscription à la formation{' '}
              <strong style={{ fontWeight: 500, color: C.dark }}>{formationTitre}</strong>{' '}
              {dateSession} est bien confirmée. Vous trouverez en pièce jointe votre{' '}
              {docLabel} de formation signé, le programme détaillé, le livret d'accueil et le
              règlement intérieur.
            </Text>
          </Section>

          <Hr style={{ borderColor: C.border, margin: '0 48px' }} />

          {/* ── Récapitulatif ───────────────────────────────────── */}
          <Section style={{ backgroundColor: C.white, padding: '32px 48px' }}>
            <Text style={{
              fontFamily: T.grotesk, fontSize: 9, letterSpacing: '0.28em',
              textTransform: 'uppercase', color: C.subtle, margin: '0 0 20px',
            }}>
              Récapitulatif
            </Text>
            <table width="100%" cellPadding="0" cellSpacing="0" style={{ borderCollapse: 'collapse' }}>
              <tbody>
                {([
                  ['FORMATION', formationTitre],
                  ['DATE',      dateSession],
                  ['LIEU',      'Atelier Beauty Home Concept — Amiens'],
                ] as [string, string][]).map(([label, value], i, arr) => (
                  <tr key={label} style={{ borderBottom: `1px solid ${i < arr.length - 1 ? C.borderSub : 'transparent'}` }}>
                    <td style={{
                      padding: '10px 0', width: 120, fontFamily: T.grotesk,
                      fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase',
                      color: C.muted, opacity: 0.65, verticalAlign: 'top', paddingTop: 13,
                    }}>
                      {label}
                    </td>
                    <td style={{
                      padding: '10px 0', fontFamily: T.grotesk,
                      fontSize: 14, fontWeight: 300, color: C.dark, lineHeight: 1.5,
                    }}>
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          {/* ── Récapitulatif financier ─────────────────────────── */}
          <Section style={{ padding: '0 48px 32px' }}>
            <div style={{
              backgroundColor: C.goldLight,
              border: `1px solid rgba(117,90,45,0.15)`,
              padding: '20px 24px',
            }}>
              <Text style={{
                fontFamily: T.grotesk, fontSize: 9, letterSpacing: '0.24em',
                textTransform: 'uppercase', color: C.gold, margin: '0 0 14px', fontWeight: 500,
              }}>
                Récapitulatif financier
              </Text>
              <Text style={{
                fontFamily: T.grotesk, fontSize: 13, color: C.dark,
                margin: '0 0 6px', fontWeight: 400,
              }}>
                Acompte réglé : <strong style={{ fontWeight: 500 }}>{acompte} €</strong>
              </Text>
              <Text style={{
                fontFamily: T.grotesk, fontSize: 13, fontWeight: 300,
                color: C.muted, margin: 0, lineHeight: 1.6,
              }}>
                Solde restant : {solde} € — à régler le dernier jour de la formation
                (espèces, virement ou carte).
              </Text>
            </div>
          </Section>

          {/* ── CTA facture ─────────────────────────────────────── */}
          {invoiceUrl && (
            <>
              <Section style={{ padding: '0 48px 32px' }}>
                <Button
                  href={invoiceUrl}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '16px 0',
                    textAlign: 'center',
                    border: `1px solid ${C.gold}`,
                    color: C.gold,
                    fontFamily: T.grotesk,
                    fontSize: 10,
                    letterSpacing: '0.22em',
                    textTransform: 'uppercase',
                    fontWeight: 500,
                    textDecoration: 'none',
                    backgroundColor: 'transparent',
                  }}
                >
                  TÉLÉCHARGER MA FACTURE
                </Button>
              </Section>
            </>
          )}

          <Hr style={{ borderColor: C.border, margin: '0 48px' }} />

          {/* ── Prochaines étapes ───────────────────────────────── */}
          <Section style={{ backgroundColor: C.white, padding: '32px 48px' }}>
            <Text style={{
              fontFamily: T.playfair, fontSize: 20, fontWeight: 400,
              color: C.gold, margin: '0 0 24px',
            }}>
              Prochaines Étapes
            </Text>
            {[
              "Consultez les pièces jointes : votre contrat signé et le livret d'accueil sont disponibles.",
              "Préparez vos outils personnels si spécifié dans le programme, ou profitez du kit fourni sur place.",
              "Nous vous contacterons 48h avant la formation pour finaliser les détails logistiques.",
            ].map((step, i) => (
              <table key={i} width="100%" cellPadding="0" cellSpacing="0"
                style={{ marginBottom: i < 2 ? 14 : 0, borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ width: 30, verticalAlign: 'top', paddingTop: 1 }}>
                      <div style={{
                        width: 22, height: 22, border: `1px solid ${C.gold}`,
                        textAlign: 'center', lineHeight: '22px',
                        fontFamily: T.grotesk, fontSize: 10,
                        color: C.gold, fontWeight: 500,
                      }}>
                        {i + 1}
                      </div>
                    </td>
                    <td style={{
                      paddingLeft: 12, fontFamily: T.grotesk,
                      fontSize: 13, fontWeight: 300, color: C.muted, lineHeight: 1.7,
                    }}>
                      {step}
                    </td>
                  </tr>
                </tbody>
              </table>
            ))}
          </Section>

          <Hr style={{ borderColor: C.border, margin: '0 48px' }} />

          {/* ── Signature Camille ────────────────────────────────── */}
          <Section style={{ backgroundColor: C.white, padding: '32px 48px 40px' }}>
            <Text style={{
              fontFamily: T.playfair, fontSize: 22, fontStyle: 'italic',
              color: C.gold, margin: '0 0 4px',
            }}>
              Camille
            </Text>
            <Text style={{
              fontFamily: T.grotesk, fontSize: 9, letterSpacing: '0.22em',
              textTransform: 'uppercase', color: C.muted, fontWeight: 500, margin: 0,
            }}>
              Directrice Pédagogique
            </Text>
            <Text style={{
              fontFamily: T.grotesk, fontSize: 9, letterSpacing: '0.22em',
              textTransform: 'uppercase', color: C.subtle, margin: '2px 0 0', opacity: 0.7,
            }}>
              Beauty Home Concept Academy
            </Text>
            <Text style={{
              fontFamily: T.grotesk, fontSize: 12, fontWeight: 300,
              color: C.muted, margin: '24px 0 0', lineHeight: 1.6,
            }}>
              Une question ?{' '}
              <Link href="mailto:contact@beautyhomeconcept.fr"
                style={{ color: C.gold, textDecoration: 'underline' }}>
                contact@beautyhomeconcept.fr
              </Link>
            </Text>
          </Section>

          {/* Bottom accent */}
          <div style={{ height: 1, backgroundColor: C.border, width: '100%' }} />

          {/* Footer */}
          <Section style={{ backgroundColor: C.bg, padding: '20px 48px', textAlign: 'center' }}>
            <Text style={{
              fontFamily: T.playfair, fontSize: 13, fontWeight: 400,
              color: C.dark, margin: '0 0 4px',
            }}>
              BEAUTY HOME CONCEPT
            </Text>
            <Text style={{
              fontFamily: T.grotesk, fontSize: 9, letterSpacing: '0.2em',
              textTransform: 'uppercase', color: C.subtle, margin: 0, opacity: 0.6,
            }}>
              © 2024 Beauty Home Concept. Tous droits réservés.
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}
