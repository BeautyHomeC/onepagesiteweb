# Admin — Correctifs + Système de Facturation Finale

**Date :** 2026-05-27  
**Statut :** Approuvé

---

## Contexte

Beauty Home Concept est une application Next.js App Router (TypeScript) avec Supabase comme base de données et Stripe pour les paiements. Le flux actuel :
1. Un élève réserve une formation → signature contrat → paiement acompte 30% via Stripe Checkout
2. Le webhook Stripe génère une facture d'acompte PDF (BHC-branded) et envoie les documents par email
3. Le solde 70% est réglé en présentiel le dernier jour de formation (plusieurs modes possibles)

**Problèmes actuels :**
- L'espace admin a plusieurs bugs bloquants
- Il n'existe pas de système pour encaisser et facturer le solde final

---

## Sous-projet 1 — Correctifs Admin

### 1.1 Dashboard (`/admin/page.tsx`)

**Problème :** `createClient()` (clé anon, soumis à RLS) au lieu de `createAdminClient()` (service role). La query sélectionne `nom_client, email_client, telephone_client` (ancienne schema) — les nouvelles réservations avec `prenom/nom` s'affichent vides. `DownloadContractButton` utilise un chemin Storage obsolète.

**Fix :**
- Remplacer `createClient()` par `createAdminClient()`
- Mettre à jour la query : `reservations(id, prenom, nom, nom_client, email_client, telephone_client, stripe_payment_id, acompte_amount, statut, created_at)`
- Afficher `prenom + nom` en priorité, fallback sur `nom_client`
- Supprimer l'import `DownloadContractButton` et remplacer par un lien direct :
  ```tsx
  <a href={`/api/admin/reservations/${res.id}/dossier`} download>Dossier ZIP</a>
  ```

### 1.2 Sessions non visibles sur le site public

**Problème :** `FormationsSection.tsx` est un Client Component qui fetch la table `sessions` avec la clé anon (navigateur). La policy RLS de Supabase ne permet pas `SELECT` public sur `sessions` → tableau vide retourné.

**Fix — Migration SQL :**
```sql
-- Permettre la lecture publique des sessions
CREATE POLICY "sessions_public_read" ON sessions
  FOR SELECT USING (true);
```
Cette policy s'applique aux rôles `anon` et `authenticated`. Les sessions sont des données publiques (dates de formation) → pas de sensibilité.

### 1.3 Suppression de session (`actions.ts → deleteSession`)

**Problème :** Supabase retourne une FK constraint error si des réservations référencent la session. L'erreur actuelle est peu informative.

**Fix :**
- Avant la suppression, compter les réservations liées
- Si `count > 0` : lancer une erreur claire : `"Cette session a ${count} réservation(s) liée(s). Vous ne pouvez pas la supprimer."` 
- Si `count = 0` : procéder à la suppression normalement

### 1.4 `DownloadContractButton.tsx`

**Problème :** Ce composant cherche dans `formations_images/contracts/{stripeId}.pdf` — ce chemin n'existe pas. Le nouveau système stocke les contrats dans `contracts/{reservationId}/contrat-signe.pdf`.

**Fix :** Supprimer le composant et l'import dans `page.tsx`. Remplacer par un lien vers `/api/admin/reservations/{id}/dossier`.

---

## Sous-projet 2 — Système de Facturation Finale

### 2.1 Migration SQL — Nouvelles colonnes

```sql
ALTER TABLE reservations 
  ADD COLUMN solde_paid_at TIMESTAMPTZ,
  ADD COLUMN solde_payment_method TEXT,    -- ex: "Espèces + Virement"
  ADD COLUMN facture_finale_url TEXT,      -- storage bucket "contracts": {id}/facture-finale.pdf
  ADD COLUMN stripe_solde_session_id TEXT; -- si paiement Stripe en ligne
```

### 2.2 Page `/admin/facturation`

**Route :** `src/app/admin/(protected)/facturation/page.tsx`

Page Server Component qui fetch toutes les réservations `statut = 'confirmee'` avec leur `solde_paid_at`.

**Layout :**
```
┌────────────────────────────────────────────────────┐
│ Facturation                                        │
│ Gérez les encaissements et factures finales        │
├─────────────┬─────────────┬──────────────┐         │
│ X soldes    │ Y encaissés │ CA total     │         │
│ en attente  │ ce mois     │ formation    │         │
├─────────────┴─────────────┴──────────────┘         │
│ [Tous] [Solde en attente] [Tout réglé]             │
│                                                    │
│ Tableau: Élève | Formation | Session | Acompte |   │
│          Solde | Statut | Actions                  │
└────────────────────────────────────────────────────┘
```

**Colonnes du tableau :**
- Élève (prenom + nom ou nom_client)
- Formation (via sessions → formations)
- Date session
- Acompte ✓ (montant + date)
- Solde restant (prix - acompte)
- Statut : badge "En attente" (amber) ou "Réglé ✓" (green) selon `solde_paid_at`
- Actions : bouton "Encaisser" (si pas encore réglé) + "📄 Facture" (si réglée)

**Fichier :** `src/app/admin/(protected)/facturation/FacturationTable.tsx` (Client Component pour filtres + modal)

### 2.3 Modal d'encaissement (`EncaissementModal.tsx`)

Modal Client Component, s'ouvre inline via state React.

**Structure :**
1. **En-tête :** Nom de l'élève — Formation — Session — Solde restant : **X €**
2. **Modes de paiement** (multi-sélect, chacun avec input montant si sélectionné) :
   - Espèces
   - Virement bancaire
   - CB manuelle (SumUp, terminal)
   - Chèque
   - Wero / PayPal
   - CB en ligne Stripe → pas d'input montant, remplace le bouton de validation
3. **Validation des montants** : somme des modes doit égaler le solde restant (sinon erreur inline)
4. **Boutons :**
   - Modes manuels → "Valider l'encaissement" → appel POST `/api/admin/reservations/[id]/encaissement`
   - CB Stripe sélectionné → "Envoyer lien de paiement Stripe" → appel POST, retourne URL, affichée avec bouton "Copier" + auto-envoi email

**États :** Idle → Loading → Success (affiche "Facture générée et envoyée ✓") / Error

### 2.4 API Route — Encaissement

**Fichier :** `src/app/api/admin/reservations/[id]/encaissement/route.ts`

**Auth :** Vérifie session admin via `createClient().auth.getUser()`

**Body JSON :**
```typescript
{
  methods: Array<{ label: string; amount: number }>;  // ex: [{label: "Espèces", amount: 200}]
  useStripe?: boolean; // si CB en ligne sélectionné
}
```

**Flux paiement manuel :**
1. Valider que `sum(methods.amount) === solde restant`
2. Générer `factureFinaleHtml` via `generateFactureFinaleHTML(params)`
3. Générer PDF via `generatePDFFromHtml(html)`
4. Upload vers Supabase Storage : `invoices/{reservationId}/facture-finale.pdf`
5. Mettre à jour `reservations` : `solde_paid_at = now()`, `solde_payment_method = methods.map(m => m.label).join(' + ')`, `facture_finale_url = path`
6. Envoyer `FinalInvoiceEmail` via Resend avec PDF en pièce jointe
7. `revalidatePath('/admin/facturation')`, `revalidatePath('/admin')`
8. Retourner `{ done: true }`

**Flux Stripe en ligne :**
1. Calculer `soldeAmount` (prix - acompte)
2. `stripe.checkout.sessions.create({ mode: 'payment', line_items: [...], metadata: { reservation_id, is_final_payment: 'true' }, ... })`
3. Mettre à jour `stripe_solde_session_id`
4. Envoyer email simple à l'élève avec le lien de paiement
5. Retourner `{ stripeUrl: session.url }`

**Modification webhook Stripe (`/api/webhook/stripe/route.ts`) :**
Ajouter, après la vérification `event.type === 'checkout.session.completed'` :
```typescript
const isFinal = session.metadata?.is_final_payment === 'true'
if (isFinal) {
  // Flux facture finale — ne pas faire l'email de confirmation initial
  // Générer facture finale, mettre à jour solde_paid_at, envoyer FinalInvoiceEmail
  return NextResponse.json({ received: true })
}
// Flux existant (acompte)...
```

### 2.5 Générateur HTML Facture Finale

**Fichier :** `src/lib/contract/facture-finale.ts`

**Design visuel :** Identique à `facture.ts` — barre or en-tête/pied, typographies Playfair Display (titres) + Hanken Grotesk (corps), logo BHC intégré en base64, palette or `#755a2d` / fond blanc / muted `#5a5248`. Seule la structure des lignes de facturation change.

**Interface :**
```typescript
export interface FactureFinaleParams {
  prenom: string; nom: string; email: string; telephone: string
  adresse: string; clientType: 'particulier' | 'pro'
  raisonSociale?: string; siret?: string
  formationTitre: string; dateSession: string
  prixTotal: number;           // formation.prix
  acompte: number;             // reservation.acompte_amount
  acompteStripeId: string;     // reservation.stripe_payment_id
  acomptePaidAt: string;       // reservation.acompte_paid_at (ISO)
  solde: number;               // prixTotal - acompte
  soldePaidAt: string;         // now() (ISO)
  soldePaymentMethod: string;  // "Espèces + Virement"
}
export function generateFactureFinaleHTML(p: FactureFinaleParams): string { ... }
```

**Même design que `facture.ts`** (gold bars, Playfair/Hanken, logo BHC base64). Nouvelles lignes du tableau :

| Désignation | Type | Montant |
|---|---|---|
| {Formation} — {dates} | Formation complète | {prixTotal} € |
| Acompte versé le {date} · Réf. {stripeId} | Acompte (30%) — déjà réglé | −{acompte} € |
| Solde — {modes paiement} | Solde réglé le {date} | {solde} € |

Totaux : Acompte versé · Solde réglé · **Total acquitté = {prixTotal} €** · Reste dû = 0 €
Référence : `BHC-YYYYMM-{last6StripeId}-F`
Badge : "✓ Formation intégralement réglée — Paiement complet"

### 2.6 Template Email — FinalInvoiceEmail

**Fichier :** `src/emails/FinalInvoiceEmail.tsx`

**Style :** Même charte que `ConfirmationEmail.tsx` (blanc, or, Playfair/Hanken, inline styles).

**Contenu :**
- Titre : "Votre formation est intégralement réglée"
- Message : "Merci {prenom}, votre formation {titre} est maintenant entièrement réglée. Vous trouverez ci-joint votre facture récapitulative."
- Recap : formation, dates, montant total, modes de paiement
- Signature Camille
- PJ : `facture-finale.pdf`

### 2.7 Widget Dashboard

**Modification :** `src/app/admin/(protected)/page.tsx`

Ajouter en haut du dashboard (avant la liste des sessions) :
```tsx
// Compter les réservations confirmées sans solde_paid_at
const { count: soldesEnAttente } = await supabase
  .from('reservations')
  .select('id', { count: 'exact', head: true })
  .eq('statut', 'confirmee')
  .is('solde_paid_at', null)

// Widget
{soldesEnAttente > 0 && (
  <div className="...">
    💰 {soldesEnAttente} solde(s) en attente
    <a href="/admin/facturation">Voir la facturation →</a>
  </div>
)}
```

### 2.8 Navigation Admin

Ajouter dans `src/app/admin/layout.tsx` :
```tsx
<Link href="/admin/facturation">FACTURATION</Link>
```
Après "RÉSERVATIONS" dans la nav.

---

## Sous-projet 3 — Amélioration du Dossier ZIP

**Fichier modifié :** `src/app/api/admin/reservations/[id]/dossier/route.ts`

**Ajouts au ZIP :**

**4. Facture d'acompte (régénérée)** — si `reservation.stripe_payment_id` et `reservation.acompte_paid_at` existent :
```typescript
const { generateFactureHTML } = await import('@/lib/contract/facture')
const factureAcompteHtml = generateFactureHTML({ ...params })
const facturePdf = await generatePDFFromHtml(factureAcompteHtml)
zip.file(`Facture_acompte_${safeName}.pdf`, facturePdf)
```

**5. Facture finale** — si `reservation.facture_finale_url` existe :
```typescript
const { data: signedUrl } = await supabase.storage
  .from('invoices')  // ou 'contracts' selon bucket choisi
  .createSignedUrl(reservation.facture_finale_url, 3600)
if (signedUrl?.signedUrl) {
  const r = await fetch(signedUrl.signedUrl)
  if (r.ok) zip.file(`Facture_finale_${safeName}.pdf`, await r.arrayBuffer())
}
```

**Note :** Les factures finales sont stockées dans le bucket `contracts` existant, sous `{reservationId}/facture-finale.pdf` — cohérent avec le contrat signé déjà à `{reservationId}/contrat-signe.pdf`. Pas de nouveau bucket à créer.

---

## Fichiers à créer/modifier

| Fichier | Action |
|---|---|
| `src/app/admin/(protected)/page.tsx` | Modifier — fix dashboard |
| `src/app/admin/actions.ts` | Modifier — fix deleteSession |
| `src/app/admin/layout.tsx` | Modifier — ajouter lien FACTURATION |
| `src/app/admin/DownloadContractButton.tsx` | Supprimer |
| `src/app/admin/(protected)/facturation/page.tsx` | Créer |
| `src/app/admin/(protected)/facturation/FacturationTable.tsx` | Créer |
| `src/app/admin/(protected)/facturation/EncaissementModal.tsx` | Créer |
| `src/lib/contract/facture-finale.ts` | Créer |
| `src/emails/FinalInvoiceEmail.tsx` | Créer |
| `src/app/api/admin/reservations/[id]/encaissement/route.ts` | Créer |
| `src/app/api/admin/reservations/[id]/dossier/route.ts` | Modifier — + 2 PDFs |
| `src/app/api/webhook/stripe/route.ts` | Modifier — is_final_payment |
| Migration SQL | RLS sessions + 4 colonnes reservations + création bucket "invoices" |

---

## Contraintes légales (Art. L.441-9 Code de Commerce — Factures françaises)

Chaque facture doit mentionner :
- Numéro de facture unique chronologique (format `BHC-YYYYMM-XXXXXX` ou `BHC-YYYYMM-XXXXXX-F`)
- Date d'émission
- Identité du vendeur (EI Camille Grignon, SIRET 910 934 140 000 47, NDA 32 80 02643 80)
- Identité de l'acheteur
- Désignation de la prestation
- Prix HT et mention TVA non applicable (Art. 293B CGI)
- Conditions de règlement / mode de paiement

La facture d'acompte (`-` sans suffixe) et la facture finale (`-F`) sont deux documents complémentaires, conformes à la pratique des acomptes en droit français.
