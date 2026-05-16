import React from 'react';
import { Html, Head, Preview, Body, Container, Section, Text, Button, Hr, Row, Column } from '@react-email/components';

export default function ConfirmationEmail({
  nomClient,
  formationTitre,
  dateDebut,
  dateFin,
  invoiceUrl,
  programmeUrl,
}: {
  nomClient: string;
  formationTitre: string;
  dateDebut: string;
  dateFin: string;
  invoiceUrl?: string | null;
  programmeUrl?: string | null;
}) {
  const brown = '#755a2d';
  const darkBrown = '#432e04';
  const cream = '#faf9f9';
  const textGray = '#4e463a';

  return (
    <Html lang="fr">
      <Head />
      <Preview>Votre inscription à {formationTitre} est confirmée — Beauty Home Concept</Preview>
      <Body style={{ backgroundColor: '#f4f3f3', fontFamily: 'Georgia, serif', margin: 0, padding: '32px 0' }}>
        <Container style={{ backgroundColor: cream, maxWidth: '560px', margin: '0 auto' }}>

          {/* Header */}
          <Section style={{ backgroundColor: darkBrown, padding: '32px 40px' }}>
            <Text style={{ color: '#ffffff', fontSize: '11px', letterSpacing: '4px', textTransform: 'uppercase', margin: 0, fontFamily: 'Helvetica, Arial, sans-serif' }}>
              Beauty Home Concept
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: '9px', letterSpacing: '2px', textTransform: 'uppercase', margin: '6px 0 0', fontFamily: 'Helvetica, Arial, sans-serif' }}>
              Institut de Formation · Amiens
            </Text>
          </Section>

          {/* Body */}
          <Section style={{ padding: '40px 40px 32px' }}>
            <Text style={{ color: brown, fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', margin: '0 0 16px', fontFamily: 'Helvetica, Arial, sans-serif' }}>
              Inscription confirmée
            </Text>
            <Text style={{ color: '#1b1c1c', fontSize: '28px', lineHeight: '1.2', margin: '0 0 24px', fontFamily: 'Georgia, serif', fontWeight: 400 }}>
              Bonjour {nomClient},
            </Text>
            <Text style={{ color: textGray, fontSize: '15px', lineHeight: '1.7', margin: '0 0 16px', fontFamily: 'Helvetica, Arial, sans-serif' }}>
              Nous avons le plaisir de vous confirmer votre inscription à la formation <strong style={{ color: '#1b1c1c' }}>{formationTitre}</strong>. Votre acompte de 30 % a bien été encaissé.
            </Text>

            {/* Session info box */}
            <Section style={{ backgroundColor: '#efeded', borderLeft: `3px solid ${brown}`, padding: '16px 20px', margin: '24px 0' }}>
              <Text style={{ margin: '0 0 8px', color: '#1b1c1c', fontSize: '13px', fontFamily: 'Helvetica, Arial, sans-serif' }}>
                <strong>Formation :</strong> {formationTitre}
              </Text>
              <Text style={{ margin: '0 0 8px', color: '#1b1c1c', fontSize: '13px', fontFamily: 'Helvetica, Arial, sans-serif' }}>
                <strong>Dates :</strong> Du {dateDebut} au {dateFin}
              </Text>
              <Text style={{ margin: 0, color: '#1b1c1c', fontSize: '13px', fontFamily: 'Helvetica, Arial, sans-serif' }}>
                <strong>Lieu :</strong> 22A rue du Général Leclerc, App 13 — 80000 Amiens
              </Text>
            </Section>

            <Text style={{ color: textGray, fontSize: '14px', lineHeight: '1.7', margin: '0 0 32px', fontFamily: 'Helvetica, Arial, sans-serif' }}>
              Vous trouverez en pièces jointes votre <strong style={{ color: '#1b1c1c' }}>contrat de formation signé</strong> ainsi que le <strong style={{ color: '#1b1c1c' }}>règlement intérieur</strong> de l'institut.
            </Text>

            {/* CTA Buttons */}
            {programmeUrl && (
              <Section style={{ marginBottom: '12px' }}>
                <Button
                  href={programmeUrl}
                  style={{
                    display: 'block',
                    backgroundColor: darkBrown,
                    color: '#ffffff',
                    fontSize: '11px',
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    padding: '14px 24px',
                    textDecoration: 'none',
                    textAlign: 'center',
                    fontFamily: 'Helvetica, Arial, sans-serif',
                  }}
                >
                  Télécharger le programme détaillé et plan d'accès
                </Button>
              </Section>
            )}

            {invoiceUrl && (
              <Section style={{ marginBottom: '32px' }}>
                <Button
                  href={invoiceUrl}
                  style={{
                    display: 'block',
                    backgroundColor: 'transparent',
                    color: darkBrown,
                    fontSize: '11px',
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    padding: '13px 24px',
                    textDecoration: 'none',
                    textAlign: 'center',
                    fontFamily: 'Helvetica, Arial, sans-serif',
                    border: `1px solid ${darkBrown}`,
                  }}
                >
                  Voir ma facture d'acompte
                </Button>
              </Section>
            )}

            <Hr style={{ borderColor: '#e3e2e2', margin: '0 0 24px' }} />

            <Text style={{ color: textGray, fontSize: '13px', lineHeight: '1.7', margin: '0 0 8px', fontFamily: 'Helvetica, Arial, sans-serif' }}>
              Pour toute question, répondez directement à cet email ou contactez-nous à{' '}
              <a href="mailto:beautyhomeconcept@gmail.com" style={{ color: brown }}>beautyhomeconcept@gmail.com</a>.
            </Text>

            <Text style={{ color: '#1b1c1c', fontSize: '14px', margin: '24px 0 0', fontFamily: 'Georgia, serif' }}>
              À très bientôt,<br />
              <strong>Camille</strong>
            </Text>
          </Section>

          {/* Footer */}
          <Section style={{ backgroundColor: darkBrown, padding: '16px 40px' }}>
            <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase', margin: 0, textAlign: 'center', fontFamily: 'Helvetica, Arial, sans-serif' }}>
              Beauty Home Concept · beautyhomeconcept@gmail.com · Amiens (80)
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}
