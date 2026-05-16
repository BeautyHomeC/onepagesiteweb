import { NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

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
  const page = pdfDoc.addPage([595, 842]);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const { width, height } = page.getSize();
  const primaryColor = rgb(0.42, 0.30, 0.15);
  const textColor = rgb(0.1, 0.1, 0.1);
  const lightGray = rgb(0.95, 0.95, 0.95);
  const mediumGray = rgb(0.6, 0.6, 0.6);

  let y = height - 50;

  page.drawRectangle({ x: 0, y: height - 80, width, height: 80, color: primaryColor });
  page.drawText('BEAUTY HOME CONCEPT', { x: 40, y: height - 45, size: 16, font: helveticaBold, color: rgb(1, 1, 1) });
  page.drawText('CONVENTION DE FORMATION PROFESSIONNELLE', { x: 40, y: height - 65, size: 10, font: helvetica, color: rgb(0.9, 0.85, 0.75) });

  y = height - 110;
  page.drawText(`Référence : ${params.stripeId}`, { x: 40, y, size: 8, font: helvetica, color: mediumGray });
  page.drawText(`Émis le : ${new Date().toLocaleDateString('fr-FR')}`, { x: 370, y, size: 8, font: helvetica, color: mediumGray });

  y -= 30;
  page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 0.5, color: lightGray });

  y -= 25;
  page.drawText('PARTIES À LA CONVENTION', { x: 40, y, size: 11, font: helveticaBold, color: primaryColor });
  y -= 20;
  page.drawText('Organisme de formation :', { x: 40, y, size: 9, font: helveticaBold, color: textColor });
  y -= 14;
  page.drawText('Beauty Home Concept — Camille Grignon', { x: 40, y, size: 9, font: helvetica, color: textColor });
  y -= 12;
  page.drawText('22A rue du Général Leclerc, App 13, 80000 Amiens', { x: 40, y, size: 9, font: helvetica, color: textColor });
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
  y -= 25;
  page.drawText('DÉSIGNATION DE LA FORMATION', { x: 40, y, size: 11, font: helveticaBold, color: primaryColor });
  y -= 20;

  const infoRows = [
    ['Intitulé de la formation', params.formationTitre],
    ['Date de début', params.dateDebut],
    ['Date de fin', params.dateFin],
    ['Lieu', '22A rue du Général Leclerc, App 13, 80000 Amiens'],
    ['Durée', '7 heures (9h30 — 17h)'],
    ['Modalité', 'Présentiel — Groupe limité à 1-2 participants'],
  ];
  for (const [label, value] of infoRows) {
    page.drawRectangle({ x: 40, y: y - 4, width: 515, height: 16, color: lightGray, opacity: 0.5 });
    page.drawText(label, { x: 45, y, size: 9, font: helveticaBold, color: textColor });
    page.drawText(value, { x: 260, y, size: 9, font: helvetica, color: textColor });
    y -= 20;
  }

  y -= 15;
  page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 0.5, color: lightGray });
  y -= 25;
  page.drawText('CONDITIONS FINANCIÈRES', { x: 40, y, size: 11, font: helveticaBold, color: primaryColor });
  y -= 20;
  page.drawText(`Prix total :`, { x: 45, y, size: 9, font: helveticaBold, color: textColor });
  page.drawText(`${params.prixTotal.toFixed(2)} € TTC`, { x: 400, y, size: 9, font: helveticaBold, color: textColor });
  y -= 16;
  page.drawText(`Acompte réglé (30%) :`, { x: 45, y, size: 9, font: helvetica, color: textColor });
  page.drawText(`${params.acompte.toFixed(2)} €`, { x: 400, y, size: 9, font: helvetica, color: textColor });
  y -= 16;
  page.drawText(`Solde restant dû :`, { x: 45, y, size: 9, font: helvetica, color: textColor });
  page.drawText(`${params.solde.toFixed(2)} €`, { x: 400, y, size: 9, font: helvetica, color: textColor });

  y -= 30;
  page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 0.5, color: lightGray });
  y -= 25;
  page.drawText('SIGNATURE ÉLECTRONIQUE — AUDIT TRAIL', { x: 40, y, size: 11, font: helveticaBold, color: primaryColor });
  y -= 20;
  page.drawText('La présente convention a été acceptée par consentement numérique et paiement sécurisé.', { x: 40, y, size: 9, font: helvetica, color: textColor });
  y -= 16;
  page.drawText(`Date du consentement : ${new Date(params.consentTimestamp).toLocaleString('fr-FR')}`, { x: 40, y, size: 9, font: helvetica, color: textColor });
  y -= 12;
  page.drawText(`Adresse IP : ${params.clientIp}`, { x: 40, y, size: 9, font: helvetica, color: textColor });
  y -= 12;
  page.drawText(`Référence Stripe : ${params.stripeId}`, { x: 40, y, size: 9, font: helvetica, color: textColor });
  y -= 20;
  page.drawRectangle({ x: 40, y: y - 18, width: 515, height: 32, color: rgb(0.95, 0.90, 0.80), borderColor: primaryColor, borderWidth: 0.5 });
  page.drawText(`Validé par consentement numérique et paiement sécurisé Stripe.`, { x: 48, y: y - 5, size: 8, font: helveticaBold, color: primaryColor });
  page.drawText(`Date : ${params.consentTimestamp} · IP : ${params.clientIp} · Réf : ${params.stripeId}`, { x: 48, y: y - 16, size: 7, font: helvetica, color: primaryColor });

  page.drawRectangle({ x: 0, y: 0, width, height: 30, color: primaryColor });
  page.drawText('Beauty Home Concept · beautyhomeconcept@gmail.com · www.beautyhomeconcept.fr', { x: 40, y: 10, size: 7, font: helvetica, color: rgb(0.9, 0.85, 0.75) });

  return await pdfDoc.save();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      nomClient, emailClient, telephoneClient,
      formationTitre, formationPrix, dateDebut, dateFin,
      stripeId, consentTimestamp
    } = body;

    const acompte = formationPrix * 0.3;
    const solde = formationPrix * 0.7;

    const pdfBytes = await generateContractPDF({
      nomClient, emailClient, telephoneClient,
      formationTitre, dateDebut, dateFin,
      prixTotal: formationPrix, acompte, solde,
      stripeId,
      clientIp: 'Régénéré depuis Admin',
      consentTimestamp: consentTimestamp || new Date().toISOString(),
    });

    return new Response(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Convention_${nomClient}_${formationTitre}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
