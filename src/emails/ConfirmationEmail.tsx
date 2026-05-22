import React from 'react'
import { Html, Head, Preview, Body, Container, Text, Button, Hr } from '@react-email/components'

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
  acompte, solde, invoiceUrl, clientType,
}: Props) {
  const gold = '#755a2d'
  const bg   = '#faf9f9'
  const docLabel = clientType === 'pro' ? 'convention' : 'contrat'

  return (
    <Html>
      <Head />
      <Preview>Votre inscription est confirmée — {formationTitre}</Preview>
      <Body style={{ backgroundColor: bg, fontFamily: 'Georgia, serif', padding: '32px 16px' }}>
        <Container style={{ backgroundColor: '#fff', maxWidth: 560, margin: '0 auto', border: '1px solid #e3e2e2' }}>
          <div style={{ backgroundColor: gold, padding: '32px 40px' }}>
            <Text style={{ color: '#fff', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'sans-serif', margin: 0 }}>
              Beauty Home Concept
            </Text>
            <Text style={{ color: '#fff', fontSize: 22, margin: '8px 0 0', fontWeight: 400 }}>
              Inscription confirmée
            </Text>
          </div>

          <div style={{ padding: '32px 40px' }}>
            <Text style={{ fontSize: 16, color: '#1b1c1c', marginBottom: 24 }}>
              Bonjour {prenom},
            </Text>
            <Text style={{ fontSize: 14, color: '#4e463a', lineHeight: 1.7, marginBottom: 24 }}>
              Votre inscription à la formation <strong>{formationTitre}</strong> {dateSession} est bien
              confirmée. Vous trouverez en pièce jointe votre {docLabel} de formation signé, le programme
              détaillé, le livret d'accueil et le règlement intérieur.
            </Text>

            <div style={{ backgroundColor: bg, padding: 20, marginBottom: 24, border: '1px solid #e3e2e2' }}>
              <Text style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'sans-serif', color: gold, margin: '0 0 12px' }}>
                Récapitulatif financier
              </Text>
              <Text style={{ fontSize: 13, color: '#1b1c1c', margin: '4px 0', fontFamily: 'sans-serif' }}>
                Acompte réglé : <strong>{acompte} €</strong>
              </Text>
              <Text style={{ fontSize: 13, color: '#4e463a', margin: '4px 0', fontFamily: 'sans-serif' }}>
                Solde restant : {solde} € — à régler le dernier jour de la formation (espèces, virement ou carte).
              </Text>
            </div>

            {invoiceUrl && (
              <Button
                href={invoiceUrl}
                style={{
                  backgroundColor: gold, color: '#fff', padding: '12px 24px',
                  fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase',
                  fontFamily: 'sans-serif', textDecoration: 'none',
                  display: 'inline-block', marginBottom: 24,
                }}
              >
                Voir ma facture →
              </Button>
            )}

            <Hr style={{ borderColor: '#e3e2e2', margin: '24px 0' }} />
            <Text style={{ fontSize: 12, color: '#7f7669', fontFamily: 'sans-serif', lineHeight: 1.6 }}>
              En cas de question :{' '}
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
