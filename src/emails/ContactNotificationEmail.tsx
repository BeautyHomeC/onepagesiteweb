import React from 'react'
import { Html, Head, Preview, Body, Container, Text, Hr } from '@react-email/components'

interface Props {
  prenom: string
  nom: string
  email: string
  message: string
}

export default function ContactNotificationEmail({ prenom, nom, email, message }: Props) {
  const gold = '#755a2d'
  const bg   = '#faf9f9'

  return (
    <Html>
      <Head />
      <Preview>Nouveau message de {prenom} {nom}</Preview>
      <Body style={{ backgroundColor: bg, fontFamily: 'Georgia, serif', padding: '32px 16px' }}>
        <Container style={{ backgroundColor: '#fff', maxWidth: 560, margin: '0 auto', border: '1px solid #e3e2e2' }}>
          <div style={{ backgroundColor: gold, padding: '32px 40px' }}>
            <Text style={{ color: '#fff', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'sans-serif', margin: 0 }}>
              Beauty Home Concept
            </Text>
            <Text style={{ color: '#fff', fontSize: 22, margin: '8px 0 0', fontWeight: 400 }}>
              Nouveau message de contact
            </Text>
          </div>
          <div style={{ padding: '32px 40px' }}>
            <Text style={{ fontSize: 14, color: '#4e463a', lineHeight: 1.7, margin: '0 0 8px' }}>
              <strong>De :</strong> {prenom} {nom}
            </Text>
            <Text style={{ fontSize: 14, color: '#4e463a', lineHeight: 1.7, margin: '0 0 24px' }}>
              <strong>Email :</strong>{' '}
              <a href={`mailto:${email}`} style={{ color: gold }}>{email}</a>
            </Text>
            <Hr style={{ borderColor: '#e3e2e2', margin: '0 0 24px' }} />
            <Text style={{ fontSize: 14, color: '#1b1c1c', lineHeight: 1.8, whiteSpace: 'pre-wrap', margin: 0 }}>
              {message}
            </Text>
          </div>
        </Container>
      </Body>
    </Html>
  )
}
