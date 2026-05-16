import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import ConfirmationEmail from '@/emails/ConfirmationEmail';
import AdminNotificationEmail from '@/emails/AdminNotificationEmail';

// Generate the PDF contract and return it as a base64 string
async function generateContractPDF(params: {
  nomClient: string;
  emailClient: string;
  telephoneClient: string;
  formationTitre: string;
  dateDebut: string;
  dateFin: string;
  prixTotal: number;
  acompte: number;
  solde: number;
  stripeId: string;
  clientIp: string;
  consentTimestamp: string;
}): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const { width, height } = page.getSize();

  const primaryColor = rgb(0.42, 0.30, 0.15); // Warm brown matching brand
  const textColor = rgb(0.1, 0.1, 0.1);
  const lightGray = rgb(0.95, 0.95, 0.95);
  const mediumGray = rgb(0.6, 0.6, 0.6);

  let y = height - 50;

  // Header bar
  page.drawRectangle({ x: 0, y: height - 80, width, height: 80, color: primaryColor });
  page.drawText('BEAUTY HOME CONCEPT', { x: 40, y: height - 45, size: 16, font: helveticaBold, color: rgb(1, 1, 1) });
  page.drawText('CONVENTION DE FORMATION PROFESSIONNELLE', { x: 40, y: height - 65, size: 10, font: helvetica, color: rgb(0.9, 0.85, 0.75) });

  y = height - 110;

  // Document info
  page.drawText(`Référence : ${params.stripeId}`, { x: 40, y, size: 8, font: helvetica, color: mediumGray });
  page.drawText(`Émis le : ${new Date().toLocaleDateString('fr-FR')}`, { x: 370, y, size: 8, font: helvetica, color: mediumGray });

  y -= 30;
  page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 0.5, color: lightGray });

  // Section: Parties
  y -= 25;
  page.drawText('PARTIES À LA CONVENTION', { x: 40, y, size: 11, font: helveticaBold, color: primaryColor });

  y -= 20;
  page.drawText('Organisme de formation :', { x: 40, y, size: 9, font: helveticaBold, color: textColor });
  y -= 14;
  page.drawText('Beauty Home Concept — Camille Grignon', { x: 40, y, size: 9, font: helvetica, color: textColor });
  y -= 12;
  page.drawText('22A rue du Général Leclerc, App 13, 80000 Amiens', { x: 40, y, size: 9, font: helvetica, color: textColor });
  y -= 12;
  page.drawText('SIRET : (à renseigner) — N° déclaration d\'activité : (à renseigner)', { x: 40, y, size: 9, font: helvetica, color: textColor });

  y -= 20;
  page.drawText('Stagiaire :', { x: 40, y, size: 9, font: helveticaBold, color: textColor });
  y -= 14;
  page.drawText(`Nom : ${params.nomClient}`, { x: 40, y, size: 9, font: helvetica, color: textColor });
  y -= 12;
  page.drawText(`Email : ${params.emailClient}`, { x: 40, y, size: 9, font: helvetica, color: textColor });
  y -= 12;
  page.drawText(`Téléphone : ${params.telephoneClient}`, { x: 40, y, size: 9, font: helvetica, color: textColor });

  y -= 25;
  page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 0.5, color: lightGray });

  // Section: Formation
  y -= 25;
  page.drawText('DÉSIGNATION DE LA FORMATION', { x: 40, y, size: 11, font: helveticaBold, color: primaryColor });

  y -= 20;
  const infoRows = [
    ['Intitulé de la formation', params.formationTitre],
    ['Date de début', params.dateDebut],
    ['Date de fin', params.dateFin],
    ['Lieu', '22A rue du Général Leclerc, App 13, 80000 Amiens'],
    ['Durée', '7 heures (9h30 — 17h)'],
    ['Modalité', 'Présentiel — Groupe de 1 à 2 participants'],
  ];

  for (const [label, value] of infoRows) {
    page.drawRectangle({ x: 40, y: y - 4, width: 515, height: 16, color: lightGray, opacity: 0.5 });
    page.drawText(label, { x: 45, y, size: 9, font: helveticaBold, color: textColor });
    page.drawText(value, { x: 260, y, size: 9, font: helvetica, color: textColor });
    y -= 20;
  }

  y -= 15;
  page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 0.5, color: lightGray });

  // Section: Financials
  y -= 25;
  page.drawText('CONDITIONS FINANCIÈRES', { x: 40, y, size: 11, font: helveticaBold, color: primaryColor });

  y -= 20;
  page.drawText(`Prix total de la formation :`, { x: 45, y, size: 9, font: helveticaBold, color: textColor });
  page.drawText(`${params.prixTotal.toFixed(2)} € TTC`, { x: 400, y, size: 9, font: helveticaBold, color: textColor });

  y -= 16;
  page.drawText(`Acompte réglé (30%) :`, { x: 45, y, size: 9, font: helvetica, color: textColor });
  page.drawText(`${params.acompte.toFixed(2)} €`, { x: 400, y, size: 9, font: helvetica, color: textColor });

  y -= 16;
  page.drawText(`Solde restant dû :`, { x: 45, y, size: 9, font: helvetica, color: textColor });
  page.drawText(`${params.solde.toFixed(2)} €`, { x: 400, y, size: 9, font: helvetica, color: textColor });

  y -= 12;
  page.drawText('(Le solde est à régler au plus tard le premier jour de la formation)', { x: 45, y, size: 8, font: helvetica, color: mediumGray });

  y -= 30;
  page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 0.5, color: lightGray });

  // Section: Audit Trail (Signature électronique)
  y -= 25;
  page.drawText('SIGNATURE ÉLECTRONIQUE — AUDIT TRAIL', { x: 40, y, size: 11, font: helveticaBold, color: primaryColor });

  y -= 20;
  page.drawText(
    'La présente convention a été acceptée par consentement numérique et paiement sécurisé.',
    { x: 40, y, size: 9, font: helvetica, color: textColor }
  );
  y -= 16;
  page.drawText(`Date et heure du consentement : ${new Date(params.consentTimestamp).toLocaleString('fr-FR')}`, { x: 40, y, size: 9, font: helvetica, color: textColor });
  y -= 12;
  page.drawText(`Adresse IP du signataire : ${params.clientIp}`, { x: 40, y, size: 9, font: helvetica, color: textColor });
  y -= 12;
  page.drawText(`Référence transaction Stripe : ${params.stripeId}`, { x: 40, y, size: 9, font: helvetica, color: textColor });

  y -= 20;
  page.drawRectangle({ x: 40, y: y - 18, width: 515, height: 32, color: rgb(0.95, 0.90, 0.80), borderColor: primaryColor, borderWidth: 0.5 });
  page.drawText(
    `Validé par consentement numérique et paiement sécurisé Stripe.`,
    { x: 48, y: y - 5, size: 8, font: helveticaBold, color: primaryColor }
  );
  page.drawText(
    `Date : ${params.consentTimestamp} · IP : ${params.clientIp} · Réf Stripe : ${params.stripeId}`,
    { x: 48, y: y - 16, size: 7, font: helvetica, color: primaryColor }
  );

  // Footer
  page.drawRectangle({ x: 0, y: 0, width, height: 30, color: primaryColor });
  page.drawText('Beauty Home Concept · beautyhomeconcept@gmail.com · www.beautyhomeconcept.fr', {
    x: 40, y: 10, size: 7, font: helvetica, color: rgb(0.9, 0.85, 0.75)
  });

  return await pdfDoc.save();
}

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-04-22.dahlia' });
  const resend = new Resend(process.env.RESEND_API_KEY);

  const payload = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    const supabaseSessionId = session.metadata?.supabase_session_id;
    const formationTitre = session.metadata?.formation_titre || 'Formation';
    const formationPrix = parseFloat(session.metadata?.formation_prix || '0');
    const dateDebutRaw = session.metadata?.date_debut || '';
    const dateFinRaw = session.metadata?.date_fin || '';
    const clientIp = session.metadata?.client_ip || 'IP non capturée';
    const consentTimestamp = session.metadata?.consent_timestamp || new Date().toISOString();
    
    const customerDetails = session.customer_details;
    const nomClient = customerDetails?.name || 'Client Inconnu';
    const emailClient = customerDetails?.email || '';
    const telephoneClient = customerDetails?.phone || 'Non renseigné';
    const stripeId = session.payment_intent as string || session.id;

    if (!supabaseSessionId) {
      console.error('Erreur: Aucun supabase_session_id trouvé dans les métadonnées.');
      // Return 200 to prevent Stripe from retrying an unrecoverable error
      return NextResponse.json({ received: true });
    }

    const supabase = await createAdminClient();

    // Idempotency check: skip if already processed
    const { data: existing } = await supabase
      .from('reservations')
      .select('id')
      .eq('stripe_payment_id', stripeId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ received: true });
    }

    // 1. Insertion de la réservation
    const { error: insertError } = await supabase.from('reservations').insert({
      session_id: supabaseSessionId,
      nom_client: nomClient,
      email_client: emailClient,
      telephone_client: telephoneClient,
      stripe_payment_id: stripeId,
    });

    if (insertError) {
      console.error('Erreur insertion réservation:', insertError);
      // Return 200 so Stripe doesn't retry — the error is logged for manual review
      return NextResponse.json({ received: true });
    }

    // 2. Décrémenter les places et récupérer les données de session
    const { data: dbSession } = await supabase
      .from('sessions')
      .select('places_disponibles, date_debut, date_fin')
      .eq('id', supabaseSessionId)
      .single();

    if (dbSession) {
      // Atomic decrement via SQL function (avoids TOCTOU race condition)
      const { error: rpcError } = await supabase.rpc('decrement_places', { session_id: supabaseSessionId });
      if (rpcError) {
        // Fallback if function not yet deployed
        await supabase.from('sessions').update({
          places_disponibles: Math.max(0, dbSession.places_disponibles - 1)
        }).eq('id', supabaseSessionId);
      }
      
      const dateDebut = new Date(dateDebutRaw || dbSession.date_debut).toLocaleDateString('fr-FR');
      const dateFin = new Date(dateFinRaw || dbSession.date_fin).toLocaleDateString('fr-FR');
      const acompte = formationPrix * 0.3;
      const solde = formationPrix * 0.7;

      try {
        // 3. Générer le PDF du contrat
        const pdfBytes = await generateContractPDF({
          nomClient,
          emailClient,
          telephoneClient,
          formationTitre,
          dateDebut,
          dateFin,
          prixTotal: formationPrix,
          acompte,
          solde,
          stripeId,
          clientIp,
          consentTimestamp,
        });

        const pdfBuffer = Buffer.from(pdfBytes);
        const pdfBase64 = pdfBuffer.toString('base64');
        const pdfFilename = `contracts/${stripeId}.pdf`;

        // 3b. Stocker le PDF dans Supabase Storage (archive permanente)
        const { error: storageError } = await supabase.storage
          .from('formations_images')
          .upload(pdfFilename, pdfBuffer, {
            contentType: 'application/pdf',
            upsert: true,
          });
        if (storageError) {
          console.error('Erreur stockage PDF Supabase:', storageError.message);
        }

        // 4. Mail Client avec PDF en pièce jointe
        await resend.emails.send({
          from: 'Beauty Home Concept <contact@beautyhomeconcept.fr>',
          to: [emailClient],
          subject: `Confirmation de réservation — ${formationTitre}`,
          react: ConfirmationEmail({ nomClient, formationTitre, dateDebut, dateFin }),
          attachments: [
            {
              filename: `Convention_Formation_${formationTitre.replace(/\s/g, '_')}.pdf`,
              content: pdfBase64,
            }
          ]
        });

        // 5. Mail Admin avec PDF en copie
        await resend.emails.send({
          from: 'Beauty Home Concept <contact@beautyhomeconcept.fr>',
          to: ['beautyhomeconcept@gmail.com'],
          subject: `Nouvelle Réservation : ${formationTitre} — ${nomClient}`,
          react: AdminNotificationEmail({ nomClient, emailClient, telephoneClient, formationTitre }),
          attachments: [
            {
              filename: `Convention_Formation_${nomClient.replace(/\s/g, '_')}_${formationTitre.replace(/\s/g, '_')}.pdf`,
              content: pdfBase64,
            }
          ]
        });

      } catch (emailError) {
        console.error('Erreur envoi email/PDF (Resend):', emailError);
      }
    }
  }

  return NextResponse.json({ received: true });
}
