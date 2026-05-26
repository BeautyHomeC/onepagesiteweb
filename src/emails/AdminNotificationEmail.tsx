import React from 'react'
import {
  Html, Head, Preview, Body, Container, Text, Button, Hr, Section, Link, Tailwind,
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

export default function AdminNotificationEmail({
  nomClient, emailClient, telephoneClient, adresse, clientType,
  raisonSociale, siret, instagram,
  formationTitre, dateSession, acompte, siteUrl,
}: Props) {
  return (
    <Html>
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Hanken+Grotesk:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </Head>
      <Preview>Nouvelle Inscription — {nomClient}</Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                surface:    '#faf9f9',
                'on-surface':   '#1b1c1c',
                primary:    '#755a2d',
                muted:      '#4e463a',
                outline:    '#7f7669',
                'outline-variant': '#d1c5b6',
                'container-low':   '#f4f3f3',
                'container-high':  '#e9e8e8',
              },
              fontFamily: {
                sans:  ['Hanken Grotesk', 'Arial', 'sans-serif'],
                serif: ['Playfair Display', 'Georgia', 'serif'],
              },
            },
          },
        }}
      >
        <Body className="bg-surface text-on-surface font-sans antialiased m-0 py-10">
          <Container className="max-w-[600px] mx-auto px-0">

            {/* Top accent line */}
            <Section className="mb-0">
              <div style={{ height: '2px', background: '#755a2d', width: '100%' }} />
            </Section>

            {/* Header */}
            <Section className="bg-white px-12 pt-12 pb-8 text-center">
              <Text
                className="text-[10px] text-primary tracking-[0.32em] uppercase m-0 mb-3"
                style={{ fontFamily: 'Hanken Grotesk, Arial, sans-serif', letterSpacing: '0.32em' }}
              >
                NOTIFICATION INTERNE
              </Text>
              <Text
                className="text-[38px] text-on-surface m-0 leading-tight"
                style={{ fontFamily: 'Playfair Display, Georgia, serif', fontWeight: 400 }}
              >
                Nouvelle Inscription Reçue
              </Text>
              <div style={{ width: '48px', height: '1px', background: '#d1c5b6', margin: '24px auto 0' }} />
            </Section>

            {/* Student info */}
            <Section className="bg-white px-12 pb-10 pt-4">
              <Text
                className="text-[10px] tracking-[0.28em] uppercase m-0 mb-6"
                style={{ fontFamily: 'Hanken Grotesk, Arial, sans-serif', color: '#7f7669' }}
              >
                INFORMATIONS ÉLÈVE
              </Text>

              <table width="100%" cellPadding="0" cellSpacing="0">
                <tbody>
                  {[
                    ['NOM COMPLET',  nomClient],
                    ['EMAIL',        emailClient],
                    ['TÉLÉPHONE',    telephoneClient],
                    ['ADRESSE',      adresse],
                    ['STATUT',       clientType === 'pro' ? 'Professionnel' : 'Particulier'],
                    ...(clientType === 'pro' ? [
                      ['RAISON SOCIALE', raisonSociale ?? '—'],
                      ['SIRET',          siret ?? '—'],
                      ...(instagram ? [['INSTAGRAM', instagram]] : []),
                    ] : []),
                  ].map(([label, value]) => (
                    <tr key={label} style={{ borderBottom: '1px solid #f4f3f3' }}>
                      <td
                        style={{
                          padding: '10px 0',
                          width: '140px',
                          fontFamily: 'Hanken Grotesk, Arial, sans-serif',
                          fontSize: '9px',
                          letterSpacing: '0.22em',
                          textTransform: 'uppercase',
                          color: '#4e463a',
                          opacity: 0.6,
                          verticalAlign: 'top',
                          paddingTop: '12px',
                        }}
                      >
                        {label}
                      </td>
                      <td
                        style={{
                          padding: '10px 0',
                          fontFamily: 'Hanken Grotesk, Arial, sans-serif',
                          fontSize: '15px',
                          fontWeight: 300,
                          color: '#1b1c1c',
                          verticalAlign: 'top',
                        }}
                      >
                        {value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>

            <Hr style={{ borderColor: '#e9e8e8', margin: '0 48px' }} />

            {/* Formation */}
            <Section className="bg-white px-12 py-10">
              <Text
                className="text-[10px] tracking-[0.28em] uppercase m-0 mb-4"
                style={{ fontFamily: 'Hanken Grotesk, Arial, sans-serif', color: '#7f7669' }}
              >
                FORMATION SÉLECTIONNÉE
              </Text>
              <Text
                className="text-[26px] text-on-surface m-0 mb-2 leading-tight"
                style={{ fontFamily: 'Playfair Display, Georgia, serif', fontWeight: 400 }}
              >
                {formationTitre}
              </Text>
              <Text
                className="m-0 mb-8"
                style={{ fontFamily: 'Hanken Grotesk, Arial, sans-serif', fontSize: '14px', fontWeight: 300, color: '#4e463a' }}
              >
                {dateSession}
              </Text>

              {/* Status badge */}
              <div style={{ display: 'inline-block', padding: '10px 16px', background: 'rgba(117, 90, 45, 0.06)', border: '1px solid rgba(117, 90, 45, 0.2)' }}>
                <Text
                  className="m-0"
                  style={{ fontFamily: 'Hanken Grotesk, Arial, sans-serif', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#755a2d', fontWeight: 500 }}
                >
                  Acompte Reçu — {acompte} €
                </Text>
              </div>
            </Section>

            <Hr style={{ borderColor: '#e9e8e8', margin: '0 48px' }} />

            {/* CTA */}
            <Section className="bg-white px-12 pt-10 pb-12">
              <Text
                className="m-0 mb-8"
                style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '15px', fontStyle: 'italic', color: '#4e463a', lineHeight: 1.7 }}
              >
                Bonjour Camille, une nouvelle réservation vient d'être effectuée. Veuillez vérifier les documents et le calendrier de formation.
              </Text>
              <Button
                href={`${siteUrl}/admin/reservations`}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '18px 0',
                  textAlign: 'center',
                  border: '1px solid #755a2d',
                  color: '#755a2d',
                  fontFamily: 'Hanken Grotesk, Arial, sans-serif',
                  fontSize: '11px',
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  fontWeight: 500,
                  textDecoration: 'none',
                  background: 'transparent',
                }}
              >
                ACCÉDER AU DASHBOARD ADMIN
              </Button>
            </Section>

            {/* Bottom line */}
            <Section>
              <div style={{ height: '1px', background: '#d1c5b6', width: '100%' }} />
            </Section>

            <Section className="bg-surface px-12 py-6 text-center">
              <Text
                className="m-0"
                style={{ fontFamily: 'Hanken Grotesk, Arial, sans-serif', fontSize: '9px', letterSpacing: '0.24em', textTransform: 'uppercase', color: '#7f7669', opacity: 0.6 }}
              >
                CETTE NOTIFICATION EST GÉNÉRÉE AUTOMATIQUEMENT PAR LE SYSTÈME BHC
              </Text>
            </Section>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
