import React from 'react';
import { Html, Head, Preview, Body, Container, Section, Text } from '@react-email/components';

export default function ConfirmationEmail({ 
  nomClient, formationTitre, dateDebut, dateFin 
}: { 
  nomClient: string, formationTitre: string, dateDebut: string, dateFin: string 
}) {
  return (
    <Html>
      <Head />
      <Preview>Votre réservation chez Beauty Home Concept</Preview>
      <Body style={{ backgroundColor: '#faf9f9', fontFamily: 'sans-serif', padding: '20px' }}>
        <Container style={{ backgroundColor: '#ffffff', padding: '40px', border: '1px solid #e3e2e2', borderRadius: '4px' }}>
          <Text style={{ color: '#755a2d', fontSize: '24px', textAlign: 'center', marginBottom: '20px', letterSpacing: '2px', fontWeight: 'bold' }}>
            BEAUTY HOME CONCEPT
          </Text>
          <Text style={{ color: '#1b1c1c', fontSize: '18px' }}>Bonjour {nomClient},</Text>
          <Text style={{ color: '#4e463a', lineHeight: '1.6' }}>
            Nous avons le plaisir de vous confirmer votre inscription à la formation <strong>{formationTitre}</strong>.
          </Text>
          <Section style={{ backgroundColor: '#f4f3f3', padding: '20px', marginTop: '20px', marginBottom: '20px', borderRadius: '4px' }}>
            <Text style={{ margin: 0, color: '#1b1c1c' }}><strong>Dates :</strong> Du {dateDebut} au {dateFin}</Text>
            <Text style={{ margin: 0, color: '#1b1c1c', marginTop: '10px' }}><strong>Lieu :</strong> Institut Beauty Home Concept, Amiens</Text>
          </Section>
          <Text style={{ color: '#4e463a', lineHeight: '1.6' }}>
            Vous trouverez en pièce jointe votre convention de formation signée.
            Nous sommes impatients de vous recevoir et de partager notre expertise.
          </Text>
          <Text style={{ color: '#1b1c1c', marginTop: '40px' }}>
            À très bientôt,<br/><strong>Camille</strong>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
