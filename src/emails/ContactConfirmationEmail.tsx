import React from 'react'
import { Html, Head, Preview, Body, Container, Text, Hr } from '@react-email/components'

interface Props {
  prenom: string
  message: string
}

export default function ContactConfirmationEmail({ prenom, message }: Props) {
  const gold = '#755a2d'
  const bg   = '#faf9f9'

  return (
    <Html>
      <Head />
      <Preview>Votre message a bien été reçu</Preview>
      <Body style={{ backgroundColor: bg, fontFamily: 'Georgia, serif', padding: '32px 16px' }}>
        <Container style={{ backgroundColor: '#fff', maxWidth: 560, margin: '0 auto', border: '1px solid #e3e2e2' }}>
          <div style={{ backgroundColor: gold, padding: '32px 40px' }}>
            <Text style={{ color: '#fff', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'sans-serif', margin: 0 }}>
              Beauty Home Concept
            </Text>
            <Text style={{ color: '#fff', fontSize: 22, margin: '8px 0 0', fontWeight: 400 }}>
              Message bien reçu
            </Text>
          </div>
          <div style={{ padding: '32px 40px' }}>
            <Text style={{ fontSize: 16, color: '#1b1c1c', marginBottom: 24 }}>
              Bonjour {prenom},
            </Text>
            <Text style={{ fontSize: 14, color: '#4e463a', lineHeight: 1.7, marginBottom: 24 }}>
              Votre message a bien été reçu. Je vous répondrai dans les plus brefs délais, généralement sous 24 à 48 heures.
            </Text>
            <Hr style={{ borderColor: '#e3e2e2', margin: '0 0 24px' }} />
            <Text style={{ fontSize: 12, color: '#7f7669', fontFamily: 'sans-serif', lineHeight: 1.5, marginBottom: 8 }}>
              Rappel de votre message :
            </Text>
            <Text style={{ fontSize: 13, color: '#4e463a', lineHeight: 1.7, fontStyle: 'italic', margin: 0 }}>
              &ldquo;{message.length > 300 ? message.slice(0, 300) + '…' : message}&rdquo;
            </Text>
            <Hr style={{ borderColor: '#e3e2e2', margin: '24px 0' }} />
            <Text style={{ fontSize: 12, color: '#7f7669', fontFamily: 'sans-serif', lineHeight: 1.6, margin: 0 }}>
              Beauty Home Concept — Amiens{' '}
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
