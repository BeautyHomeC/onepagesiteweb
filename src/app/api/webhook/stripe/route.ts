import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/server';
import { Resend } from 'resend';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { readFileSync } from 'fs';
import { join } from 'path';
import ConfirmationEmail from '@/emails/ConfirmationEmail';
import AdminNotificationEmail from '@/emails/AdminNotificationEmail';

type ClientType = 'particulier' | 'pro';

// ─────────────────────────────────────────────────────────────────────────────
//  GÉNÉRATION DU CONTRAT (particulier) OU DE LA CONVENTION (pro)
// ─────────────────────────────────────────────────────────────────────────────
//
//  📂  EMPLACEMENT DES TEMPLATES :  public/documents/
//
//     ┌────────────────────────────┬──────────────────────────────────────────┐
//     │ contrat-template.pdf       │  → utilisé pour les PARTICULIERS         │
//     │ convention-template.pdf    │  → utilisé pour les PROFESSIONNELS       │
//     └────────────────────────────┴──────────────────────────────────────────┘
//
//  ⚠️  Tes templates PDF doivent contenir des CHAMPS DE FORMULAIRE nommés
//      EXACTEMENT comme ci-dessous (sinon les setField() seront silencieusement
//      ignorés). Tu peux créer/éditer ces champs dans Adobe Acrobat Pro,
//      LibreOffice, ou en ligne via PDFescape.
//
//      Champs attendus  ┌── nom_client         (Nom complet du stagiaire)
//                       ├── prenom_client      (Prénom — optionnel si "nom_client" contient déjà tout)
//                       ├── adresse_client     (Adresse postale)
//                       ├── email_client
//                       ├── telephone_client
//                       ├── formation_titre
//                       ├── date_debut         (JJ/MM/AAAA)
//                       ├── date_fin           (JJ/MM/AAAA)
//                       ├── prix_total         (ex : "350.00 €")
//                       ├── acompte            (ex : "105.00 €")
//                       ├── solde              (ex : "245.00 €")
//                       ├── raison_sociale     (PRO uniquement)
//                       └── siret              (PRO uniquement)
//
// ─────────────────────────────────────────────────────────────────────────────
async function buildContractPDF(params: {
  clientType: ClientType;
  nomClient: string;
  prenomClient: string;
  adresseClient: string;
  emailClient: string;
  telephoneClient: string;
  instagramClient: string;
  raisonSociale: string;
  siret: string;
  formationTitre: string;
  nombreEleves: string;
  dureeFormation: string;
  dateFormation: string;
  horaire: string;
  dateDebut: string;
  dateFin: string;
  prixTotal: number;
  acompte: number;
  solde: number;
  stripeId: string;
  clientIp: string;
  consentTimestamp: string;
}): Promise<Buffer> {

  // ── 1. Choix du template selon le type de client ────────────────────────
  const templateFile =
    params.clientType === 'pro' ? 'convention-template-v3.pdf' : 'contrat-template-v3.pdf';

  const templatePath = join(process.cwd(), 'public', 'documents', templateFile);
  const templateBytes = readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);

  // ── 2. Remplir TOUS les champs de formulaire ────────────────────────────
  const form = pdfDoc.getForm();

  const setField = (name: string, value: string) => {
    try { form.getTextField(name).setText(value || '—'); } catch { /* champ absent */ }
  };

  // — Identité stagiaire (page 1)
  setField('nom_client',        params.nomClient);
  setField('prenom_client',     params.prenomClient);
  setField('adresse_client',    params.adresseClient);
  setField('email_client',      params.emailClient);
  setField('telephone_client',  params.telephoneClient);
  setField('siret_client',      params.siret);
  setField('instagram_client',  params.instagramClient);

  // — Formation (page 1 & page 2)
  setField('formation_titre',   params.formationTitre);
  setField('nombre_eleves',     params.nombreEleves);
  setField('duree_formation',   params.dureeFormation);
  setField('date_formation',    params.dateFormation);
  setField('horaire',           params.horaire);

  // — Montants (page 2 & 3)
  setField('prix_total',        `${params.prixTotal.toFixed(0)}€`);
  setField('acompte',           `${params.acompte.toFixed(0)}€`);
  setField('solde',             `${params.solde.toFixed(0)}`);

  // — Date de signature (page 4)
  setField('date_signature',    new Date(params.consentTimestamp).toLocaleDateString('fr-FR'));

  // — Convention pro uniquement
  if (params.clientType === 'pro') {
    setField('raison_sociale', params.raisonSociale);
  }

  // Aplatissement : les champs deviennent non-modifiables (verrou légal)
  form.flatten();

  // ── 3. Sceau d'audit trail (signature électronique) sur la dernière page ─
  const pages = pdfDoc.getPages();
  const lastPage = pages[pages.length - 1];
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const { width } = lastPage.getSize();

  const brown = rgb(0.42, 0.30, 0.15);
  const cream = rgb(0.95, 0.90, 0.80);

  const sealY = 40;
  lastPage.drawRectangle({
    x: 30,
    y: sealY,
    width: width - 60,
    height: 56,
    color: cream,
    borderColor: brown,
    borderWidth: 0.7,
  });
  lastPage.drawText("SCEAU D'AUDIT TRAIL — SIGNATURE ÉLECTRONIQUE", {
    x: 42, y: sealY + 40, size: 9, font: helveticaBold, color: brown,
  });
  lastPage.drawText(
    `Signé électroniquement le ${new Date(params.consentTimestamp).toLocaleString('fr-FR')}.`,
    { x: 42, y: sealY + 25, size: 8, font: helvetica, color: brown },
  );
  lastPage.drawText(
    `IP : ${params.clientIp}   ·   Réf Stripe : ${params.stripeId}`,
    { x: 42, y: sealY + 12, size: 8, font: helvetica, color: brown },
  );

  // ── 4. Sauvegarde en Buffer (mémoire) ───────────────────────────────────
  return Buffer.from(await pdfDoc.save());
}

// ─────────────────────────────────────────────────────────────────────────────
//  WEBHOOK STRIPE — événement checkout.session.completed
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-04-22.dahlia',
  });
  const resend = new Resend(process.env.RESEND_API_KEY);

  const payload = await req.text();
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  // ── 1. Extraction des métadonnées de la session ─────────────────────────
  const supabaseSessionId = session.metadata?.supabase_session_id;
  const formationTitre    = session.metadata?.formation_titre || 'Formation';
  const formationPrix     = parseFloat(session.metadata?.formation_prix || '0');
  const dateDebutRaw      = session.metadata?.date_debut || '';
  const dateFinRaw        = session.metadata?.date_fin || '';
  const clientIp          = session.metadata?.client_ip || 'IP non capturée';
  const consentTimestamp  = session.metadata?.consent_timestamp || new Date().toISOString();

  // ── 2. Détection particulier vs pro (via custom_fields du checkout) ─────
  const customFields = session.custom_fields || [];
  const instagram     = customFields.find((f) => f.key === 'instagram')?.text?.value     || '';
  const raisonSociale = customFields.find((f) => f.key === 'raison_sociale')?.text?.value || '';
  const siret         = customFields.find((f) => f.key === 'siret')?.text?.value         || '';
  const clientType: ClientType = raisonSociale.trim() ? 'pro' : 'particulier';

  // ── 3. Coordonnées client ───────────────────────────────────────────────
  // Stripe collecte "name" en un seul champ → on l'utilise tel quel pour
  // le PDF (Nom/Prénom : "DUPONT Marie" sera affiché en entier).
  // `prenomClient` reste défini pour le ConfirmationEmail (qui dit "Bonjour Marie").
  const nomCompletRaw   = session.customer_details?.name || 'Client Inconnu';
  const [prenomClient]  = nomCompletRaw.split(' ');
  const nomClient       = nomCompletRaw;
  const emailClient     = session.customer_details?.email || '';
  const telephoneClient = session.customer_details?.phone || 'Non renseigné';
  const addr            = session.customer_details?.address;
  const adresseClient   = addr
    ? `${addr.line1 || ''}${addr.line2 ? ', ' + addr.line2 : ''}, ${addr.postal_code || ''} ${addr.city || ''} (${addr.country || ''})`
    : 'Non renseignée';
  const stripeId = (session.payment_intent as string) || session.id;

  if (!supabaseSessionId) {
    console.error('Webhook: supabase_session_id manquant.');
    return NextResponse.json({ received: true });
  }

  const supabase = await createAdminClient();

  // ── 4. Idempotence : ne traiter qu'une seule fois ───────────────────────
  const { data: existing } = await supabase
    .from('reservations')
    .select('id')
    .eq('stripe_payment_id', stripeId)
    .maybeSingle();
  if (existing) return NextResponse.json({ received: true });

  // ── 5. Insertion de la réservation (avec preuve de consentement légal) ──
  const { error: insertError } = await supabase.from('reservations').insert({
    session_id: supabaseSessionId,
    nom_client: nomCompletRaw,
    email_client: emailClient,
    telephone_client: telephoneClient,
    stripe_payment_id: stripeId,
    instagram_client: instagram || null,
    raison_sociale: raisonSociale || null,
    siret_client: siret || null,
    client_type: clientType,
    consent_cgv:     session.metadata?.consent_cgv === 'true',
    consent_rgpd:    session.metadata?.consent_rgpd === 'true',
    consent_contrat: session.metadata?.consent_contrat === 'true',
    consent_timestamp: consentTimestamp,
    client_ip: clientIp,
  });
  if (insertError) {
    console.error('Erreur insertion réservation:', insertError);
    return NextResponse.json({ received: true });
  }

  // Récupère la session ET la formation liée (pour duree_formation, horaire,
  // nombre_eleves, programme_pdf_url depuis l'admin)
  const { data: dbSession } = await supabase
    .from('sessions')
    .select('places_disponibles, date_debut, date_fin, formation_id, formations(*)')
    .eq('id', supabaseSessionId)
    .single();

  const dbFormation: any = (dbSession as any)?.formations || null;

  if (dbSession) {
    const { error: rpcError } = await supabase.rpc('decrement_places', {
      session_id: supabaseSessionId,
    });
    if (rpcError) {
      await supabase
        .from('sessions')
        .update({ places_disponibles: Math.max(0, dbSession.places_disponibles - 1) })
        .eq('id', supabaseSessionId);
    }
  }

  const dateDebut = new Date(dateDebutRaw || dbSession?.date_debut || Date.now())
    .toLocaleDateString('fr-FR');
  const dateFin   = new Date(dateFinRaw || dbSession?.date_fin || Date.now())
    .toLocaleDateString('fr-FR');
  const acompte = formationPrix * 0.3;
  const solde   = formationPrix * 0.7;

  // ── 6. Récupération de la facture légale Stripe (URL hébergée + PDF) ────
  let invoiceUrl: string | null = null;
  let invoicePdfBase64: string | null = null;
  if (session.invoice) {
    try {
      const invoice = await stripe.invoices.retrieve(session.invoice as string);
      invoiceUrl = invoice.hosted_invoice_url ?? null;
      // Télécharge le PDF officiel de la facture pour l'attacher à l'email
      if (invoice.invoice_pdf) {
        const pdfRes = await fetch(invoice.invoice_pdf);
        if (pdfRes.ok) {
          const arr = await pdfRes.arrayBuffer();
          invoicePdfBase64 = Buffer.from(arr).toString('base64');
        }
      }
    } catch (e) {
      console.error('Impossible de récupérer la facture Stripe:', e);
    }
  }

  try {
    // ── 7. Génération du Contrat/Convention via pdf-lib ───────────────────
    //
    //  Les valeurs par défaut ci-dessous correspondent au format de
    //  formation actuel (1 jour, 7h, 9h30-17h, 22A rue du Général Leclerc).
    //  Tu peux les surcharger via les `metadata` Stripe pour chaque session
    //  (durée_formation, horaire, nombre_eleves) si tu en crées de différents.
    //
    const dateFormation = dateDebut === dateFin
      ? `Le ${dateDebut}`
      : `Du ${dateDebut} au ${dateFin}`;

    // Données formation : priorité DB > metadata Stripe > défaut
    const nombreEleves   = String(dbFormation?.nombre_eleves   || session.metadata?.nombre_eleves   || '2');
    const dureeFormation = dbFormation?.duree_formation || session.metadata?.duree_formation || '1 JOUR (7 HEURES) en présentiel';
    const horaire        = dbFormation?.horaire         || session.metadata?.horaire         || '9H30 / 17H';

    const contractBuffer = await buildContractPDF({
      clientType,
      nomClient,
      prenomClient,
      adresseClient,
      emailClient,
      telephoneClient,
      instagramClient:  instagram,
      raisonSociale,
      siret,
      formationTitre,
      nombreEleves,
      dureeFormation,
      dateFormation,
      horaire,
      dateDebut,
      dateFin,
      prixTotal: formationPrix,
      acompte,
      solde,
      stripeId,
      clientIp,
      consentTimestamp,
    });

    // ── 8. Archivage du PDF dans Supabase Storage (audit & conformité) ────
    await supabase.storage
      .from('formations_images')
      .upload(`contracts/${stripeId}.pdf`, contractBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    // ── 9. Règlement Intérieur (PDF statique) ─────────────────────────────
    //
    //  📂 PLACE TON RÈGLEMENT INTÉRIEUR ICI :
    //        public/documents/reglement-interieur.pdf
    //
    const reglementPath   = join(process.cwd(), 'public', 'documents', 'reglement-interieur.pdf');
    const reglementBuffer = readFileSync(reglementPath);
    const reglementBase64 = reglementBuffer.toString('base64');
    const contractBase64  = contractBuffer.toString('base64');

    // ── 10. URL du programme détaillé : priorité DB > fallback /documents ─
    //
    //  L'URL est récupérée depuis `formations.programme_pdf_url` saisie
    //  dans l'espace admin (upload Supabase Storage). Si vide, on utilise
    //  un fichier local /public/documents/programme-<slug>.pdf en fallback.
    //
    const siteUrl       = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
    const programmeFile = session.metadata?.programme_file || 'programme-manucure-russe.pdf';
    const programmeUrl  = dbFormation?.programme_pdf_url || `${siteUrl}/documents/${programmeFile}`;
    // Lien vers la page formation (où elle peut re-télécharger le programme)
    const formationPageUrl = dbSession?.formation_id
      ? `${siteUrl}/formations/${dbSession.formation_id}`
      : programmeUrl;

    const docLabel = clientType === 'pro' ? 'Convention' : 'Contrat';

    // ── 11. Construction des pièces jointes ───────────────────────────────
    const attachments: any[] = [
      // 1) Contrat / Convention de formation (Buffer généré dynamiquement)
      {
        filename: `${docLabel}_${formationTitre.replace(/\s+/g, '_')}.pdf`,
        content: contractBase64,
      },
      // 2) Règlement Intérieur (statique)
      {
        filename: 'Reglement_Interieur_Beauty_Home_Concept.pdf',
        content: reglementBase64,
      },
    ];

    // 3) Facture / reçu Stripe en PDF (si dispo)
    if (invoicePdfBase64) {
      attachments.push({
        filename: `Facture_acompte_${stripeId}.pdf`,
        content: invoicePdfBase64,
      });
    }

    // ── 12. Email de confirmation au client (Éclat Minimaliste) ───────────
    await resend.emails.send({
      from: 'Beauty Home Concept <contact@beautyhomeconcept.fr>',
      to: [emailClient],
      subject: `Votre inscription est confirmée — ${formationTitre}`,
      react: ConfirmationEmail({
        nomClient: nomCompletRaw,
        formationTitre,
        dateDebut,
        dateFin,
        invoiceUrl,
        programmeUrl: formationPageUrl,
        clientType,
      }),
      attachments,
    });

    // ── 12. Notification interne à l'admin ────────────────────────────────
    await resend.emails.send({
      from: 'Beauty Home Concept <contact@beautyhomeconcept.fr>',
      to: ['beautyhomeconcept@gmail.com'],
      subject: `Nouvelle inscription : ${formationTitre} — ${nomCompletRaw}`,
      react: AdminNotificationEmail({
        nomClient: nomCompletRaw,
        emailClient,
        telephoneClient,
        formationTitre,
      }),
      attachments: [
        {
          filename: `${docLabel}_${nomCompletRaw.replace(/\s+/g, '_')}.pdf`,
          content: contractBase64,
        },
      ],
    });
  } catch (err) {
    console.error('Erreur génération/envoi PDF ou email:', err);
  }

  return NextResponse.json({ received: true });
}
