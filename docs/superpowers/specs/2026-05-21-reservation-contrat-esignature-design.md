# Réservation + Contrat + Signature électronique — Design Spec
Date: 2026-05-21
Statut: Approuvé

## Contexte

Le système de réservation actuel (`SessionBooking.tsx` + `/api/checkout`) souffre de plusieurs lacunes :
- Le contrat est généré **après** le paiement (l'élève ne le lit jamais avant)
- Un seul template partagé pour toutes les formations
- Pas de signature électronique traçable
- La confirmation email n'attache pas le programme ni le livret d'accueil
- L'admin n'a pas de vue filtrable des réservations

## Flow complet — du clic « Réserver » au paiement

```
Étape 1 — Infos client
  → Étape 2 — Contrat personnalisé (lecture obligatoire)
    → Étape 3 — Signature électronique
      → Étape 4 — Stripe Checkout (acompte 30%)
        → Webhook → insert reservation → emails
```

### Étape 1 — Infos client

Champs collectés pour tous :
- Prénom*, Nom*, Email*, Téléphone*, Adresse*

Choix **Particulier** / **Professionnel** (radio, visible dès l'étape 1).

Si **Professionnel**, champs supplémentaires :
- Raison sociale*, SIRET*, Instagram (optionnel)

Validation côté client avant de continuer (champs requis, format email, format SIRET 14 chiffres).

### Étape 2 — Contrat personnalisé

- L'API `/api/contract/preview` est appelée avec les données de l'étape 1.
- Elle charge le template `contract_templates` correspondant à `(formation_id, client_type)`.
- Remplace toutes les `{{variables}}` et renvoie le HTML rendu.
- Affiché dans une zone scrollable (`max-h-[60vh] overflow-y-auto`).
- Le bouton "Signer" est désactivé (`pointer-events-none opacity-40`) jusqu'à ce que l'utilisateur ait scrollé jusqu'en bas (détecté via `onScroll` : `scrollTop + clientHeight >= scrollHeight - 10`).

### Étape 3 — Signature électronique

Deux onglets :

**"Taper mon nom"** : champ texte pré-rempli avec le nom saisi à l'étape 1. L'élève confirme en laissant ou modifiant. Rendu en italique style signature sous le champ.

**"Dessiner"** : canvas HTML5 (`<canvas>`). Dessin au doigt (mobile) ou souris (desktop). Bouton "Effacer" pour recommencer.

Au clic sur "Signer et payer l'acompte" :
1. Données capturées : `{ type: 'text'|'draw', valeur: string|base64, timestamp: ISO, ip: string, userAgent: string }`
2. POST vers `/api/contract/sign` → génère le PDF final avec audit trail → upload dans Supabase Storage `contracts/{temp_id}/contrat-signé.pdf` → retourne `{ contrat_url, contrat_id }`
3. Redirect vers `/api/checkout?session_id=…&contrat_id=…`

### Étape 4 — Stripe Checkout

- `contrat_id` passé en metadata Stripe.
- Acompte = 30% du prix de la formation.
- `invoice_creation: { enabled: true }` pour la facture d'acompte automatique.
- Custom fields Stripe : supprimés (les données sont maintenant collectées à l'étape 1).
- Le solde de 70% est réglé le dernier jour de formation (espèces / virement / carte) — pas géré par Stripe.

### Webhook Stripe (`/api/webhook/stripe`)

À `checkout.session.completed` :
1. Idempotence : vérifier que la reservation n'est pas déjà `confirmee`.
2. **Update** `reservations` (créée à l'étape `/api/contract/sign`) : passer statut `en_attente_paiement` → `confirmee`, ajouter `stripe_session_id`, `acompte_amount`, `acompte_paid_at`.
3. Déplacer le PDF dans Storage : `contracts/{temp_uuid}/... → contracts/{reservation_id}/contrat-signé.pdf`, mettre à jour `contrat_signe_url`.
4. Générer signed URL (valable 7 jours) pour l'attachement email.
5. Envoyer email de confirmation avec pièces jointes (voir section Emails).
6. Envoyer email admin (notification nouvelle inscription).

---

## Schéma de données

### Nouvelle table `contract_templates`

```sql
create table contract_templates (
  id           uuid primary key default gen_random_uuid(),
  formation_id uuid references formations(id) on delete cascade,
  type         text not null check (type in ('particulier', 'pro')),
  titre        text,
  contenu      text not null, -- HTML avec {{variables}}
  version      int default 1,
  updated_at   timestamptz default now(),
  unique(formation_id, type)
);
```

**Variables disponibles dans le template :**
- `{{nom_prenom}}` — prénom + nom de l'élève
- `{{adresse}}` — adresse complète
- `{{email}}` — email
- `{{telephone}}` — téléphone
- `{{raison_sociale}}` — vide si particulier
- `{{siret}}` — vide si particulier
- `{{formation}}` — nom de la formation
- `{{date_session}}` — date(s) de la session (ex: "14 et 15 juin 2026")
- `{{duree}}` — durée en heures
- `{{prix_total}}` — prix TTC
- `{{acompte}}` — montant de l'acompte (30%)
- `{{solde}}` — solde à régler le dernier jour (70%)
- `{{clause_rgpd}}` — clause RGPD standard, injectée automatiquement, non modifiable dans l'éditeur
- `{{date_signature}}` — date du jour de signature (remplie au moment de la signature)

### Modifications table `reservations`

```sql
alter table reservations
  add column prenom            text,
  add column nom               text,
  add column telephone         text,
  add column adresse           text,
  add column client_type       text check (client_type in ('particulier', 'pro')),
  add column raison_sociale    text,
  add column siret             text,
  add column instagram         text,
  add column contrat_signe_url text,
  add column contrat_version   int,
  add column signature_data    jsonb,
  -- statut étendu (migration de check constraint)
  -- nouveaux statuts : en_attente_signature, en_attente_paiement
  ;
```

Statuts complets : `en_attente_signature` → `en_attente_paiement` → `confirmee` → `presente` / `annulee`

### Bucket Supabase Storage — `contracts`

- Chemin : `contracts/{reservation_id}/contrat-signé.pdf`
- Accès : **privé** (pas de lecture publique)
- Signed URLs générées côté serveur via `supabase.storage.from('contracts').createSignedUrl()`
- Taille max : 5 MB (PDF texte, pas d'images lourdes)
- RLS : lecture et écriture pour admins authentifiés + service role uniquement

### Nouvelle table `parametres_admin`

```sql
create table parametres_admin (
  cle   text primary key,
  valeur text not null
);

-- Valeurs initiales :
-- livret_accueil_url : URL Supabase Storage du livret d'accueil PDF
```

---

## API Routes

### `POST /api/contract/preview`

**Input :** `{ formation_id, session_id, client_type, nom, prenom, adresse, email, telephone, raison_sociale?, siret?, instagram? }`

**Process :**
1. Charger `contract_templates` pour `(formation_id, client_type)`
2. Remplacer toutes les `{{variables}}` dans `contenu`
3. Injecter `{{clause_rgpd}}` (non modifiable)
4. Retourner le HTML rendu

**Output :** `{ html: string, template_version: number }`

**Fallback :** si aucun template pour `(formation_id, client_type)` → erreur 404 explicite avec message *"Template de contrat manquant pour cette formation. Contactez l'administrateur."*

### `POST /api/contract/sign`

**Input :** `{ formation_id, session_id, client_type, signature_data, template_version, ...champs_client }`

**Process :**
1. Valider que `template_version` correspond à la version actuelle (évite de signer un template périmé)
2. Générer le PDF final via `pdf-lib` ou `@react-pdf/renderer` :
   - Page 1..N : contenu du contrat avec variables remplies
   - Dernière page : audit trail (nom, email, IP, user-agent, timestamp, type de signature, image de la signature si draw)
3. Upload dans `contracts/{temp_uuid}/contrat-signé.pdf`
4. Insert row dans `reservations` avec statut `en_attente_paiement` et tous les champs client

**Output :** `{ contrat_url: string, reservation_id: string, temp_uuid: string }`

---

## Génération PDF

Bibliothèque : `@react-pdf/renderer` (remplace `pdf-lib` — plus simple pour du contenu riche HTML-like).

Structure du PDF :
```
Page 1 à N : contenu du contrat (template rendu)
Dernière page : Audit Trail
  - Titre "Certificat de signature électronique"
  - Nom complet de la signataire
  - Email
  - Date et heure (ISO 8601, fuseau Europe/Paris)
  - Adresse IP
  - User-agent
  - Type de signature : "Nom tapé" ou "Signature manuscrite numérique"
  - Si draw : image de la signature (base64 PNG)
  - Empreinte SHA-256 du contenu signé
```

---

## Interface Admin

### `/admin/reservations` — Tableau global (Option B)

**Filtres :** Toutes / Confirmées / En attente / Par formation (select) / Par statut (select)

**Colonnes :** Élève, Formation, Date session, Statut (badge coloré), Type client, Date inscription

**Slide-in détail (clic sur une ligne) :**
- Infos client : nom, email, téléphone, adresse, type (particulier/pro), SIRET/raison sociale/Instagram si pro
- Contrat : statut ("Signé le JJ/MM/YYYY à HH:MM"), bouton "Télécharger le contrat signé" (signed URL)
- Paiement : montant acompte, date, lien Stripe
- Actions : "Marquer présente", "Annuler", "Renvoyer email confirmation"

### `/admin/formations/[id]` — Section "Contrats"

Onglets **Particulier** / **Professionnel**.

Éditeur de texte riche (bibliothèque : `@tiptap/react` — léger, extensible) :
- Toolbar : Gras, Italique, Souligné, Titre H2/H3, Liste à puces, Liste numérotée
- Barre de variables cliquables → insère `{{variable}}` à la position du curseur
- Bouton "Aperçu PDF" → appelle `/api/contract/preview` avec des données fictives → ouvre le PDF dans un nouvel onglet

Sauvegarde → incrémente `version`, met à jour `updated_at`.

### `/admin/parametres` — Page paramètres

Section "Documents" :
- **Livret d'accueil** : affiche le fichier actuel + bouton "Remplacer" (upload → Supabase Storage → mise à jour `parametres_admin`)
- **Règlement intérieur** : idem

---

## Emails

### Email client — Confirmation de réservation

**Objet :** `Votre inscription est confirmée — [Nom formation]`

**Corps :** Design existant "Éclat Minimaliste". Ajouter : récapitulatif des informations saisies, montant de l'acompte payé, rappel du solde (70% le dernier jour), informations pratiques.

**Pièces jointes (toutes obligatoires) :**
1. `contrat-signé.pdf` — depuis Supabase Storage (signed URL → fetch → buffer)
2. `programme-[formation].pdf` — depuis `formations.programme_pdf_url`
3. `livret-accueil.pdf` — depuis `parametres_admin.livret_accueil_url`
4. `reglement-interieur.pdf` — depuis `/public/documents/`
5. `facture-acompte.pdf` — depuis Stripe Invoice PDF URL

**Fallback :** si `programme_pdf_url` est null → ne pas attacher (pas d'erreur). Log admin.

### Email admin — Nouvelle inscription

**Objet :** `Nouvelle inscription — [Nom] · [Formation] · [Date]`

**Corps :** Récapitulatif complet : infos client, type (pro/particulier), session, acompte reçu. Lien direct vers `/admin/reservations`.

---

## RGPD & Légalité

### Consentement

Case à cocher obligatoire à l'étape 1 (avant de voir le contrat) :

> *"J'accepte que mes données personnelles soient utilisées dans le cadre de ma formation et conservées 5 ans conformément aux obligations des organismes de formation (Art. L.6353-8 du Code du travail)."*

Stockée dans `reservations.rgpd_consent_at timestamptz`.

### Clause RGPD dans le contrat

Variable `{{clause_rgpd}}` injectée automatiquement dans chaque contrat, non modifiable depuis l'éditeur. Contenu fixe :

> *"Conformément au Règlement (UE) 2016/679 (RGPD), les données collectées sont utilisées exclusivement pour la gestion de votre formation. Durée de conservation : 5 ans. Droit d'accès, rectification et effacement : contact@beautyhomeconcept.fr — sous réserve des obligations légales de conservation."*

### Durée de conservation

5 ans (obligation Qualiopi / DREETS). Le droit à l'effacement s'applique uniquement aux élèves n'ayant pas suivi de formation (statut `annulee` uniquement).

### Base légale RGPD

Art. 6.1.b — exécution du contrat. Pas de consentement marketing séparé requis (hors scope).

---

## Composants Frontend

### `SessionBooking.tsx` — Refactor complet

Remplace le modal actuel (3 cases à cocher + redirect immédiat) par un stepper 4 étapes.

```
SessionBooking
├── Step1Form        — infos client + type + consentement RGPD
├── Step2Contract    — zone scrollable + détection scroll complet
├── Step3Signature   — onglets text/draw + SignatureCanvas
└── Step4Payment     — loading state pendant génération PDF → redirect Stripe
```

États locaux :
```ts
const [step, setStep] = useState<1|2|3|4>(1)
const [formData, setFormData] = useState<ClientFormData>({})
const [contractHtml, setContractHtml] = useState('')
const [hasScrolled, setHasScrolled] = useState(false)
const [signatureData, setSignatureData] = useState<SignatureData|null>(null)
const [loading, setLoading] = useState(false)
const [error, setError] = useState<string|null>(null)
```

Erreurs inline (plus d'`alert()`). Toast pour les erreurs réseau. Bouton retour entre étapes 1→2→3 (pas de retour depuis l'étape 4).

### `SignatureCanvas.tsx`

Nouveau composant. Canvas HTML5 avec :
- `useRef<HTMLCanvasElement>`
- Events : `mousedown/mousemove/mouseup` + `touchstart/touchmove/touchend`
- `toDataURL('image/png')` pour export
- Bouton "Effacer" : `ctx.clearRect(0, 0, canvas.width, canvas.height)`

---

## États d'erreur

| Situation | Comportement |
|---|---|
| Template manquant pour la formation | Message explicite à l'étape 2 + lien mailto admin |
| Erreur génération PDF | Toast d'erreur, retry possible, données non perdues |
| Stripe indisponible | Message d'erreur + proposer de contacter par email |
| Supabase Storage indisponible | Log + email admin, réservation quand même insérée sans URL contrat |
| Email d'envoi échoué | Log Resend, ne bloque pas la réservation |

---

## Hors périmètre

- Paiement du solde de 70% via Stripe (réglé en présentiel)
- Relances automatiques des statuts `en_attente_signature`
- Portail élève (espace pour re-télécharger les documents après coup)
- Signature à valeur juridique renforcée (DocuSign, YouSign) — niveau probatoire actuel suffisant pour la formation professionnelle
