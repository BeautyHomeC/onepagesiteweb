import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { readFileSync } from 'fs';
import { join } from 'path';
import ConfirmationEmail from '@/emails/ConfirmationEmail';
import AdminNotificationEmail from '@/emails/AdminNotificationEmail';

// ─────────────────────────────────────────────────────────────────────────────
// Charge le template PDF réel et ajoute une page de personnalisation à la fin.
// Le template original n'est PAS modifié — les données client sont sur une
// nouvelle page ajoutée, ce qui préserve la mise en page du contrat.
// ─────────────────────────────────────────────────────────────────────────────
async function buildContractPDF(params: {
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
}): Promise<Buffer> {
  // ── 1. Charger le template contrat depuis public/documents/
  // REMPLACE contrat-template.pdf par ton vrai fichier si tu en as un autre.
  const templatePath = join(process.cwd(), 'public', 'documents', 'contrat-template.pdf');
  const templateBytes = readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);

  // ── 2. Ajouter une page de personnalisation (données client + audit trail)
  const page = pdfDoc.addPage([595, 842]); // A4
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const { width, height } = page.getSize();

  const brown = rgb(0.42, 0.30, 0.15);
  const dark = rgb(0.1, 0.1, 0.1);
  const gray = rgb(0.6, 0.6, 0.6);
  const cream = rgb(0.95, 0.90, 0.80);
  const lightGray = rgb(0.95, 0.95, 0.95);

  // En-tête
  page.drawRectangle({ x: 0, y: height - 70, width, height: 70, color: brown });
  page.drawText('BEAUTY HOME CONCEPT', { x: 40, y: height - 35, size: 14, font: helveticaBold, color: rgb(1, 1, 1) });
  page.drawText('FICHE DE PERSONNALISATION — DONNÉES STAGIAIRE', { x: 40, y: height - 55, size: 9, font: helvetica, color: rgb(0.9, 0.85, 0.75) });

  let y = height - 100;

  // Référence et date
  page.drawText(`Réf. contrat : ${params.stripeId}`, { x: 40, y, size: 8, font: helvetica, color: gray });
  page.drawText(`Émis le : ${new Date().toLocaleDateString('fr-FR')}`, { x: 380, y, size: 8, font: helvetica, color: gray });

  y -= 25;
  page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 0.5, color: lightGray });

  // Section : Stagiaire
  y -= 22;
  page.drawText('STAGIAIRE', { x: 40, y, size: 10, font: helveticaBold, color: brown });
  const clientRows: [string, string][] = [
    ['Nom complet', params.nomClient],
    ['Email', params.emailClient],
    ['Téléphone', params.telephoneClient],
  ];
  for (const [label, value] of clientRows) {
    y -= 18;
    page.drawRectangle({ x: 40, y: y - 3, width: 515, height: 15, color: lightGray, opacity: 0.6 });
    page.drawText(label, { x: 45, y, size: 9, font: helveticaBold, color: dark });
    page.drawText(value, { x: 200, y, size: 9, font: helvetica, color: dark });
  }

  y -= 28;
  page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 0.5, color: lightGray });

  // Section : Formation
  y -= 22;
  page.drawText('FORMATION', { x: 40, y, size: 10, font: helveticaBold, color: brown });
  const formationRows: [string, string][] = [
    ['Intitulé', params.formationTitre],
    ['Date de début', params.dateDebut],
    ['Date de fin', params.dateFin],
    ['Lieu', '22A rue du Général Leclerc, App 13 — 80000 Amiens'],
    ['Durée', '7 heures (9h30–17h00)'],
    ['Format', 'Présentiel · 1 à 2 participants'],
  ];
  for (const [label, value] of formationRows) {
    y -= 18;
    page.drawRectangle({ x: 40, y: y - 3, width: 515, height: 15, color: lightGray, opacity: 0.6 });
    page.drawText(label, { x: 45, y, size: 9, font: helveticaBold, color: dark });
    page.drawText(value, { x: 200, y, size: 9, font: helvetica, color: dark });
  }

  y -= 28;
  page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 0.5, color: lightGray });

  // Section : Conditions financières
  y -= 22;
  page.drawText('CONDITIONS FINANCIÈRES', { x: 40, y, size: 10, font: helveticaBold, color: brown });
  const financeRows: [string, string][] = [
    ['Prix total TTC', `${params.prixTotal.toFixed(2)} €`],
    ['Acompte réglé (30 %)', `${params.acompte.toFixed(2)} €`],
    ['Solde restant dû', `${params.solde.toFixed(2)} €`],
  ];
  for (const [label, value] of financeRows) {
    y -= 18;
    page.drawRectangle({ x: 40, y: y - 3, width: 515, height: 15, color: lightGray, opacity: 0.6 });
    page.drawText(label, { x: 45, y, size: 9, font: helveticaBold, color: dark });
    page.drawText(value, { x: 200, y, size: 9, font: helveticaBold, color: dark });
  }
  y -= 14;
  page.drawText('Le solde est à régler au plus tard le premier jour de la formation.', { x: 45, y, size: 8, font: helvetica, color: gray });

  y -= 30;
  page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 0.5, color: lightGray });

  // Section : Audit Trail (signature électronique légale)
  y -= 22;
  page.drawText('SIGNATURE ÉLECTRONIQUE — AUDIT TRAIL', { x: 40, y, size: 10, font: helveticaBold, color: brown });
  y -= 16;
  page.drawText('La présente convention a été acceptée par consentement numérique et paiement sécurisé.', { x: 40, y, size: 9, font: helvetica, color: dark });
  y -= 16;
  page.drawText(`Consentement enregistré le : ${new Date(params.consentTimestamp).toLocaleString('fr-FR')}`, { x: 40, y, size: 9, font: helvetica, color: dark });
  y -= 14;
  page.drawText(`Adresse IP du signataire : ${params.clientIp}`, { x: 40, y, size: 9, font: helvetica, color: dark });
  y -= 14;
  page.drawText(`Référence transaction Stripe : ${params.stripeId}`, { x: 40, y, size: 9, font: helvetica, color: dark });

  // Bloc audit (cadre beige)
  y -= 30;
  page.drawRectangle({ x: 40, y: y - 22, width: 515, height: 38, color: cream, borderColor: brown, borderWidth: 0.5 });
  page.drawText('Validé par consentement numérique et paiement sécurisé Stripe.', { x: 48, y: y - 6, size: 8, font: helveticaBold, color: brown });
  page.drawText(`Date : ${params.consentTimestamp}  ·  IP : ${params.clientIp}  ·  Réf : ${params.stripeId}`, { x: 48, y: y - 18, size: 7, font: helvetica, color: brown });

  // Pied de page
  page.drawRectangle({ x: 0, y: 0, width, height: 28, color: brown });
  page.drawText('Beauty Home Concept · beautyhomeconcept@gmail.com · www.beautyhomeconcept.fr', { x: 40, y: 9, size: 7, font: helvetica, color: rgb(0.9, 0.85, 0.75) });

  return Buffer.from(await pdfDoc.save());
}

// ─────────────────────────────────────────────────────────────────────────────

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

    const nomClient = session.customer_details?.name || 'Client Inconnu';
    const emailClient = session.customer_details?.email || '';
    const telephoneClient = session.customer_details?.phone || 'Non renseigné';
    const stripeId = (session.payment_intent as string) || session.id;

    if (!supabaseSessionId) {
      console.error('Webhook: supabase_session_id manquant dans les métadonnées.');
      return NextResponse.json({ received: true });
    }

    const supabase = await createAdminClient();

    // Idempotence : ignorer si déjà traité
    const { data: existing } = await supabase
      .from('reservations')
      .select('id')
      .eq('stripe_payment_id', stripeId)
      .maybeSingle();
    if (existing) return NextResponse.json({ received: true });

    // 1. Insérer la réservation
    const { error: insertError } = await supabase.from('reservations').insert({
      session_id: supabaseSessionId,
      nom_client: nomClient,
      email_client: emailClient,
      telephone_client: telephoneClient,
      stripe_payment_id: stripeId,
    });
    if (insertError) {
      console.error('Erreur insertion réservation:', insertError);
      return NextResponse.json({ received: true });
    }

    // 2. Récupérer les données de session + décrémenter les places
    const { data: dbSession } = await supabase
      .from('sessions')
      .select('places_disponibles, date_debut, date_fin')
      .eq('id', supabaseSessionId)
      .single();

    if (!dbSession) return NextResponse.json({ received: true });

    const { error: rpcError } = await supabase.rpc('decrement_places', { session_id: supabaseSessionId });
    if (rpcError) {
      await supabase.from('sessions').update({
        places_disponibles: Math.max(0, dbSession.places_disponibles - 1),
      }).eq('id', supabaseSessionId);
    }

    const dateDebut = new Date(dateDebutRaw || dbSession.date_debut).toLocaleDateString('fr-FR');
    const dateFin = new Date(dateFinRaw || dbSession.date_fin).toLocaleDateString('fr-FR');
    const acompte = formationPrix * 0.3;
    const solde = formationPrix * 0.7;

    // 3. Récupérer l'URL de la facture Stripe (si invoice_creation activé)
    let invoiceUrl: string | null = null;
    if (session.invoice) {
      try {
        const invoice = await stripe.invoices.retrieve(session.invoice as string);
        invoiceUrl = invoice.hosted_invoice_url ?? null;
      } catch (e) {
        console.error('Impossible de récupérer la facture Stripe:', e);
      }
    }

    try {
      // 4. Générer le contrat PDF (template réel + page de personnalisation)
      const contractBuffer = await buildContractPDF({
        nomClient, emailClient, telephoneClient,
        formationTitre, dateDebut, dateFin,
        prixTotal: formationPrix, acompte, solde,
        stripeId, clientIp, consentTimestamp,
      });

      // 5. Archiver dans Supabase Storage
      const { error: storageError } = await supabase.storage
        .from('formations_images')
        .upload(`contracts/${stripeId}.pdf`, contractBuffer, { contentType: 'application/pdf', upsert: true });
      if (storageError) console.error('Erreur stockage Supabase:', storageError.message);

      // 6. Charger le Règlement Intérieur (PDF statique)
      // REMPLACE le fichier par ton vrai règlement intérieur dans public/documents/
      const reglementPath = join(process.cwd(), 'public', 'documents', 'reglement-interieur.pdf');
      const reglementBuffer = readFileSync(reglementPath);
      const reglementBase64 = reglementBuffer.toString('base64');

      const contractBase64 = contractBuffer.toString('base64');

      // URL du programme de formation (hébergé dans public/documents/)
      // ADAPTE le nom de fichier selon ta formation (un fichier par formation si besoin)
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://project-sjkut.vercel.app';
      const programmeUrl = `${siteUrl}/documents/programme-manucure-russe.pdf`;

      // 7. Email client : contrat + règlement en pièces jointes + boutons facture & programme
      await resend.emails.send({
        from: 'Beauty Home Concept <contact@beautyhomeconcept.fr>',
        to: [emailClient],
        subject: `Votre inscription est confirmée — ${formationTitre}`,
        react: ConfirmationEmail({ nomClient, formationTitre, dateDebut, dateFin, invoiceUrl, programmeUrl }),
        attachments: [
          {
            filename: `Contrat_${formationTitre.replace(/\s+/g, '_')}.pdf`,
            content: contractBase64,
          },
          {
            filename: 'Reglement_Interieur_Beauty_Home_Concept.pdf',
            content: reglementBase64,
          },
        ],
      });

      // 8. Email admin : contrat en copie
      await resend.emails.send({
        from: 'Beauty Home Concept <contact@beautyhomeconcept.fr>',
        to: ['beautyhomeconcept@gmail.com'],
        subject: `Nouvelle inscription : ${formationTitre} — ${nomClient}`,
        react: AdminNotificationEmail({ nomClient, emailClient, telephoneClient, formationTitre }),
        attachments: [
          {
            filename: `Contrat_${nomClient.replace(/\s+/g, '_')}_${formationTitre.replace(/\s+/g, '_')}.pdf`,
            content: contractBase64,
          },
        ],
      });

    } catch (err) {
      console.error('Erreur génération/envoi PDF ou email:', err);
    }
  }

  return NextResponse.json({ received: true });
}
