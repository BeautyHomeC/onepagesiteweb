import React from 'react'
import {
  Html, Head, Preview, Body, Container, Text, Button, Hr, Section, Link, Tailwind,
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

export default function ConfirmationEmail({
  nomClient, prenom, formationTitre, dateSession,
  acompte, solde, invoiceUrl,
}: Props) {
  return (
    <Html>
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Hanken+Grotesk:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </Head>
      <Preview>Confirmation d'Inscription — Beauty Home Concept</Preview>
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
            <Section>
              <div style={{ height: '2px', background: '#755a2d', width: '100%' }} />
            </Section>

            {/* Hero header */}
            <Section className="bg-white px-12 pt-14 pb-10 text-center">
              <Text
                className="m-0 mb-3"
                style={{ fontFamily: 'Hanken Grotesk, Arial, sans-serif', fontSize: '10px', letterSpacing: '0.32em', textTransform: 'uppercase', color: '#755a2d' }}
              >
                BEAUTY HOME CONCEPT ACADEMY
              </Text>
              <Text
                className="m-0 leading-tight"
                style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '40px', fontWeight: 400, color: '#1b1c1c' }}
              >
                Bienvenue dans l'Excellence
              </Text>
              <Text
                className="m-0 mt-5"
                style={{ fontFamily: 'Hanken Grotesk, Arial, sans-serif', fontSize: '10px', letterSpacing: '0.36em', textTransform: 'uppercase', color: '#755a2d' }}
              >
                VOTRE VOYAGE COMMENCE ICI
              </Text>
              <div style={{ width: '48px', height: '1px', background: '#d1c5b6', margin: '24px auto 0' }} />
            </Section>

            {/* Welcome letter */}
            <Section className="bg-white px-12 pb-10">
              <Text
                className="m-0 mb-5"
                style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '26px', fontWeight: 400, color: '#755a2d' }}
              >
                Félicitations {prenom}
              </Text>
              <Text
                className="m-0 mb-4"
                style={{ fontFamily: 'Hanken Grotesk, Arial, sans-serif', fontSize: '15px', fontWeight: 300, color: '#4e463a', lineHeight: 1.75 }}
              >
                Nous sommes ravis de vous confirmer votre inscription à la formation d'élite de la{' '}
                <strong style={{ fontWeight: 500, color: '#1b1c1c' }}>Beauty Home Concept Academy</strong>.
                Vous avez fait le choix de l'exigence et du raffinement technique.
              </Text>
              <Text
                className="m-0"
                style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '15px', fontStyle: 'italic', color: '#7f7669' }}
              >
                "La perfection n'est pas un but, c'est un standard."
              </Text>
            </Section>

            <Hr style={{ borderColor: '#e9e8e8', margin: '0 48px' }} />

            {/* Formation summary */}
            <Section className="bg-white px-12 py-10">
              <Text
                className="m-0 mb-6"
                style={{ fontFamily: 'Hanken Grotesk, Arial, sans-serif', fontSize: '10px', letterSpacing: '0.28em', textTransform: 'uppercase', color: '#7f7669' }}
              >
                RÉCAPITULATIF DE FORMATION
              </Text>
              <table width="100%" cellPadding="0" cellSpacing="0">
                <tbody>
                  {[
                    ['FORMATION', formationTitre],
                    ['DATE',      dateSession],
                    ['LIEU',      'Atelier Beauty Home Concept — Amiens'],
                    ['ACOMPTE',   `${acompte} € réglé`],
                    ['SOLDE',     `${solde} € à régler le dernier jour`],
                  ].map(([label, value], i, arr) => (
                    <tr key={label} style={{ borderBottom: i < arr.length - 1 ? '1px solid #e9e8e8' : 'none' }}>
                      <td
                        style={{
                          padding: '12px 0',
                          width: '130px',
                          fontFamily: 'Hanken Grotesk, Arial, sans-serif',
                          fontSize: '9px',
                          letterSpacing: '0.2em',
                          textTransform: 'uppercase',
                          color: '#4e463a',
                          opacity: 0.6,
                          verticalAlign: 'top',
                          paddingTop: '14px',
                        }}
                      >
                        {label}
                      </td>
                      <td
                        style={{
                          padding: '12px 0',
                          fontFamily: 'Hanken Grotesk, Arial, sans-serif',
                          fontSize: '14px',
                          fontWeight: 300,
                          color: '#1b1c1c',
                          lineHeight: 1.5,
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

            {/* Next steps */}
            <Section className="bg-white px-12 py-10">
              <Text
                className="m-0 mb-8"
                style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '22px', fontWeight: 400, color: '#755a2d' }}
              >
                Prochaines Étapes
              </Text>
              {[
                "Vérifiez vos pièces jointes : votre contrat signé et le livret d'accueil sont disponibles.",
                "Préparez vos outils personnels si spécifié, ou profitez du kit fourni sur place.",
                "Nous vous contacterons 48h avant la formation pour finaliser les détails logistiques.",
              ].map((step, i) => (
                <table key={i} width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: '16px' }}>
                  <tbody>
                    <tr>
                      <td
                        style={{
                          width: '28px',
                          verticalAlign: 'top',
                          paddingTop: '1px',
                        }}
                      >
                        <div
                          style={{
                            width: '22px',
                            height: '22px',
                            border: '1px solid #755a2d',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontFamily: 'Hanken Grotesk, Arial, sans-serif',
                            fontSize: '10px',
                            color: '#755a2d',
                            fontWeight: 500,
                            textAlign: 'center',
                            lineHeight: '22px',
                          }}
                        >
                          {i + 1}
                        </div>
                      </td>
                      <td
                        style={{
                          paddingLeft: '12px',
                          fontFamily: 'Hanken Grotesk, Arial, sans-serif',
                          fontSize: '14px',
                          fontWeight: 300,
                          color: '#4e463a',
                          lineHeight: 1.7,
                        }}
                      >
                        {step}
                      </td>
                    </tr>
                  </tbody>
                </table>
              ))}
            </Section>

            {/* CTA invoice */}
            {invoiceUrl && (
              <>
                <Hr style={{ borderColor: '#e9e8e8', margin: '0 48px' }} />
                <Section className="bg-white px-12 py-10">
                  <Button
                    href={invoiceUrl}
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
                    TÉLÉCHARGER MA FACTURE
                  </Button>
                </Section>
              </>
            )}

            <Hr style={{ borderColor: '#e9e8e8', margin: '0 48px' }} />

            {/* Camille signature */}
            <Section className="bg-white px-12 py-10">
              <Text
                className="m-0 mb-1"
                style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '22px', fontStyle: 'italic', color: '#755a2d' }}
              >
                Camille
              </Text>
              <Text
                className="m-0"
                style={{ fontFamily: 'Hanken Grotesk, Arial, sans-serif', fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#4e463a', fontWeight: 500 }}
              >
                DIRECTRICE PÉDAGOGIQUE
              </Text>
              <Text
                className="m-0 mt-1"
                style={{ fontFamily: 'Hanken Grotesk, Arial, sans-serif', fontSize: '9px', letterSpacing: '0.22em', textTransform: 'uppercase', color: '#7f7669', opacity: 0.6 }}
              >
                BEAUTY HOME CONCEPT ACADEMY
              </Text>
              <Text
                className="m-0 mt-8"
                style={{ fontFamily: 'Hanken Grotesk, Arial, sans-serif', fontSize: '13px', fontWeight: 300, color: '#4e463a' }}
              >
                Une question ? Contactez-nous à{' '}
                <Link href="mailto:contact@beautyhomeconcept.fr" style={{ color: '#755a2d', textDecoration: 'underline' }}>
                  contact@beautyhomeconcept.fr
                </Link>
              </Text>
            </Section>

            {/* Bottom line */}
            <Section>
              <div style={{ height: '1px', background: '#d1c5b6', width: '100%' }} />
            </Section>

            <Section className="bg-surface px-12 py-6 text-center">
              <Text
                className="m-0 mb-2"
                style={{ fontFamily: 'Playfair Display, Georgia, serif', fontSize: '14px', fontWeight: 400, color: '#1b1c1c' }}
              >
                BEAUTY HOME CONCEPT
              </Text>
              <Text
                className="m-0"
                style={{ fontFamily: 'Hanken Grotesk, Arial, sans-serif', fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#7f7669', opacity: 0.6 }}
              >
                © 2024 BEAUTY HOME CONCEPT. ÉCLAT MINIMALISTE.
              </Text>
            </Section>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
