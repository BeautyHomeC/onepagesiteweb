import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-04-22.dahlia',
    });

    const body = await req.json();
    const { session_id, consent } = body;

    if (!session_id) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Vérification du consentement triple (CGV + RGPD + contrat)
    if (!consent?.cgv || !consent?.rgpd || !consent?.contrat) {
      return NextResponse.json(
        { error: 'Vous devez accepter les CGV, la RGPD et le contrat pour continuer.' },
        { status: 400 },
      );
    }

    const siteOrigin = new URL(req.url).origin;

    const supabase = await createAdminClient();

    // 1. Fetch the session and check availability
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('*, formations(*)')
      .eq('id', session_id)
      .single();

    if (sessionError || !sessionData) {
      return NextResponse.json({ error: 'Session introuvable' }, { status: 404 });
    }

    if (sessionData.places_disponibles <= 0) {
      return NextResponse.json({ error: 'Désolé, cette session est complète.' }, { status: 400 });
    }

    const formation = sessionData.formations;

      // Capture IP pour l'audit trail (signature électronique)
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() 
        || req.headers.get('x-real-ip') 
        || 'IP non disponible';

      // 2. Create Stripe Checkout Session
      const checkoutSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        phone_number_collection: {
          enabled: true,
        },
        billing_address_collection: 'required',
        customer_creation: 'always',
        // ── Facture légale auto-générée par Stripe (PDF + page hébergée) ────
        invoice_creation: {
          enabled: true,
        },
        // ── Champs collectés au checkout pour le contrat de formation ───────
        //    • Instagram      → optionnel, reporté tel quel dans le contrat
        //    • Raison sociale → si remplie, le webhook génère une CONVENTION
        //                        (au lieu d'un contrat particulier)
        //    • N° SIRET       → idem (pro)
        custom_fields: [
          {
            key: 'instagram',
            label: { type: 'custom', custom: 'Compte Instagram (optionnel)' },
            type: 'text',
            optional: true,
          },
          {
            key: 'raison_sociale',
            label: { type: 'custom', custom: 'Raison sociale (si professionnel)' },
            type: 'text',
            optional: true,
          },
          {
            key: 'siret',
            label: { type: 'custom', custom: 'N° SIRET (si professionnel)' },
            type: 'text',
            optional: true,
          },
        ],
        // ── Consentement légal RGPD/CGV directement intégré au paiement ────
        consent_collection: {
          terms_of_service: 'required',
        },
        custom_text: {
          terms_of_service_acceptance: {
            message:
              "J'accepte les [Conditions Générales de Vente](https://www.beautyhomeconcept.fr/cgv), le [Règlement Intérieur](https://www.beautyhomeconcept.fr/reglement-interieur), la [Politique de Confidentialité (RGPD)](https://www.beautyhomeconcept.fr/mentions-legales) et le contrat de formation qui me sera envoyé par email après paiement.",
          },
        },
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: {
                name: `Acompte (30%) - ${formation.titre}`,
                description: `Session du ${new Date(sessionData.date_debut).toLocaleDateString('fr-FR')} au ${new Date(sessionData.date_fin).toLocaleDateString('fr-FR')}. Le reste sera à régler plus tard.`,
                images: formation.image_url ? [formation.image_url] : [],
              },
              unit_amount: Math.round(formation.prix * 0.3 * 100),
            },
            quantity: 1,
          },
        ],
        metadata: {
          supabase_session_id: session_id,
          formation_titre: formation.titre,
          formation_prix: String(formation.prix),
          date_debut: sessionData.date_debut,
          date_fin: sessionData.date_fin,
          // Variables surchargeables par formation (cf. webhook stripe)
          duree_formation: formation.duree_formation || formation.duree || '',
          horaire:         formation.horaire || '9H30 / 17H',
          nombre_eleves:   String(formation.nombre_eleves || 2),
          programme_file:  formation.programme_file || '',
          // Audit trail légal : preuve de consentement triple
          client_ip: ip,
          consent_timestamp: consent?.timestamp || new Date().toISOString(),
          consent_cgv: consent?.cgv ? 'true' : 'false',
          consent_rgpd: consent?.rgpd ? 'true' : 'false',
          consent_contrat: consent?.contrat ? 'true' : 'false',
        },
        success_url: `${siteOrigin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteOrigin}/#formations`,
      });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error('Erreur Checkout:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
