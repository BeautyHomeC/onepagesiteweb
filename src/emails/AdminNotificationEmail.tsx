import React from 'react'
import { Html, Head, Preview, Body, Container, Text, Button, Hr } from '@react-email/components'

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
  formationTitre, dateSession, acompte, reservationId, siteUrl,
}: Props) {
  const gold = '#755a2d'
  const bg   = '#faf9f9'

  const row = (label: string, value: string | undefined) => value ? (
    <Text key={label} style={{ fontSize: 13, color: '#1b1c1c', margin: '4px 0', fontFamily: 'sans-serif' }}>
      <span style={{ color: '#7f7669' }}>{label} : </span>{value}
    </Text>
  ) : null

  return (
    <Html>
      <Head />
      <Preview>Nouvelle inscription — {nomClient} · {formationTitre}</Preview>
      <Body style={{ backgroundColor: bg, fontFamily: 'Georgia, serif', padding: '32px 16px' }}>
        <Container style={{ backgroundColor: '#fff', maxWidth: 560, margin: '0 auto', border: '1px solid #e3e2e2' }}>
          <div style={{ backgroundColor: '#1b1c1c', padding: '24px 40px' }}>
            <Text style={{ color: gold, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'sans-serif', margin: 0 }}>
              Admin · Beauty Home Concept
            </Text>
            <Text style={{ color: '#fff', fontSize: 20, margin: '8px 0 0', fontWeight: 400 }}>
              Nouvelle inscription
            </Text>
          </div>

          <div style={{ padding: '32px 40px' }}>
            <Text style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'sans-serif', color: gold, margin: '0 0 12px' }}>
              Formation
            </Text>
            {row('Formation', formationTitre)}
            {row('Date', dateSession)}
            {row('Acompte reçu', `${acompte} €`)}

            <Hr style={{ borderColor: '#e3e2e2', margin: '20px 0' }} />

            <Text style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'sans-serif', color: gold, margin: '0 0 12px' }}>
              Élève — {clientType === 'pro' ? 'Professionnel' : 'Particulier'}
            </Text>
            {row('Nom', nomClient)}
            {row('Email', emailClient)}
            {row('Téléphone', telephoneClient)}
            {row('Adresse', adresse)}
            {clientType === 'pro' && (
              <>
                {row('Raison sociale', raisonSociale)}
                {row('SIRET', siret)}
                {row('Instagram', instagram)}
              </>
            )}

            <Hr style={{ borderColor: '#e3e2e2', margin: '20px 0' }} />

            <Button
              href={`${siteUrl}/admin/reservations`}
              style={{
                backgroundColor: gold, color: '#fff', padding: '12px 24px',
                fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase',
                fontFamily: 'sans-serif', textDecoration: 'none', display: 'inline-block',
              }}
            >
              Voir dans l'admin →
            </Button>
          </div>
        </Container>
      </Body>
    </Html>
  )
}
