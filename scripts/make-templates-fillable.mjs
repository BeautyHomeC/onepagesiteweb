// Rend les templates contrat & convention "fillable" — tous les trous
// Usage : node scripts/make-templates-fillable.mjs

import { PDFDocument } from 'pdf-lib';
import fs from 'node:fs';
import path from 'node:path';

const ROOT     = process.cwd();
const DOCS_DIR = path.join(ROOT, 'public', 'documents');

const PAGE_H = 842;
const Y = (yBot) => PAGE_H - yBot;

const FIELDS = [
  // PAGE 1 — stagiaire
  { page: 0, name: 'nom_client',        x: 145, y: Y(338.7), w: 400, h: 13 },
  { page: 0, name: 'adresse_client',    x: 145, y: Y(353.7), w: 400, h: 13 },
  { page: 0, name: 'telephone_client',  x: 145, y: Y(368.7), w: 400, h: 13 },
  { page: 0, name: 'email_client',      x: 145, y: Y(383.7), w: 400, h: 13 },
  { page: 0, name: 'siret_client',      x: 145, y: Y(398.7), w: 400, h: 13 },
  { page: 0, name: 'instagram_client',  x: 145, y: Y(413.7), w: 400, h: 13 },

  // PAGE 1 — Article 1 (nom formation) + Article 2 (nombre d'élèves)
  { page: 0, name: 'formation_titre',   x:  57, y: Y(519),   w: 480, h: 14 },
  { page: 0, name: 'nombre_eleves',     x: 196, y: Y(683.7), w: 18,  h: 13 },

  // PAGE 2 — Article 4 (durée, date, horaire)
  { page: 1, name: 'duree_formation',   x: 165, y: Y(116.7), w: 380, h: 13 },
  { page: 1, name: 'date_formation',    x: 165, y: Y(131.7), w: 380, h: 13 },
  { page: 1, name: 'horaire',           x: 100, y: Y(146.7), w: 380, h: 13 },

  // PAGE 2 — Article 7 (prix + acompte)
  { page: 1, name: 'prix_total',        x: 217, y: Y(731.7), w: 24,  h: 13 },
  { page: 1, name: 'acompte',           x: 413, y: Y(731.7), w: 90,  h: 13 },

  // PAGE 3 — Article 7 (solde 70%)
  { page: 2, name: 'solde',             x: 130, y: Y(146.7), w: 24,  h: 13 },

  // PAGE 4 — date de signature
  { page: 3, name: 'date_signature',    x:  78, y: Y(641.7), w: 200, h: 13 },
];

const PRO_EXTRA = [
  { page: 0, name: 'raison_sociale', x: 0, y: PAGE_H - 5, w: 1, h: 1 },
];

async function makeFillable(srcPath, outPath, extraFields = []) {
  const srcBytes = fs.readFileSync(srcPath);
  const pdfDoc = await PDFDocument.load(srcBytes);
  const form = pdfDoc.getForm();
  const pages = pdfDoc.getPages();

  const allFields = [...FIELDS, ...extraFields];
  for (const f of allFields) {
    const page = pages[f.page];
    if (!page) continue;
    const field = form.createTextField(f.name);
    field.setText('');
    field.addToPage(page, { x: f.x, y: f.y, width: f.w, height: f.h, borderWidth: 0 });
  }

  const out = await pdfDoc.save();
  fs.writeFileSync(outPath, out);
  return { fields: allFields.map((f) => f.name), bytes: out.length };
}

async function main() {
  const jobs = [
    {
      label: 'contrat (particulier)',
      src:   path.join(DOCS_DIR, 'contrat-source.pdf'),
      out:   path.join(DOCS_DIR, 'contrat-template-v2.pdf'),
      extra: [],
    },
    {
      label: 'convention (pro)',
      src:   path.join(DOCS_DIR, 'convention-source.pdf'),
      out:   path.join(DOCS_DIR, 'convention-template-v2.pdf'),
      extra: PRO_EXTRA,
    },
  ];

  for (const job of jobs) {
    if (!fs.existsSync(job.src)) {
      console.error('❌ Source absente : ' + job.src);
      continue;
    }
    const { fields, bytes } = await makeFillable(job.src, job.out, job.extra);
    console.log('✅ ' + job.label);
    console.log('   → ' + path.basename(job.out) + ' (' + bytes + ' octets)');
    console.log('   → ' + fields.length + ' champs : ' + fields.join(', ') + '\n');
  }

  console.log('🎉 Templates fillable prêts.');
}

main().catch((err) => {
  console.error('💥 Erreur :', err);
  process.exit(1);
});
