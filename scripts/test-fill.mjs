// Test rapide : remplit chaque champ avec une valeur factice pour vérifier
// visuellement les positions des form fields dans le PDF.
import { PDFDocument } from 'pdf-lib';
import fs from 'node:fs';

const src = fs.readFileSync('public/documents/contrat-template-v2.pdf');
const pdf = await PDFDocument.load(src);
const form = pdf.getForm();

const VALUES = {
  nom_client:       'DUPONT Marie',
  adresse_client:   '12 rue des Lilas, 75000 Paris',
  telephone_client: '06 12 34 56 78',
  email_client:     'marie.dupont@email.com',
  siret_client:     '12345678900012',
  instagram_client: '@marie.nails',
  formation_titre:  'MANUCURE RUSSE PRO',
  nombre_eleves:    '2',
  duree_formation: '1 JOUR (7 HEURES) en présentiel',
  date_formation:  'Jeudi 18 Juin 2026',
  horaire:         '9H30 / 17H',
  prix_total:      '480€',
  acompte:         '144€',
  solde:           '336',
  date_signature:  '16/05/2026',
};

for (const [name, value] of Object.entries(VALUES)) {
  try { form.getTextField(name).setText(value); }
  catch { console.warn('champ absent : ' + name); }
}
form.flatten();
fs.writeFileSync('/tmp/contrat-rempli-test.pdf', await pdf.save());
console.log('✅ Test rempli : /tmp/contrat-rempli-test.pdf');
