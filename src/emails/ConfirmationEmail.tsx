import React from 'react';
import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
  Img,
} from '@react-email/components';

// ─────────────────────────────────────────────────────────────────────────────
//  EMAIL DE CONFIRMATION — DESIGN "ÉCLAT MINIMALISTE"
// ─────────────────────────────────────────────────────────────────────────────
//
//  📂 LOGO :
//     Pour afficher le logo Beauty Home Concept en haut de l'email, place
//     un fichier `logo-beauty-home-concept.png` (~ 400×400 px, fond
//     transparent ou crème) dans :
//
//        public/logo-beauty-home-concept.png
//
//     Le logo sera servi automatiquement depuis l'URL publique du site.
//     Si le fichier n'existe pas, le bandeau texte typographique prend le
//     relais (fallback élégant).
//
// ─────────────────────────────────────────────────────────────────────────────

export default function ConfirmationEmail({
  nomClient,
  formationTitre,
  dateDebut,
  dateFin,
  invoiceUrl,
  programmeUrl,
  clientType = 'particulier',
}: {
  nomClient: string;
  formationTitre: string;
  dateDebut: string;
  dateFin: string;
  invoiceUrl?: string | null;
  programmeUrl?: string | null;
  clientType?: 'particulier' | 'pro';
}) {
  // Palette "Éclat Minimaliste"
  const brown      = '#755a2d';
  const darkBrown  = '#432e04';
  const cream      = '#faf9f9';
  const ivory      = '#f4f3f3';
  const softBeige  = '#efeded';
  const textGray   = '#4e463a';
  const charcoal   = '#1b1c1c';

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || 'https://www.beautyhomeconcept.fr';
  const logoUrl = `${siteUrl}/logo-beauty-home-concept.png`;

  const docLabel = clientType === 'pro' ? 'convention de formation' : 'contrat de formation';

  return (
    <Html lang="fr">
      <Head />
      <Preview>
        Votre inscription à {formationTitre} est confirmée — Beauty Home Concept
      </Preview>
      <Body
        style={{
          backgroundColor: ivory,
          fontFamily: 'Georgia, "Times New Roman", serif',
          margin: 0,
          padding: '32px 0',
        }}
      >
        <Container
          style={{
            backgroundColor: cream,
            maxWidth: '600px',
            margin: '0 auto',
          }}
        >
          {/* ─── HEADER : logo + signature institutionnelle ─────────────── */}
          <Section
            style={{
              backgroundColor: darkBrown,
              padding: '36px 40px 28px',
              textAlign: 'center',
            }}
          >
            <Img
              src={logoUrl}
              alt="Beauty Home Concept"
              width="84"
              height="84"
              style={{
                display: 'block',
                margin: '0 auto 14px',
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            />
            <Text
              style={{
                color: '#ffffff',
                fontSize: '13px',
                letterSpacing: '5px',
                textTransform: 'uppercase',
                margin: 0,
                fontFamily: 'Helvetica, Arial, sans-serif',
              }}
            >
              Beauty Home Concept
            </Text>
            <Text
              style={{
                color: 'rgba(255,255,255,0.55)',
                fontSize: '9px',
                letterSpacing: '3px',
                textTransform: 'uppercase',
                margin: '6px 0 0',
                fontFamily: 'Helvetica, Arial, sans-serif',
              }}
            >
              Institut de Formation · Amiens
            </Text>
          </Section>

          {/* ─── BODY : message de bienvenue ─────────────────────────────── */}
          <Section style={{ padding: '44px 44px 24px' }}>
            <Text
              style={{
                color: brown,
                fontSize: '11px',
                letterSpacing: '3px',
                textTransform: 'uppercase',
                margin: '0 0 18px',
                fontFamily: 'Helvetica, Arial, sans-serif',
              }}
            >
              Inscription confirmée
            </Text>

            <Text
              style={{
                color: charcoal,
                fontSize: '30px',
                lineHeight: '1.2',
                margin: '0 0 24px',
                fontFamily: 'Georgia, serif',
                fontWeight: 400,
              }}
            >
              Bonjour {nomClient.split(' ')[0]},
            </Text>

            <Text
              style={{
                color: textGray,
                fontSize: '15px',
                lineHeight: '1.75',
                margin: '0 0 18px',
                fontFamily: 'Helvetica, Arial, sans-serif',
              }}
            >
              Nous avons le plaisir de vous confirmer votre inscription à la
              formation{' '}
              <strong style={{ color: charcoal }}>{formationTitre}</strong>.
              Votre acompte de 30 % a bien été encaissé, et votre place est
              désormais réservée.
            </Text>

            <Text
              style={{
                color: textGray,
                fontSize: '15px',
                lineHeight: '1.75',
                margin: '0 0 24px',
                fontFamily: 'Helvetica, Arial, sans-serif',
              }}
            >
              Vous trouverez ci-dessous toutes les informations utiles ainsi
              que les documents officiels en pièces jointes.
            </Text>

            {/* ─── Bloc "Rappel des dates" ──────────────────────────────── */}
            <Section
              style={{
                backgroundColor: softBeige,
                borderLeft: `3px solid ${brown}`,
                padding: '20px 24px',
                margin: '12px 0 32px',
              }}
            >
              <Text
                style={{
                  color: brown,
                  fontSize: '10px',
                  letterSpacing: '2.5px',
                  textTransform: 'uppercase',
                  margin: '0 0 10px',
                  fontFamily: 'Helvetica, Arial, sans-serif',
                }}
              >
                Votre session
              </Text>
              <Text
                style={{
                  margin: '0 0 6px',
                  color: charcoal,
                  fontSize: '14px',
                  fontFamily: 'Helvetica, Arial, sans-serif',
                }}
              >
                <strong>{formationTitre}</strong>
              </Text>
              <Text
                style={{
                  margin: '0 0 6px',
                  color: charcoal,
                  fontSize: '13px',
                  fontFamily: 'Helvetica, Arial, sans-serif',
                }}
              >
                Du <strong>{dateDebut}</strong> au <strong>{dateFin}</strong>
              </Text>
              <Text
                style={{
                  margin: 0,
                  color: charcoal,
                  fontSize: '13px',
                  fontFamily: 'Helvetica, Arial, sans-serif',
                }}
              >
                22A rue du Général Leclerc, App 13 — 80000 Amiens
              </Text>
            </Section>

            {/* ─── CTA principal : Programme + Plan d'accès ─────────────── */}
            {programmeUrl && (
              <Section style={{ marginBottom: '14px' }}>
                <Button
                  href={programmeUrl}
                  style={{
                    display: 'block',
                    backgroundColor: darkBrown,
                    color: '#ffffff',
                    fontSize: '12px',
                    letterSpacing: '2.5px',
                    textTransform: 'uppercase',
                    padding: '18px 28px',
                    textDecoration: 'none',
                    textAlign: 'center',
                    fontFamily: 'Helvetica, Arial, sans-serif',
                    fontWeight: 600,
                  }}
                >
                  Télécharger le programme détaillé et plan d'accès
                </Button>
              </Section>
            )}

            {/* ─── CTA secondaire : Facture d'acompte Stripe ────────────── */}
            {invoiceUrl && (
              <Section style={{ marginBottom: '32px' }}>
                <Button
                  href={invoiceUrl}
                  style={{
                    display: 'block',
                    backgroundColor: 'transparent',
                    color: darkBrown,
                    fontSize: '11px',
                    letterSpacing: '2.5px',
                    textTransform: 'uppercase',
                    padding: '15px 28px',
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

            {/* ─── Pièces jointes : rappel ──────────────────────────────── */}
            <Text
              style={{
                color: textGray,
                fontSize: '13px',
                lineHeight: '1.7',
                margin: '0 0 6px',
                fontFamily: 'Helvetica, Arial, sans-serif',
              }}
            >
              <strong style={{ color: charcoal }}>📎 Documents joints :</strong>
            </Text>
            <Text
              style={{
                color: textGray,
                fontSize: '13px',
                lineHeight: '1.7',
                margin: '0 0 6px',
                paddingLeft: '12px',
                fontFamily: 'Helvetica, Arial, sans-serif',
              }}
            >
              • Votre {docLabel} (signé électroniquement)
            </Text>
            <Text
              style={{
                color: textGray,
                fontSize: '13px',
                lineHeight: '1.7',
                margin: '0 0 28px',
                paddingLeft: '12px',
                fontFamily: 'Helvetica, Arial, sans-serif',
              }}
            >
              • Le règlement intérieur de l'institut
            </Text>

            <Hr style={{ borderColor: '#e3e2e2', margin: '0 0 24px' }} />

            <Text
              style={{
                color: textGray,
                fontSize: '13px',
                lineHeight: '1.7',
                margin: '0 0 12px',
                fontFamily: 'Helvetica, Arial, sans-serif',
              }}
            >
              Pour toute question, n'hésitez pas à répondre directement à cet
              email ou à nous contacter à{' '}
              <a href="mailto:beautyhomeconcept@gmail.com" style={{ color: brown }}>
                beautyhomeconcept@gmail.com
              </a>
              .
            </Text>

            <Text
              style={{
                color: charcoal,
                fontSize: '15px',
                margin: '28px 0 0',
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
              }}
            >
              À très bientôt,
              <br />
              <strong style={{ fontStyle: 'normal' }}>Camille</strong>
              <br />
              <span style={{ fontSize: '11px', color: textGray, fontFamily: 'Helvetica, Arial, sans-serif', letterSpacing: '1px' }}>
                Fondatrice — Beauty Home Concept
              </span>
            </Text>
          </Section>

          {/* ─── FOOTER ─────────────────────────────────────────────────── */}
          <Section
            style={{
              backgroundColor: darkBrown,
              padding: '18px 40px',
            }}
          >
            <Text
              style={{
                color: 'rgba(255,255,255,0.55)',
                fontSize: '9px',
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                margin: 0,
                textAlign: 'center',
                fontFamily: 'Helvetica, Arial, sans-serif',
              }}
            >
              Beauty Home Concept · beautyhomeconcept@gmail.com · Amiens (80)
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
