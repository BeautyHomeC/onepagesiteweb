import React from 'react';
import { Html, Head, Preview, Body, Container, Text } from '@react-email/components';

export default function AdminNotificationEmail({ 
  nomClient, emailClient, telephoneClient, formationTitre 
}: { 
  nomClient: string, emailClient: string, telephoneClient: string, formationTitre: string 
}) {
  return (
    <Html>
      <Head />
      <Preview>Nouvelle réservation : {formationTitre}</Preview>
      <Body style={{ backgroundColor: '#f4f3f3', fontFamily: 'sans-serif', padding: '20px' }}>
        <Container style={{ backgroundColor: '#ffffff', padding: '40px', border: '1px solid #e3e2e2', borderRadius: '4px' }}>
          <Text style={{ fontSize: '20px', fontWeight: 'bold', color: '#1b1c1c', marginBottom: '20px' }}>
            Nouvelle Réservation 🎉
          </Text>
          <Text style={{ color: '#4e463a', lineHeight: '1.6' }}>
            Une nouvelle personne s'est inscrite à la formation <strong>{formationTitre}</strong>.
          </Text>
          <div style={{ backgroundColor: '#faf9f9', padding: '15px', marginTop: '15px', border: '1px solid #e3e2e2' }}>
            <Text style={{ margin: '5px 0' }}><strong>Nom :</strong> {nomClient}</Text>
            <Text style={{ margin: '5px 0' }}><strong>Email :</strong> {emailClient}</Text>
            <Text style={{ margin: '5px 0' }}><strong>Téléphone :</strong> {telephoneClient}</Text>
          </div>
          <Text style={{ color: '#755a2d', marginTop: '30px', fontSize: '14px' }}>
            Cette réservation a bien été enregistrée dans la base de données.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
