import React from 'react'
import { Html, Head, Preview, Body, Container, Text, Button, Hr } from '@react-email/components'

interface Props {
  prenom: string
  formationTitre: string
  dateSession: string
  bookingUrl: string
}

export default function WaitlistEmail({ prenom, formationTitre, dateSession, bookingUrl }: Props) {
  const gold = '#755a2d'
  const bg   = '#faf9f9'

  return (
    <Html>
      <Head />
      <Preview>Une place vient de se libérer — {formationTitre}</Preview>
      <Body style={{ backgroundColor: bg, fontFamily: 'Georgia, serif', padding: '32px 16px' }}>
        <Container style={{ backgroundColor: '#fff', maxWidth: 560, margin: '0 auto', border: '1px solid #e3e2e2' }}>
          <div style={{ backgroundColor: gold, padding: '32px 40px' }}>
            <Text style={{ color: '#fff', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'sans-serif', margin: 0 }}>
              Beauty Home Concept
            </Text>
            <Text style={{ color: '#fff', fontSize: 22, margin: '8px 0 0', fontWeight: 400 }}>
              Une place s'est libérée
            </Text>
          </div>

          <div style={{ padding: '32px 40px' }}>
            <Text style={{ fontSize: 16, color: '#1b1c1c', marginBottom: 24 }}>
              Bonjour {prenom},
            </Text>
            <Text style={{ fontSize: 14, color: '#4e463a', lineHeight: 1.7, marginBottom: 24 }}>
              Bonne nouvelle ! Une place vient de se libérer pour la formation{' '}
              <strong>{formationTitre}</strong> {dateSession}.
            </Text>
            <Text style={{ fontSize: 14, color: '#4e463a', lineHeight: 1.7, marginBottom: 32 }}>
              Les places sont limitées. Réservez dès maintenant avant que cette place ne soit prise
              par un autre candidat sur la liste d'attente.
            </Text>

            <Button
              href={bookingUrl}
              style={{
                backgroundColor: gold, color: '#fff', padding: '14px 28px',
                fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase',
                fontFamily: 'sans-serif', textDecoration: 'none',
                display: 'inline-block', marginBottom: 32,
              }}
            >
              Réserver ma place →
            </Button>

            <Hr style={{ borderColor: '#e3e2e2', margin: '24px 0' }} />
            <Text style={{ fontSize: 12, color: '#7f7669', fontFamily: 'sans-serif', lineHeight: 1.6 }}>
              Si vous ne souhaitez plus être informée des disponibilités, ignorez simplement cet email.
              {' '}Questions :{' '}
              <a href="mailto:contact@beautyhomeconcept.fr" style={{ color: gold }}>
                contact@beautyhomeconcept.fr
              </a>
            </Text>
          </div>
        </Container>
      </Body>
    </Html>
  )
}
