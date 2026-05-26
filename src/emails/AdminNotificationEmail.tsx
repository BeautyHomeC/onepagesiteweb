import React from 'react'
import {
  Html, Head, Preview, Body, Container, Text, Button, Hr, Section,
} from '@react-email/components'

interface Props {
  nomClient: string
  emailClient: string
  telephoneClient: string
  adresse: string
  clientType: 'particulier' | 'pro'
  raisonSociale?: string
  siret?: string
  instagram?: string
  formationTitre: string
  dateSession: string
  acompte: number
  reservationId: string
  siteUrl: string
}

/* ─── Design tokens ─────────────────────────────────────────────── */
const C = {
  gold:      '#755a2d',
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
export default function AdminNotificationEmail({
  nomClient, emailClient, telephoneClient, adresse, clientType,
  raisonSociale, siret, instagram,
  formationTitre, dateSession, acompte, siteUrl,
}: Props) {

  const rows: [string, string][] = [
    ['NOM COMPLET',  nomClient],
    ['EMAIL',        emailClient],
    ['TÉLÉPHONE',    telephoneClient],
    ['ADRESSE',      adresse],
    ['STATUT',       clientType === 'pro' ? 'Professionnel' : 'Particulier'],
    ...(clientType === 'pro' ? [
      ['RAISON SOCIALE', raisonSociale ?? '—'],
      ['SIRET',          siret ?? '—'],
      ...(instagram ? [['INSTAGRAM', instagram] as [string, string]] : []),
    ] as [string, string][] : []),
  ]

  return (
    <Html lang="fr">
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Hanken+Grotesk:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </Head>
      <Preview>Nouvelle Inscription — {nomClient}</Preview>

      <Body style={{ backgroundColor: C.bg, margin: 0, padding: '40px 16px' }}>
        <Container style={{ maxWidth: 600, margin: '0 auto', backgroundColor: C.white }}>

          {/* Top accent */}
          <div style={{ height: 2, backgroundColor: C.gold, width: '100%' }} />

          {/* ── Header ─────────────────────────────────────────── */}
          <Section style={{ backgroundColor: C.white, padding: '44px 48px 32px', textAlign: 'center' }}>
            <Text style={{
              fontFamily: T.grotesk, fontSize: 9, letterSpacing: '0.32em',
              textTransform: 'uppercase', color: C.gold, margin: '0 0 10px',
            }}>
              Notification Interne
            </Text>
            <Text style={{
              fontFamily: T.playfair, fontSize: 34, fontWeight: 400,
              color: C.dark, margin: 0, lineHeight: 1.2,
            }}>
              Nouvelle Inscription Reçue
            </Text>
            <div style={{ width: 48, height: 1, backgroundColor: C.border, margin: '18px auto 0' }} />
          </Section>

          {/* ── Informations élève ──────────────────────────────── */}
          <Section style={{ backgroundColor: C.white, padding: '0 48px 32px' }}>
            <Text style={{
              fontFamily: T.grotesk, fontSize: 9, letterSpacing: '0.28em',
              textTransform: 'uppercase', color: C.subtle, margin: '0 0 18px',
            }}>
              Informations Élève
            </Text>
            <table width="100%" cellPadding="0" cellSpacing="0" style={{ borderCollapse: 'collapse' }}>
              <tbody>
                {rows.map(([label, value]) => (
                  <tr key={label} style={{ borderBottom: `1px solid ${C.borderSub}` }}>
                    <td style={{
                      padding: '10px 0', width: 136, fontFamily: T.grotesk,
                      fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase',
                      color: C.muted, opacity: 0.65, verticalAlign: 'top', paddingTop: 12,
                    }}>
                      {label}
                    </td>
                    <td style={{
                      padding: '10px 0', fontFamily: T.grotesk,
                      fontSize: 14, fontWeight: 300, color: C.dark,
                      verticalAlign: 'top', lineHeight: 1.5,
                    }}>
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          <Hr style={{ borderColor: C.border, margin: '0 48px' }} />

          {/* ── Formation ───────────────────────────────────────── */}
          <Section style={{ backgroundColor: C.white, padding: '32px 48px' }}>
            <Text style={{
              fontFamily: T.grotesk, fontSize: 9, letterSpacing: '0.28em',
              textTransform: 'uppercase', color: C.subtle, margin: '0 0 14px',
            }}>
              Formation Sélectionnée
            </Text>
            <Text style={{
              fontFamily: T.playfair, fontSize: 24, fontWeight: 400,
              color: C.dark, margin: '0 0 6px', lineHeight: 1.25,
            }}>
              {formationTitre}
            </Text>
            <Text style={{
              fontFamily: T.grotesk, fontSize: 14, fontWeight: 300,
              color: C.muted, margin: '0 0 24px',
            }}>
              {dateSession}
            </Text>
            <div style={{
              display: 'inline-block',
              padding: '10px 16px',
              backgroundColor: 'rgba(117,90,45,0.07)',
              border: '1px solid rgba(117,90,45,0.2)',
            }}>
              <Text style={{
                fontFamily: T.grotesk, fontSize: 10, letterSpacing: '0.2em',
                textTransform: 'uppercase', color: C.gold, fontWeight: 500, margin: 0,
              }}>
                Acompte Reçu — {acompte} €
              </Text>
            </div>
          </Section>

          <Hr style={{ borderColor: C.border, margin: '0 48px' }} />

          {/* ── CTA ─────────────────────────────────────────────── */}
          <Section style={{ backgroundColor: C.white, padding: '28px 48px 44px' }}>
            <Text style={{
              fontFamily: T.playfair, fontSize: 14, fontStyle: 'italic',
              color: C.muted, lineHeight: 1.7, margin: '0 0 24px',
            }}>
              Bonjour Camille, une nouvelle réservation vient d'être effectuée.
              Veuillez vérifier les documents et le calendrier de formation.
            </Text>
            <Button
              href={`${siteUrl}/admin/reservations`}
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
              ACCÉDER AU DASHBOARD ADMIN
            </Button>
          </Section>

          {/* Bottom accent */}
          <div style={{ height: 1, backgroundColor: C.border, width: '100%' }} />

          {/* Footer */}
          <Section style={{ backgroundColor: C.bg, padding: '18px 48px', textAlign: 'center' }}>
            <Text style={{
              fontFamily: T.grotesk, fontSize: 9, letterSpacing: '0.24em',
              textTransform: 'uppercase', color: C.subtle, margin: 0, opacity: 0.6,
            }}>
              Notification automatique — Système BHC
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}
