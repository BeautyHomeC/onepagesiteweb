# Admin Correctifs + Facturation — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 4 admin bugs (dashboard client, sessions RLS, deleteSession FK, obsolete download button), add a billing system for final payments with PDF invoice generation and email, and enhance the ZIP dossier with both invoices.

**Architecture:** Three sequential phases. Phase 1 (Tasks 1-4): SQL migration + admin bug fixes. Phase 2 (Tasks 5-10): Billing system — facturation page, encaissement modal, API route, invoice HTML generator, email template. Phase 3 (Tasks 11-12): ZIP dossier enhancement + Stripe webhook update for online final payments. All DB writes use `createAdminClient()` (service role key, bypasses RLS), public reads use `createClient()` (anon key).

**Tech Stack:** Next.js App Router (TypeScript), Supabase (`createAdminClient` / `createClient` from `@/lib/supabase/server`), Stripe (`2026-04-22.dahlia`), Resend + React Email (100% inline styles, no Tailwind in emails), Puppeteer + @sparticuz/chromium-min via existing `generatePDFFromHtml()` in `src/lib/contract/pdf.ts`, JSZip

---

## File Map

**Create:**
- `supabase/migration-billing.sql` — RLS policy for sessions + 4 new columns on reservations
- `src/lib/contract/facture-finale.ts` — Final invoice HTML generator (mirrors facture.ts style, different lines)
- `src/emails/FinalInvoiceEmail.tsx` — React Email template for final payment confirmation
- `src/app/api/admin/reservations/[id]/encaissement/route.ts` — POST: process payment, generate/send invoice or create Stripe session
- `src/app/admin/(protected)/facturation/page.tsx` — Server Component: billing overview with stats
- `src/app/admin/(protected)/facturation/FacturationTable.tsx` — Client Component: filterable table + modal state
- `src/app/admin/(protected)/facturation/EncaissementModal.tsx` — Client Component: payment method selection + submit

**Modify:**
- `src/app/admin/(protected)/page.tsx` — Use createAdminClient, fix field names, fix download link, add billing widget
- `src/app/admin/actions.ts` — Fix deleteSession: check FK before deleting
- `src/app/admin/layout.tsx` — Add FACTURATION nav link
- `src/app/api/admin/reservations/[id]/dossier/route.ts` — Add deposit + final invoices to ZIP
- `src/app/api/webhook/stripe/route.ts` — Handle is_final_payment metadata for online final payments

**Delete:**
- `src/app/admin/DownloadContractButton.tsx` — Obsolete component (wrong storage path)

---

### Task 1: SQL Migration — RLS + Billing Columns

**Files:**
- Create: `supabase/migration-billing.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migration-billing.sql
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Allow public SELECT on sessions (anon key used by FormationsSection.tsx)
CREATE POLICY "sessions_public_read" ON sessions
  FOR SELECT USING (true);

-- 2. Add billing columns to reservations
ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS solde_paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS solde_payment_method TEXT,
  ADD COLUMN IF NOT EXISTS facture_finale_url TEXT,
  ADD COLUMN IF NOT EXISTS stripe_solde_session_id TEXT;
```

- [ ] **Step 2: Run in Supabase dashboard**

Go to Supabase Dashboard → SQL Editor → paste the SQL → click "Run".
Expected: "Success. No rows returned" for each statement.

- [ ] **Step 3: Verify sessions RLS**

In Supabase Dashboard → Authentication → Policies → sessions table.
Expected: a new policy "sessions_public_read" is listed with SELECT rule.

- [ ] **Step 4: Verify columns added**

In Supabase Dashboard → Table Editor → reservations.
Expected: columns `solde_paid_at`, `solde_payment_method`, `facture_finale_url`, `stripe_solde_session_id` appear.

- [ ] **Step 5: Verify sessions appear on public site**

Open the homepage in a browser. Scroll to formations section.
Expected: if sessions exist in Supabase, they now appear with dates and available places. (Previously showed empty because anon SELECT was blocked by RLS.)

- [ ] **Step 6: Commit**

```bash
git add supabase/migration-billing.sql
git commit -m "sql: add sessions RLS policy + billing columns on reservations"
```

---

### Task 2: Fix Admin Dashboard

**Files:**
- Modify: `src/app/admin/(protected)/page.tsx`
- Delete: `src/app/admin/DownloadContractButton.tsx`

The current dashboard has 3 bugs: (1) uses `createClient()` (anon) instead of `createAdminClient()` (service role), (2) queries `nom_client/email_client/telephone_client` (old schema) but new reservations use `prenom/nom`, (3) `DownloadContractButton` component uses wrong Storage path.

- [ ] **Step 1: Replace the entire dashboard file**

```typescript
// src/app/admin/(protected)/page.tsx
import { createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function AdminDashboard() {
  const supabase = await createAdminClient();

  const signOut = async () => {
    'use server'
    const { createClient } = await import('@/lib/supabase/server')
    const sc = await createClient()
    await sc.auth.signOut()
    redirect('/admin/login')
  }

  // Fetch sessions with formations + reservations (using new field names)
  const { data: sessions } = await supabase
    .from('sessions')
    .select(`
      id, date_debut, date_fin, places_disponibles,
      formations ( titre, prix ),
      reservations ( id, prenom, nom, nom_client, email_client, telephone, telephone_client, acompte_amount, statut, stripe_payment_id, created_at )
    `)
    .order('date_debut', { ascending: true });

  // Count pending balances for widget
  const { count: soldesEnAttente } = await supabase
    .from('reservations')
    .select('id', { count: 'exact', head: true })
    .eq('statut', 'confirmee')
    .is('solde_paid_at', null)

  return (
    <div>
      <div className="flex justify-between items-end mb-8">
        <h2 className="font-headline-md text-headline-md">Tableau de Bord</h2>
        <form action={signOut}>
          <button type="submit" className="font-label-caps text-label-caps text-on-surface-variant hover:text-error transition-colors uppercase border-b border-transparent hover:border-error pb-1">
            Se déconnecter
          </button>
        </form>
      </div>

      {/* Billing widget */}
      {(soldesEnAttente ?? 0) > 0 && (
        <div className="mb-8 p-5 bg-amber-50 border border-amber-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-label-caps tracking-widest text-amber-700 uppercase mb-1">Soldes en attente</p>
            <p className="text-on-surface text-sm font-medium">
              {soldesEnAttente} solde{(soldesEnAttente ?? 0) > 1 ? 's' : ''} à encaisser
            </p>
          </div>
          <a
            href="/admin/facturation"
            className="text-xs font-label-caps tracking-widest text-amber-700 hover:text-amber-900 uppercase border-b border-amber-400 pb-0.5 transition-colors"
          >
            Voir la facturation →
          </a>
        </div>
      )}

      <div className="space-y-12">
        {sessions?.length === 0 ? (
          <div className="p-8 bg-surface border border-surface-container-highest text-center space-y-4">
            <p className="text-on-surface-variant font-body-md">Aucune session programmée pour le moment.</p>
            <div className="flex justify-center gap-4 pt-4">
              <a href="/admin/formations" className="inline-block border border-surface-container-highest px-6 py-3 font-label-caps tracking-widest text-sm hover:text-primary transition-colors">
                GÉRER LE CATALOGUE
              </a>
              <a href="/admin/sessions" className="inline-block bg-primary text-on-primary px-6 py-3 font-label-caps tracking-widest text-sm hover:bg-primary-container hover:text-on-primary-container transition-colors">
                + OUVRIR UNE SESSION
              </a>
            </div>
          </div>
        ) : (
          sessions?.map((session) => (
            <div key={session.id} className="bg-surface p-8 shadow-ambient border border-surface-container-highest">
              <div className="flex justify-between items-start mb-6 pb-6 border-b border-surface-container-highest">
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-primary mb-2">
                    {(session.formations as any)?.titre}
                  </h3>
                  <p className="font-body-md text-on-surface-variant">
                    Du {new Date(session.date_debut).toLocaleDateString('fr-FR')} au {new Date(session.date_fin).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="text-right">
                  <span className="block font-display-lg-mobile text-primary leading-none mb-1">
                    {session.places_disponibles}
                  </span>
                  <span className="font-label-caps text-label-caps text-on-surface-variant uppercase">
                    Places restantes
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-label-caps text-label-caps uppercase text-on-surface-variant mb-4">
                  Liste d'émargement ({(session.reservations as any[])?.length || 0} inscrits)
                </h4>
                {(session.reservations as any[])?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-body-md">
                      <thead>
                        <tr className="border-b border-surface-container-high text-on-surface-variant">
                          <th className="py-3 font-normal">Nom</th>
                          <th className="py-3 font-normal">Email</th>
                          <th className="py-3 font-normal">Statut</th>
                          <th className="py-3 font-normal">Inscription</th>
                          <th className="py-3 font-normal">Dossier</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(session.reservations as any[]).map((res) => {
                          const nomAffiche = (`${res.prenom ?? ''} ${res.nom ?? ''}`.trim() || res.nom_client) ?? '—'
                          return (
                            <tr key={res.id} className="border-b border-surface-container-low last:border-0">
                              <td className="py-4">{nomAffiche}</td>
                              <td className="py-4 text-on-surface-variant">{res.email_client ?? '—'}</td>
                              <td className="py-4">
                                <span className={`text-xs px-2 py-0.5 font-label-caps tracking-wider ${
                                  res.statut === 'confirmee' ? 'text-green-700 bg-green-50' : 'text-amber-700 bg-amber-50'
                                }`}>
                                  {res.statut === 'confirmee' ? 'Confirmée' : 'En attente'}
                                </span>
                              </td>
                              <td className="py-4 text-on-surface-variant text-sm">
                                {new Date(res.created_at).toLocaleDateString('fr-FR')}
                              </td>
                              <td className="py-4">
                                <a
                                  href={`/api/admin/reservations/${res.id}/dossier`}
                                  download
                                  className="text-xs text-on-surface-variant hover:text-primary transition-colors font-label-caps tracking-wider"
                                  title="Télécharger le dossier ZIP"
                                >
                                  ZIP ↓
                                </a>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-on-surface-variant text-sm italic">Aucune réservation pour le moment.</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Delete the obsolete DownloadContractButton component**

```bash
rm "src/app/admin/DownloadContractButton.tsx"
```

- [ ] **Step 3: Verify dashboard renders without TypeScript errors**

```bash
npx tsc --noEmit
```

Expected: no errors related to the dashboard file.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/(protected)/page.tsx
git rm src/app/admin/DownloadContractButton.tsx
git commit -m "fix(admin): use createAdminClient in dashboard, fix field names, replace broken download button"
```

---

### Task 3: Fix deleteSession — FK Constraint Check

**Files:**
- Modify: `src/app/admin/actions.ts` (lines 164-178, the `deleteSession` function)

The current `deleteSession` blindly calls `.delete()` and gets a Supabase FK constraint error if any reservations exist. The error message shown to users is not informative.

- [ ] **Step 1: Replace the deleteSession function in actions.ts**

Find this block in `src/app/admin/actions.ts` (approximately line 164-178):
```typescript
export async function deleteSession(id: string) {
  await requireAuth();
  const supabase = await createAdminClient();

  const { error } = await supabase.from('sessions').delete().eq('id', id);
  if (error) {
    console.error('Delete session error:', error);
    throw new Error('Impossible de supprimer cette session (il y a peut-être déjà des réservations).');
  }

  revalidatePath('/admin/sessions');
  revalidatePath('/admin');
  revalidatePath('/');
  return { success: true };
}
```

Replace with:

```typescript
export async function deleteSession(id: string) {
  await requireAuth();
  const supabase = await createAdminClient();

  // Check for linked reservations before attempting delete
  const { count, error: countError } = await supabase
    .from('reservations')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', id);

  if (countError) {
    console.error('Count reservations error:', countError);
    throw new Error('Erreur lors de la vérification des réservations liées.');
  }

  if (count && count > 0) {
    throw new Error(
      `Impossible de supprimer : cette session a ${count} réservation${count > 1 ? 's' : ''} liée${count > 1 ? 's' : ''}. Annulez d'abord les réservations.`
    );
  }

  const { error } = await supabase.from('sessions').delete().eq('id', id);
  if (error) {
    console.error('Delete session error:', error);
    throw new Error('Impossible de supprimer cette session.');
  }

  revalidatePath('/admin/sessions');
  revalidatePath('/admin');
  revalidatePath('/');
  return { success: true };
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/actions.ts
git commit -m "fix(admin): deleteSession checks FK before deleting, shows clear error message"
```

---

### Task 4: Admin Nav — Add FACTURATION Link

**Files:**
- Modify: `src/app/admin/layout.tsx`

- [ ] **Step 1: Add FACTURATION link after RÉSERVATIONS in the nav**

In `src/app/admin/layout.tsx`, find:
```tsx
<Link href="/admin/reservations" className="hover:text-primary transition-colors whitespace-nowrap">RÉSERVATIONS</Link>
```

Add immediately after:
```tsx
<Link href="/admin/facturation" className="hover:text-primary transition-colors whitespace-nowrap">FACTURATION</Link>
```

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/layout.tsx
git commit -m "feat(admin): add FACTURATION link to admin nav"
```

---

### Task 5: Final Invoice HTML Generator

**Files:**
- Create: `src/lib/contract/facture-finale.ts`

This file exports `generateFactureFinaleHTML(params)` which returns a full A4 HTML string rendered to PDF via the existing `generatePDFFromHtml()` function. Visually identical to `facture.ts` (gold bars, Playfair Display + Hanken Grotesk, BHC logo base64) but with 3 line items showing full price, minus acompte, plus solde paid today.

- [ ] **Step 1: Create `src/lib/contract/facture-finale.ts`**

```typescript
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

export interface FactureFinaleParams {
  prenom: string
  nom: string
  email: string
  telephone: string
  adresse: string
  clientType: 'particulier' | 'pro'
  raisonSociale?: string
  siret?: string
  formationTitre: string
  dateSession: string
  prixTotal: number          // formation.prix
  acompte: number            // reservation.acompte_amount
  acompteStripeId: string    // reservation.stripe_payment_id
  acomptePaidAt: string      // reservation.acompte_paid_at (ISO string)
  solde: number              // prixTotal - acompte
  soldePaidAt: string        // new Date().toISOString() at payment time
  soldePaymentMethod: string // e.g. "Espèces + Virement"
}

function logoBase64(): string | null {
  try {
    const p = join(process.cwd(), 'public', 'templates', 'assets', 'logo-bhc.png')
    if (!existsSync(p)) return null
    return `data:image/png;base64,${readFileSync(p).toString('base64')}`
  } catch { return null }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

function invoiceRef(stripeId: string, paidAt: string): string {
  const d = new Date(paidAt)
  const yy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const suffix = stripeId.replace(/^(pi_|ch_)/, '').slice(-6).toUpperCase()
  return `BHC-${yy}${mm}-${suffix}-F`
}

export function generateFactureFinaleHTML(p: FactureFinaleParams): string {
  const gold = '#755a2d'
  const goldLight = 'rgba(117,90,45,0.07)'
  const goldBorder = 'rgba(117,90,45,0.2)'
  const dark = '#1b1c1c'
  const muted = '#5a5248'
  const subtle = '#8c8278'
  const line = '#e9e8e8'
  const green = '#166534'
  const serif = "'Playfair Display', Georgia, serif"
  const sans = "'Hanken Grotesk', Arial, Helvetica, sans-serif"

  const logo = logoBase64()
  const ref = invoiceRef(p.acompteStripeId, p.soldePaidAt)
  const dateEmission = formatDate(p.soldePaidAt)
  const dateAcompte = formatDate(p.acomptePaidAt)
  const nomClient = `${p.prenom} ${p.nom}`.trim()
  const docType = p.clientType === 'pro' ? 'Convention' : 'Contrat'

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Hanken+Grotesk:wght@300;400;500&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 210mm; background: #fff; color: ${dark}; }
  @page { size: A4; margin: 0; }
  @media print { html, body { width: 210mm; } }
  body { font-family: ${sans}; font-size: 13px; font-weight: 300; line-height: 1.6; }
  .page { width: 210mm; min-height: 297mm; display: flex; flex-direction: column; padding: 0; }
  .gold-bar { height: 4px; background: ${gold}; }
  .gold-bar-sm { height: 1px; background: ${goldBorder}; }
  .header { padding: 32px 48px 28px; display: flex; align-items: center; justify-content: space-between; }
  .logo-area { display: flex; flex-direction: column; gap: 4px; }
  .logo-img { height: 48px; object-fit: contain; object-position: left; }
  .logo-text { font-family: ${serif}; font-size: 18px; font-weight: 400; color: ${dark}; letter-spacing: 0.08em; text-transform: uppercase; }
  .logo-sub { font-family: ${sans}; font-size: 9px; letter-spacing: 0.28em; text-transform: uppercase; color: ${subtle}; font-weight: 400; }
  .invoice-title-block { text-align: right; }
  .invoice-type { font-family: ${sans}; font-size: 9px; letter-spacing: 0.32em; text-transform: uppercase; color: ${gold}; font-weight: 500; margin-bottom: 6px; }
  .invoice-ref { font-family: ${serif}; font-size: 22px; font-weight: 400; color: ${dark}; }
  .invoice-date { font-family: ${sans}; font-size: 11px; color: ${muted}; font-weight: 300; margin-top: 4px; }
  .parties { padding: 24px 48px; display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
  .party-label { font-family: ${sans}; font-size: 9px; letter-spacing: 0.28em; text-transform: uppercase; color: ${gold}; font-weight: 500; margin-bottom: 10px; }
  .party-name { font-family: ${serif}; font-size: 16px; font-weight: 400; color: ${dark}; margin-bottom: 6px; }
  .party-detail { font-family: ${sans}; font-size: 12px; color: ${muted}; font-weight: 300; line-height: 1.7; }
  .section { padding: 0 48px 24px; }
  .section-label { font-family: ${sans}; font-size: 9px; letter-spacing: 0.28em; text-transform: uppercase; color: ${subtle}; font-weight: 500; margin-bottom: 14px; }
  table.lines { width: 100%; border-collapse: collapse; }
  table.lines thead tr { border-bottom: 1px solid ${goldBorder}; }
  table.lines thead th { font-family: ${sans}; font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: ${subtle}; font-weight: 500; padding: 0 0 10px; text-align: left; }
  table.lines thead th:last-child { text-align: right; }
  table.lines tbody tr { border-bottom: 1px solid ${line}; }
  table.lines tbody td { font-family: ${sans}; font-size: 13px; font-weight: 300; color: ${dark}; padding: 12px 0; vertical-align: top; }
  table.lines tbody td:last-child { text-align: right; font-weight: 400; }
  table.lines tbody td.desc-sub { font-size: 11px; color: ${muted}; margin-top: 2px; display: block; }
  .totals-box { background: ${goldLight}; border: 1px solid ${goldBorder}; padding: 20px 24px; margin: 0 48px 24px; }
  table.totals { width: 100%; border-collapse: collapse; }
  table.totals td { font-family: ${sans}; font-size: 13px; font-weight: 300; color: ${muted}; padding: 5px 0; }
  table.totals td:last-child { text-align: right; font-weight: 400; color: ${dark}; }
  table.totals tr.total-row td { font-family: ${serif}; font-size: 16px; font-weight: 400; color: ${gold}; padding-top: 12px; border-top: 1px solid ${goldBorder}; }
  table.totals tr.total-row td:last-child { font-family: ${serif}; font-size: 18px; }
  table.totals tr.zero-row td { font-family: ${sans}; font-size: 12px; font-weight: 500; color: ${green}; padding-top: 6px; }
  .paid-badge { display: inline-block; background: ${green}; color: #fff; font-family: ${sans}; font-size: 9px; letter-spacing: 0.3em; text-transform: uppercase; font-weight: 500; padding: 5px 14px; margin: 0 48px 24px; }
  .spacer { flex: 1; }
  .footer { margin-top: auto; padding: 20px 48px; border-top: 1px solid ${line}; display: flex; justify-content: space-between; align-items: flex-end; }
  .footer-left { font-family: ${sans}; font-size: 10px; color: ${subtle}; font-weight: 300; line-height: 1.7; }
  .footer-right { text-align: right; font-family: ${sans}; font-size: 10px; color: ${subtle}; font-weight: 300; line-height: 1.7; }
  .footer-brand { font-family: ${serif}; font-size: 13px; color: ${dark}; font-weight: 400; display: block; margin-bottom: 4px; }
</style>
</head>
<body>
<div class="page">
  <div class="gold-bar"></div>
  <div class="header">
    <div class="logo-area">
      ${logo
        ? `<img src="${logo}" alt="Beauty Home Concept" class="logo-img" />`
        : `<span class="logo-text">Beauty Home Concept</span>`}
      <span class="logo-sub">Academy · Formation Professionnelle</span>
    </div>
    <div class="invoice-title-block">
      <div class="invoice-type">Facture de solde</div>
      <div class="invoice-ref">${ref}</div>
      <div class="invoice-date">Émise le ${dateEmission}</div>
    </div>
  </div>
  <div class="gold-bar-sm" style="margin: 0 48px;"></div>
  <div class="parties">
    <div class="party-block">
      <div class="party-label">Facturée à</div>
      <div class="party-name">${nomClient}</div>
      <div class="party-detail">
        ${p.email}<br>
        ${p.telephone ? p.telephone + '<br>' : ''}
        ${p.adresse ? p.adresse + '<br>' : ''}
        ${p.clientType === 'pro' && p.raisonSociale ? p.raisonSociale + '<br>' : ''}
        ${p.clientType === 'pro' && p.siret ? 'SIRET : ' + p.siret : ''}
      </div>
    </div>
    <div class="party-block">
      <div class="party-label">Émise par</div>
      <div class="party-name">Beauty Home Concept</div>
      <div class="party-detail">
        EI Camille Grignon<br>
        22A rue du Général Leclerc<br>
        80000 Amiens, France<br>
        contact@beautyhomeconcept.fr<br>
        SIRET : 910 934 140 000 47
      </div>
    </div>
  </div>
  <div class="gold-bar-sm" style="margin: 0 48px 24px;"></div>
  <div class="section">
    <div class="section-label">Détail de la prestation</div>
    <table class="lines">
      <thead>
        <tr>
          <th>Désignation</th>
          <th>Type</th>
          <th>Montant</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong style="font-weight:500;">${p.formationTitre}</strong>
            <span class="desc-sub">${docType} de formation — ${p.dateSession}</span>
            <span class="desc-sub">Organisme certifié Qualiopi · NDA 32 80 02643 80</span>
          </td>
          <td style="color:${muted}; font-size:12px;">Prix total</td>
          <td>${p.prixTotal.toLocaleString('fr-FR')} €</td>
        </tr>
        <tr>
          <td>
            <span style="color:${muted};">Acompte versé le ${dateAcompte}</span>
            <span class="desc-sub">Réf. ${p.acompteStripeId}</span>
          </td>
          <td style="color:${muted}; font-size:12px;">Acompte (30%) — déjà réglé</td>
          <td style="color:${muted};">−${p.acompte.toLocaleString('fr-FR')} €</td>
        </tr>
        <tr>
          <td>
            <strong style="font-weight:500;">Solde de la formation</strong>
            <span class="desc-sub">Mode de règlement : ${p.soldePaymentMethod}</span>
          </td>
          <td style="color:${muted}; font-size:12px;">Solde (70%) — réglé le ${dateEmission}</td>
          <td>${p.solde.toLocaleString('fr-FR')} €</td>
        </tr>
      </tbody>
    </table>
  </div>
  <div class="totals-box">
    <table class="totals">
      <tbody>
        <tr>
          <td>Acompte versé le ${dateAcompte}</td>
          <td>${p.acompte.toLocaleString('fr-FR')} €</td>
        </tr>
        <tr>
          <td>Solde réglé le ${dateEmission} — ${p.soldePaymentMethod}</td>
          <td>${p.solde.toLocaleString('fr-FR')} €</td>
        </tr>
        <tr class="total-row">
          <td>Total acquitté</td>
          <td>${p.prixTotal.toLocaleString('fr-FR')} €</td>
        </tr>
        <tr class="zero-row">
          <td>✓ Reste dû</td>
          <td>0,00 €</td>
        </tr>
      </tbody>
    </table>
  </div>
  <div>
    <div class="paid-badge">✓ Formation intégralement réglée — ${p.soldePaymentMethod}</div>
  </div>
  <div class="spacer"></div>
  <div class="footer">
    <div class="footer-left">
      <span class="footer-brand">Beauty Home Concept</span>
      EI Camille Grignon · SIRET 910 934 140 000 47<br>
      N° de déclaration d'activité : 32 80 02643 80<br>
      TVA non applicable — article 293B du CGI
    </div>
    <div class="footer-right">
      22A rue du Général Leclerc<br>
      80000 Amiens, France<br>
      contact@beautyhomeconcept.fr
    </div>
  </div>
  <div class="gold-bar"></div>
</div>
</body>
</html>`
}
```

- [ ] **Step 2: Verify TypeScript types compile**

```bash
npx tsc --noEmit
```

Expected: no errors in this file.

- [ ] **Step 3: Commit**

```bash
git add src/lib/contract/facture-finale.ts
git commit -m "feat: add final invoice HTML generator (facture-finale.ts)"
```

---

### Task 6: Final Invoice Email Template

**Files:**
- Create: `src/emails/FinalInvoiceEmail.tsx`

React Email component with 100% inline styles (no Tailwind). Same branding as ConfirmationEmail.tsx (white background, gold bars, Playfair serif for brand name, Arial for body). Shows payment completion summary with acompte + solde + total paid + 0 remaining.

- [ ] **Step 1: Create `src/emails/FinalInvoiceEmail.tsx`**

```tsx
import {
  Html, Head, Body, Container, Section, Text, Font,
} from '@react-email/components'

interface FinalInvoiceEmailProps {
  nomClient: string
  prenom: string
  formationTitre: string
  dateSession: string
  prixTotal: number
  acompte: number
  solde: number
  soldePaymentMethod: string
}

export default function FinalInvoiceEmail({
  nomClient, prenom, formationTitre, dateSession,
  prixTotal, acompte, solde, soldePaymentMethod,
}: FinalInvoiceEmailProps) {
  const gold = '#755a2d'
  const dark = '#1b1c1c'
  const muted = '#5a5248'
  const subtle = '#8c8278'
  const line = '#e9e8e8'
  const green = '#166534'

  return (
    <Html lang="fr">
      <Head>
        <Font
          fontFamily="Playfair Display"
          fallbackFontFamily="Georgia"
          webFont={{
            url: 'https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvUDQZNLo_U2r.woff2',
            format: 'woff2',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Body style={{ backgroundColor: '#f5f3f0', margin: 0, padding: '32px 0', fontFamily: 'Arial, Helvetica, sans-serif' }}>
        <Container style={{ maxWidth: 600, margin: '0 auto', backgroundColor: '#ffffff' }}>
          {/* Top gold bar */}
          <div style={{ height: 4, backgroundColor: gold }} />

          {/* Header */}
          <Section style={{ padding: '36px 48px 20px' }}>
            <Text style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: dark, letterSpacing: '0.08em', textTransform: 'uppercase' as const, margin: 0 }}>
              Beauty Home Concept
            </Text>
            <Text style={{ fontFamily: 'Arial, sans-serif', fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase' as const, color: subtle, margin: '4px 0 0', fontWeight: 400 }}>
              Academy · Formation Professionnelle
            </Text>
          </Section>

          <div style={{ height: 1, backgroundColor: line, margin: '0 48px' }} />

          {/* Title */}
          <Section style={{ padding: '32px 48px 8px' }}>
            <Text style={{ fontFamily: 'Arial, sans-serif', fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase' as const, color: gold, fontWeight: 500, margin: '0 0 8px' }}>
              Confirmation de paiement complet
            </Text>
            <Text style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: dark, margin: 0, lineHeight: 1.2 }}>
              Formation intégralement réglée
            </Text>
          </Section>

          {/* Green badge */}
          <Section style={{ padding: '20px 48px' }}>
            <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '16px 20px' }}>
              <Text style={{ fontFamily: 'Arial, sans-serif', fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase' as const, color: green, fontWeight: 500, margin: '0 0 6px' }}>
                ✓ Paiement complet
              </Text>
              <Text style={{ fontSize: 14, color: green, fontWeight: 500, margin: 0 }}>
                {formationTitre} — {dateSession}
              </Text>
            </div>
          </Section>

          {/* Message */}
          <Section style={{ padding: '0 48px 24px' }}>
            <Text style={{ fontSize: 15, color: muted, fontWeight: 300, lineHeight: 1.7, margin: '0 0 12px' }}>
              Bonjour {prenom},
            </Text>
            <Text style={{ fontSize: 15, color: muted, fontWeight: 300, lineHeight: 1.7, margin: 0 }}>
              Votre formation <strong style={{ color: dark, fontWeight: 500 }}>{formationTitre}</strong> est désormais intégralement réglée. Votre facture de solde est jointe à cet email en pièce jointe PDF — conservez-la pour votre dossier.
            </Text>
          </Section>

          {/* Summary table */}
          <Section style={{ padding: '0 48px 24px' }}>
            <Text style={{ fontFamily: 'Arial, sans-serif', fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase' as const, color: subtle, fontWeight: 500, margin: '0 0 14px' }}>
              Récapitulatif financier
            </Text>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr style={{ borderBottom: `1px solid ${line}` }}>
                  <td style={{ padding: '9px 0', fontSize: 13, color: muted, fontWeight: 300 }}>Acompte versé</td>
                  <td style={{ padding: '9px 0', fontSize: 13, color: dark, textAlign: 'right' as const }}>{acompte.toLocaleString('fr-FR')} €</td>
                </tr>
                <tr style={{ borderBottom: `1px solid ${line}` }}>
                  <td style={{ padding: '9px 0', fontSize: 13, color: muted, fontWeight: 300 }}>Solde réglé ({soldePaymentMethod})</td>
                  <td style={{ padding: '9px 0', fontSize: 13, color: dark, textAlign: 'right' as const }}>{solde.toLocaleString('fr-FR')} €</td>
                </tr>
                <tr style={{ borderBottom: `1px solid ${line}` }}>
                  <td style={{ padding: '12px 0 9px', fontSize: 16, fontFamily: 'Georgia, serif', color: gold }}>Total acquitté</td>
                  <td style={{ padding: '12px 0 9px', fontSize: 18, fontFamily: 'Georgia, serif', color: gold, textAlign: 'right' as const }}>{prixTotal.toLocaleString('fr-FR')} €</td>
                </tr>
                <tr>
                  <td style={{ padding: '9px 0', fontSize: 12, color: green, fontWeight: 500 }}>✓ Reste dû</td>
                  <td style={{ padding: '9px 0', fontSize: 12, color: green, fontWeight: 500, textAlign: 'right' as const }}>0,00 €</td>
                </tr>
              </tbody>
            </table>
          </Section>

          <div style={{ height: 1, backgroundColor: line, margin: '0 48px 32px' }} />

          {/* Signature */}
          <Section style={{ padding: '0 48px 32px' }}>
            <Text style={{ fontSize: 14, color: muted, fontWeight: 300, lineHeight: 1.8, margin: '0 0 4px' }}>
              Avec plaisir,
            </Text>
            <Text style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: gold, margin: '0 0 4px', fontStyle: 'italic' }}>
              Camille Grignon
            </Text>
            <Text style={{ fontFamily: 'Arial, sans-serif', fontSize: 11, color: subtle, margin: 0, letterSpacing: '0.1em' }}>
              Beauty Home Concept — Directrice Pédagogique
            </Text>
          </Section>

          {/* Footer */}
          <div style={{ height: 1, backgroundColor: line }} />
          <Section style={{ padding: '16px 48px', backgroundColor: '#faf9f9' }}>
            <Text style={{ fontSize: 10, color: subtle, fontWeight: 300, lineHeight: 1.7, margin: 0 }}>
              Beauty Home Concept · EI Camille Grignon · SIRET 910 934 140 000 47<br />
              N° de déclaration d'activité : 32 80 02643 80 · TVA non applicable (art. 293B CGI)<br />
              22A rue du Général Leclerc, 80000 Amiens · contact@beautyhomeconcept.fr
            </Text>
          </Section>
          <div style={{ height: 4, backgroundColor: gold }} />
        </Container>
      </Body>
    </Html>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors in this file.

- [ ] **Step 3: Commit**

```bash
git add src/emails/FinalInvoiceEmail.tsx
git commit -m "feat: add FinalInvoiceEmail React Email template"
```

---

### Task 7: Encaissement API Route

**Files:**
- Create: `src/app/api/admin/reservations/[id]/encaissement/route.ts`

POST endpoint. Auth-gated (admin only). Two modes:
1. Manual payment: generates PDF, uploads to Storage, updates reservation, sends email with PDF.
2. Stripe online: creates a Stripe Checkout Session for the solde amount, stores session ID, returns the Stripe URL.

- [ ] **Step 1: Create the directory and route file**

```bash
mkdir -p "src/app/api/admin/reservations/[id]/encaissement"
```

- [ ] **Step 2: Create `src/app/api/admin/reservations/[id]/encaissement/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import Stripe from 'stripe'
import FinalInvoiceEmail from '@/emails/FinalInvoiceEmail'
import { revalidatePath } from 'next/cache'

interface Params {
  params: Promise<{ id: string }>
}

export async function POST(req: Request, { params }: Params) {
  // Auth check — admin only
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: reservationId } = await params

  const body = await req.json()
  const { methods, useStripe } = body as {
    methods?: Array<{ label: string; amount: number }>
    useStripe?: boolean
  }

  const supabaseAdmin = await createAdminClient()

  // Fetch full reservation data
  const { data: reservation, error } = await supabaseAdmin
    .from('reservations')
    .select(`
      id, prenom, nom, nom_client, email_client,
      telephone, telephone_client, adresse, client_type, raison_sociale, siret,
      acompte_amount, acompte_paid_at, stripe_payment_id, solde_paid_at,
      sessions (
        date_debut, date_fin,
        formations ( titre, prix )
      )
    `)
    .eq('id', reservationId)
    .single()

  if (error || !reservation) {
    return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 })
  }

  if (reservation.solde_paid_at) {
    return NextResponse.json({ error: 'Le solde de cette réservation est déjà encaissé.' }, { status: 400 })
  }

  const formation: any = (reservation as any).sessions?.formations
  const sessionRow: any = (reservation as any).sessions
  const dateDebut = new Date(sessionRow?.date_debut ?? Date.now()).toLocaleDateString('fr-FR')
  const dateFin = new Date(sessionRow?.date_fin ?? Date.now()).toLocaleDateString('fr-FR')
  const dateSession = dateDebut === dateFin ? `le ${dateDebut}` : `du ${dateDebut} au ${dateFin}`
  const formationTitre = formation?.titre ?? 'Formation'
  const prixTotal = formation?.prix ?? 0
  const acompte = reservation.acompte_amount ?? 0
  const solde = Math.max(0, prixTotal - acompte)
  const nomComplet = (`${reservation.prenom ?? ''} ${reservation.nom ?? ''}`.trim() || reservation.nom_client) ?? 'client'

  // ── STRIPE ONLINE MODE ──────────────────────────────────────────────────
  if (useStripe) {
    if (solde <= 0) {
      return NextResponse.json({ error: 'Aucun solde à encaisser.' }, { status: 400 })
    }
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-04-22.dahlia' })
    const siteOrigin = new URL(req.url).origin

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Solde formation — ${formationTitre}`,
            description: `Session ${dateSession} — Règlement du solde final`,
          },
          unit_amount: Math.round(solde * 100),
        },
        quantity: 1,
      }],
      metadata: {
        reservation_id: reservationId,
        is_final_payment: 'true',
        formation_titre: formationTitre,
      },
      customer_email: reservation.email_client ?? undefined,
      success_url: `${siteOrigin}/admin/facturation?stripe_success=1`,
      cancel_url: `${siteOrigin}/admin/facturation`,
    })

    await supabaseAdmin
      .from('reservations')
      .update({ stripe_solde_session_id: checkoutSession.id })
      .eq('id', reservationId)

    return NextResponse.json({ stripeUrl: checkoutSession.url })
  }

  // ── MANUAL PAYMENT MODE ─────────────────────────────────────────────────
  if (!methods || methods.length === 0) {
    return NextResponse.json({ error: 'Modes de paiement requis' }, { status: 400 })
  }

  const totalPaid = methods.reduce((sum, m) => sum + m.amount, 0)
  if (Math.abs(totalPaid - solde) > 0.5) {
    return NextResponse.json({
      error: `Total des paiements (${totalPaid} €) ne correspond pas au solde (${solde} €)`,
    }, { status: 400 })
  }

  const soldePaymentMethod = methods.map(m => m.label).join(' + ')
  const soldePaidAt = new Date().toISOString()

  // Generate final invoice PDF
  let facturePdfBuffer: Buffer | null = null
  let facturePath: string | null = null

  try {
    const { generateFactureFinaleHTML } = await import('@/lib/contract/facture-finale')
    const { generatePDFFromHtml } = await import('@/lib/contract/pdf')

    const factureHtml = generateFactureFinaleHTML({
      prenom: reservation.prenom ?? '',
      nom: reservation.nom ?? '',
      email: reservation.email_client ?? '',
      telephone: reservation.telephone ?? reservation.telephone_client ?? '',
      adresse: reservation.adresse ?? '',
      clientType: (reservation.client_type ?? 'particulier') as 'particulier' | 'pro',
      raisonSociale: reservation.raison_sociale ?? undefined,
      siret: reservation.siret ?? undefined,
      formationTitre,
      dateSession,
      prixTotal,
      acompte,
      acompteStripeId: reservation.stripe_payment_id ?? reservationId,
      acomptePaidAt: reservation.acompte_paid_at ?? soldePaidAt,
      solde,
      soldePaidAt,
      soldePaymentMethod,
    })

    facturePdfBuffer = await generatePDFFromHtml(factureHtml)

    // Upload to Storage (contracts bucket, alongside the signed contract)
    const { error: uploadError } = await supabaseAdmin.storage
      .from('contracts')
      .upload(`${reservationId}/facture-finale.pdf`, facturePdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (!uploadError) {
      facturePath = `${reservationId}/facture-finale.pdf`
    } else {
      console.error('[encaissement] Storage upload error:', uploadError)
    }
  } catch (e) {
    console.error('[encaissement] PDF generation error:', e)
    // Continue even if PDF fails — update DB and try to send email
  }

  // Update reservation
  await supabaseAdmin
    .from('reservations')
    .update({
      solde_paid_at: soldePaidAt,
      solde_payment_method: soldePaymentMethod,
      ...(facturePath ? { facture_finale_url: facturePath } : {}),
    })
    .eq('id', reservationId)

  // Send email with invoice PDF
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const attachments: Array<{ filename: string; content: string }> = []

    if (facturePdfBuffer) {
      attachments.push({
        filename: `Facture_solde_${nomComplet.replace(/\s+/g, '_')}.pdf`,
        content: facturePdfBuffer.toString('base64'),
      })
    }

    await resend.emails.send({
      from: 'Beauty Home Concept <contact@beautyhomeconcept.fr>',
      to: [reservation.email_client!],
      subject: `Paiement complet — ${formationTitre}`,
      react: FinalInvoiceEmail({
        nomClient: nomComplet,
        prenom: reservation.prenom ?? nomComplet.split(' ')[0],
        formationTitre,
        dateSession,
        prixTotal,
        acompte,
        solde,
        soldePaymentMethod,
      }),
      attachments,
    })
  } catch (e) {
    console.error('[encaissement] Email send error:', e)
    // Don't fail the whole request if email fails
  }

  revalidatePath('/admin/facturation')
  revalidatePath('/admin')

  return NextResponse.json({ done: true })
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no type errors.

- [ ] **Step 4: Commit**

```bash
git add "src/app/api/admin/reservations/[id]/encaissement/route.ts"
git commit -m "feat: add /api/admin/reservations/[id]/encaissement POST route"
```

---

### Task 8: Facturation Page — Server Component

**Files:**
- Create: `src/app/admin/(protected)/facturation/page.tsx`

Server Component that fetches all confirmed reservations and generates signed URLs for final invoices already stored in Supabase Storage.

- [ ] **Step 1: Create `src/app/admin/(protected)/facturation/page.tsx`**

```typescript
import { createAdminClient } from '@/lib/supabase/server'
import FacturationTable from './FacturationTable'

export const dynamic = 'force-dynamic'

export default async function FacturationPage() {
  const supabase = await createAdminClient()

  const { data: rawReservations } = await supabase
    .from('reservations')
    .select(`
      id, prenom, nom, nom_client, email_client,
      telephone, telephone_client, adresse, client_type, raison_sociale, siret,
      acompte_amount, acompte_paid_at, stripe_payment_id,
      solde_paid_at, solde_payment_method, facture_finale_url,
      created_at,
      sessions (
        date_debut, date_fin,
        formations ( titre, prix )
      )
    `)
    .eq('statut', 'confirmee')
    .order('created_at', { ascending: false })

  const all = rawReservations ?? []

  // Generate signed URLs for final invoices already stored
  const reservations = await Promise.all(
    all.map(async (r) => {
      if (r.facture_finale_url) {
        const { data } = await supabase.storage
          .from('contracts')
          .createSignedUrl(r.facture_finale_url, 3600)
        return { ...r, facture_finale_signed_url: data?.signedUrl ?? null }
      }
      return { ...r, facture_finale_signed_url: null }
    })
  )

  const total = reservations.length
  const regles = reservations.filter(r => r.solde_paid_at).length
  const enAttente = reservations.filter(r => !r.solde_paid_at).length
  const soldesEnAttenteMontant = reservations
    .filter(r => !r.solde_paid_at)
    .reduce((sum, r) => {
      const prix = (r as any).sessions?.formations?.prix ?? 0
      const acompte = r.acompte_amount ?? 0
      return sum + Math.max(0, prix - acompte)
    }, 0)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-playfair text-3xl text-on-surface mb-2">Facturation</h2>
        <p className="text-on-surface-variant text-sm">
          Encaissez les soldes finaux et générez les factures pour vos élèves.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-surface border border-surface-container-highest p-5">
          <p className="text-xs font-label-caps tracking-widest text-on-surface-variant uppercase mb-2">Soldes en attente</p>
          <p className="text-3xl font-playfair text-amber-700">{enAttente}</p>
          {soldesEnAttenteMontant > 0 && (
            <p className="text-xs text-on-surface-variant mt-1">
              {soldesEnAttenteMontant.toLocaleString('fr-FR')} € à encaisser
            </p>
          )}
        </div>
        <div className="bg-surface border border-surface-container-highest p-5">
          <p className="text-xs font-label-caps tracking-widest text-on-surface-variant uppercase mb-2">Tout réglé</p>
          <p className="text-3xl font-playfair text-green-700">{regles}</p>
        </div>
        <div className="bg-surface border border-surface-container-highest p-5">
          <p className="text-xs font-label-caps tracking-widest text-on-surface-variant uppercase mb-2">Total confirmées</p>
          <p className="text-3xl font-playfair text-on-surface">{total}</p>
        </div>
      </div>

      <FacturationTable reservations={reservations as any[]} />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/admin/(protected)/facturation/page.tsx"
git commit -m "feat(admin): add /admin/facturation server page with billing stats"
```

---

### Task 9: FacturationTable Client Component

**Files:**
- Create: `src/app/admin/(protected)/facturation/FacturationTable.tsx`

Client Component. Renders the filterable table and manages the modal state. When "Encaisser" is clicked, passes the reservation to `EncaissementModal`.

- [ ] **Step 1: Create `src/app/admin/(protected)/facturation/FacturationTable.tsx`**

```tsx
'use client'

import { useState } from 'react'
import EncaissementModal from './EncaissementModal'

export interface FacturationReservation {
  id: string
  prenom: string | null
  nom: string | null
  nom_client: string | null
  email_client: string | null
  telephone: string | null
  telephone_client: string | null
  adresse: string | null
  client_type: string | null
  raison_sociale: string | null
  siret: string | null
  acompte_amount: number | null
  acompte_paid_at: string | null
  stripe_payment_id: string | null
  solde_paid_at: string | null
  solde_payment_method: string | null
  facture_finale_url: string | null
  facture_finale_signed_url: string | null
  created_at: string
  sessions: {
    date_debut: string
    date_fin: string
    formations: {
      titre: string
      prix: number
    } | null
  } | null
}

const FILTERS = [
  { value: 'all', label: 'Tous' },
  { value: 'pending', label: 'Solde en attente' },
  { value: 'paid', label: 'Tout réglé' },
]

export default function FacturationTable({ reservations }: { reservations: FacturationReservation[] }) {
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState<FacturationReservation | null>(null)

  const filtered = reservations.filter(r => {
    if (filter === 'pending') return !r.solde_paid_at
    if (filter === 'paid') return !!r.solde_paid_at
    return true
  })

  const handleSuccess = () => {
    setSelected(null)
    window.location.reload()
  }

  return (
    <>
      {/* Filter tabs */}
      <div className="flex gap-1 border border-surface-container-highest bg-surface p-1 w-fit">
        {FILTERS.map(f => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 text-xs font-label-caps tracking-wider transition-colors ${
              filter === f.value
                ? 'bg-primary text-on-primary'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-on-surface-variant italic text-sm py-8 text-center">Aucune réservation trouvée.</p>
      ) : (
        <div className="overflow-x-auto border border-surface-container-highest">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-container-lowest border-b border-surface-container-highest">
              <tr className="text-xs font-label-caps tracking-wider text-on-surface-variant uppercase">
                <th className="px-4 py-3 font-normal">Élève</th>
                <th className="px-4 py-3 font-normal">Formation</th>
                <th className="px-4 py-3 font-normal">Session</th>
                <th className="px-4 py-3 font-normal">Acompte</th>
                <th className="px-4 py-3 font-normal">Solde</th>
                <th className="px-4 py-3 font-normal">Statut</th>
                <th className="px-4 py-3 font-normal">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low bg-surface">
              {filtered.map(r => {
                const nomComplet = (`${r.prenom ?? ''} ${r.nom ?? ''}`.trim() || r.nom_client) ?? '—'
                const formation = r.sessions?.formations
                const prix = formation?.prix ?? 0
                const acompte = r.acompte_amount ?? 0
                const solde = Math.max(0, prix - acompte)
                const dateDebut = r.sessions?.date_debut
                  ? new Date(r.sessions.date_debut).toLocaleDateString('fr-FR') : '—'
                const dateFin = r.sessions?.date_fin
                  ? new Date(r.sessions.date_fin).toLocaleDateString('fr-FR') : '—'
                const dateStr = dateDebut === dateFin ? dateDebut : `${dateDebut} → ${dateFin}`

                return (
                  <tr key={r.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-medium text-on-surface block">{nomComplet}</span>
                      <span className="text-xs text-on-surface-variant">{r.email_client}</span>
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">{formation?.titre ?? '—'}</td>
                    <td className="px-4 py-3 text-on-surface-variant whitespace-nowrap">{dateStr}</td>
                    <td className="px-4 py-3 text-on-surface-variant">
                      {acompte > 0 ? `${acompte.toLocaleString('fr-FR')} €` : '—'}
                    </td>
                    <td className="px-4 py-3 font-medium text-on-surface">
                      {solde > 0 ? `${solde.toLocaleString('fr-FR')} €` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {r.solde_paid_at ? (
                        <div>
                          <span className="text-xs px-2 py-0.5 font-label-caps tracking-wider text-green-700 bg-green-50 block w-fit">
                            Réglé ✓
                          </span>
                          {r.solde_payment_method && (
                            <span className="text-xs text-on-surface-variant mt-0.5 block">
                              {r.solde_payment_method}
                            </span>
                          )}
                          {r.solde_paid_at && (
                            <span className="text-xs text-on-surface-variant block">
                              le {new Date(r.solde_paid_at).toLocaleDateString('fr-FR')}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs px-2 py-0.5 font-label-caps tracking-wider text-amber-700 bg-amber-50">
                          En attente
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {!r.solde_paid_at && (
                          <button
                            type="button"
                            onClick={() => setSelected(r)}
                            className="text-xs px-3 py-1.5 border border-primary text-primary font-label-caps tracking-wider hover:bg-primary hover:text-on-primary transition-colors whitespace-nowrap"
                          >
                            Encaisser
                          </button>
                        )}
                        {r.facture_finale_signed_url && (
                          <a
                            href={r.facture_finale_signed_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-on-surface-variant hover:text-primary transition-colors whitespace-nowrap"
                            title="Télécharger la facture finale"
                          >
                            Facture ↓
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <EncaissementModal
        reservation={selected}
        onClose={() => setSelected(null)}
        onSuccess={handleSuccess}
      />
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/admin/(protected)/facturation/FacturationTable.tsx"
git commit -m "feat(admin): add FacturationTable client component with filter tabs"
```

---

### Task 10: EncaissementModal Client Component

**Files:**
- Create: `src/app/admin/(protected)/facturation/EncaissementModal.tsx`

Client Component. Slide-in panel with: reservation summary, payment method checkboxes with amount inputs, total validation, submit button. Separate "Envoyer lien Stripe" button if CB online is selected.

- [ ] **Step 1: Create `src/app/admin/(protected)/facturation/EncaissementModal.tsx`**

```tsx
'use client'

import { useState, useEffect } from 'react'
import type { FacturationReservation } from './FacturationTable'

const PAYMENT_METHODS = [
  'Espèces',
  'Virement bancaire',
  'Chèque',
  'CB manuelle (SumUp / terminal)',
  'Wero / PayPal',
]

interface Props {
  reservation: FacturationReservation | null
  onClose: () => void
  onSuccess: () => void
}

type MethodState = Record<string, { selected: boolean; amount: string }>

export default function EncaissementModal({ reservation, onClose, onSuccess }: Props) {
  const [methods, setMethods] = useState<MethodState>({})
  const [stripeMode, setStripeMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [stripeUrl, setStripeUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Reset state when reservation changes
  useEffect(() => {
    setMethods({})
    setStripeMode(false)
    setLoading(false)
    setStripeUrl(null)
    setError(null)
    setSuccess(false)
  }, [reservation?.id])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  if (!reservation) return null

  const formation = reservation.sessions?.formations
  const prix = formation?.prix ?? 0
  const acompte = reservation.acompte_amount ?? 0
  const solde = Math.max(0, prix - acompte)
  const nomComplet = (`${reservation.prenom ?? ''} ${reservation.nom ?? ''}`.trim() || reservation.nom_client) ?? '—'
  const formationTitre = formation?.titre ?? 'Formation'

  // Calculate total entered by user
  const totalEntered = Object.values(methods)
    .filter(m => m.selected)
    .reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0)

  const totalValid = Math.abs(totalEntered - solde) <= 0.01

  function toggleMethod(label: string) {
    setMethods(prev => {
      const current = prev[label]
      if (current?.selected) {
        return { ...prev, [label]: { selected: false, amount: '' } }
      }
      // Pre-fill amount: remaining balance not yet assigned to other methods
      const alreadyAssigned = Object.entries(prev)
        .filter(([k, v]) => k !== label && v.selected)
        .reduce((sum, [, v]) => sum + (parseFloat(v.amount) || 0), 0)
      const remaining = Math.max(0, solde - alreadyAssigned)
      return { ...prev, [label]: { selected: true, amount: remaining.toString() } }
    })
    setStripeMode(false)
  }

  function setAmount(label: string, value: string) {
    setMethods(prev => ({ ...prev, [label]: { ...prev[label], amount: value } }))
  }

  async function handleManualSubmit() {
    setError(null)
    if (!totalValid) {
      setError(`Le total (${totalEntered.toLocaleString('fr-FR')} €) doit correspondre au solde (${solde.toLocaleString('fr-FR')} €).`)
      return
    }

    const selectedMethods = Object.entries(methods)
      .filter(([, v]) => v.selected)
      .map(([label, v]) => ({ label, amount: parseFloat(v.amount) }))

    if (selectedMethods.length === 0) {
      setError('Sélectionnez au moins un mode de paiement.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/reservations/${reservation.id}/encaissement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ methods: selectedMethods }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erreur serveur')
      setSuccess(true)
      setTimeout(onSuccess, 1500)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleStripeSubmit() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/reservations/${reservation.id}/encaissement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useStripe: true }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erreur serveur')
      setStripeUrl(json.stripeUrl)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/30 z-40"
      />

      {/* Panel */}
      <aside className="fixed top-0 right-0 h-full w-full max-w-lg bg-surface shadow-2xl z-50 flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-surface-container-highest bg-surface-container-lowest shrink-0">
          <div>
            <p className="text-xs font-label-caps tracking-widest text-on-surface-variant uppercase mb-1">Encaissement du solde</p>
            <h3 className="font-playfair text-xl text-on-surface">{nomComplet}</h3>
            <p className="text-sm text-on-surface-variant mt-1">{formationTitre}</p>
          </div>
          <button type="button" onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors p-1 mt-0.5">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 space-y-6">
          {/* Success state */}
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 text-green-700 text-sm font-medium">
              ✓ Solde encaissé — facture envoyée à {reservation.email_client}
            </div>
          )}

          {/* Stripe URL shown */}
          {stripeUrl && (
            <div className="p-4 bg-blue-50 border border-blue-200 space-y-3">
              <p className="text-xs font-label-caps tracking-wider text-blue-800 uppercase">Lien de paiement Stripe</p>
              <p className="text-xs text-blue-700 break-all">{stripeUrl}</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(stripeUrl)}
                  className="text-xs px-3 py-1.5 border border-blue-400 text-blue-700 font-label-caps tracking-wider hover:bg-blue-100 transition-colors"
                >
                  Copier le lien
                </button>
                <a
                  href={stripeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-3 py-1.5 bg-blue-600 text-white font-label-caps tracking-wider hover:bg-blue-700 transition-colors"
                >
                  Ouvrir Stripe
                </a>
              </div>
              <p className="text-xs text-blue-600">La facture sera générée automatiquement une fois le paiement reçu.</p>
            </div>
          )}

          {/* Solde recap */}
          <div className="p-4 bg-surface-container-lowest border border-surface-container-highest">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-label-caps tracking-wider text-on-surface-variant uppercase">Prix total formation</span>
              <span className="text-sm text-on-surface">{prix.toLocaleString('fr-FR')} €</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-label-caps tracking-wider text-on-surface-variant uppercase">Acompte versé</span>
              <span className="text-sm text-green-700">−{acompte.toLocaleString('fr-FR')} €</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-surface-container-highest">
              <span className="text-xs font-label-caps tracking-wider text-primary uppercase font-medium">Solde à encaisser</span>
              <span className="text-lg font-playfair text-primary">{solde.toLocaleString('fr-FR')} €</span>
            </div>
          </div>

          {/* Payment methods */}
          {!stripeUrl && !success && (
            <>
              <div>
                <p className="text-xs font-label-caps tracking-widest text-on-surface-variant uppercase mb-4">Mode(s) de règlement</p>
                <div className="space-y-3">
                  {PAYMENT_METHODS.map(label => {
                    const m = methods[label]
                    return (
                      <div key={label}>
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={m?.selected ?? false}
                            onChange={() => toggleMethod(label)}
                            className="w-4 h-4 border-surface-container-highest text-primary focus:ring-primary/20"
                          />
                          <span className="text-sm text-on-surface group-hover:text-primary transition-colors">{label}</span>
                        </label>
                        {m?.selected && (
                          <div className="mt-2 ml-7 flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={m.amount}
                              onChange={e => setAmount(label, e.target.value)}
                              className="w-32 border border-surface-container-highest bg-surface px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:border-primary"
                              placeholder="Montant"
                            />
                            <span className="text-sm text-on-surface-variant">€</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Stripe option — separate */}
              <div className="border-t border-surface-container-highest pt-4">
                <p className="text-xs font-label-caps tracking-widest text-on-surface-variant uppercase mb-3">Ou — paiement en ligne</p>
                <button
                  type="button"
                  onClick={() => setStripeMode(s => !s)}
                  className={`flex items-center gap-3 w-full text-left group ${stripeMode ? 'opacity-100' : 'opacity-70 hover:opacity-100'}`}
                >
                  <input
                    type="checkbox"
                    checked={stripeMode}
                    readOnly
                    className="w-4 h-4 border-surface-container-highest text-primary"
                  />
                  <span className="text-sm text-on-surface">CB en ligne Stripe (envoyer un lien de paiement à l'élève)</span>
                </button>
                {stripeMode && (
                  <p className="text-xs text-on-surface-variant mt-2 ml-7">
                    Montant : <strong>{solde.toLocaleString('fr-FR')} €</strong>. Un lien Stripe sera généré — la facture sera envoyée automatiquement quand l'élève paie.
                  </p>
                )}
              </div>

              {/* Total indicator */}
              {!stripeMode && Object.values(methods).some(m => m.selected) && (
                <div className={`flex justify-between items-center text-sm p-3 ${totalValid ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                  <span>Total saisi</span>
                  <span className="font-medium">{totalEntered.toLocaleString('fr-FR')} € / {solde.toLocaleString('fr-FR')} €</span>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Submit */}
              <div className="flex flex-col gap-3 pt-2">
                {!stripeMode && (
                  <button
                    type="button"
                    onClick={handleManualSubmit}
                    disabled={loading}
                    className="w-full bg-primary text-on-primary px-6 py-3 font-label-caps tracking-widest text-xs hover:bg-primary-container hover:text-on-primary-container transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Génération de la facture…' : 'Valider l'encaissement + envoyer la facture'}
                  </button>
                )}
                {stripeMode && (
                  <button
                    type="button"
                    onClick={handleStripeSubmit}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white px-6 py-3 font-label-caps tracking-widest text-xs hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Création du lien…' : 'Envoyer le lien de paiement Stripe'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full px-6 py-3 font-label-caps tracking-widest text-xs text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  Annuler
                </button>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Verify the facturation page loads**

Start the dev server and open `/admin/facturation`.
Expected: page renders with stats, table shows confirmed reservations, "Encaisser" button appears for reservations without `solde_paid_at`.

```bash
npm run dev
```

- [ ] **Step 4: Commit**

```bash
git add "src/app/admin/(protected)/facturation/"
git commit -m "feat(admin): add /admin/facturation page with encaissement modal"
```

---

### Task 11: Webhook Update — Handle Final Stripe Payment

**Files:**
- Modify: `src/app/api/webhook/stripe/route.ts`

When the student pays via Stripe online (from the link generated in encaissement), the webhook receives `checkout.session.completed` with `metadata.is_final_payment = 'true'`. This task adds a branch to detect this and run the final invoice flow instead of the acompte flow.

- [ ] **Step 1: Read the current webhook handler**

Open `src/app/api/webhook/stripe/route.ts` and locate the section after `event.type !== 'checkout.session.completed'` check (around line 25-35).

- [ ] **Step 2: Add is_final_payment detection after the session check**

Find this block (approximately lines 27-33):
```typescript
  const session = event.data.object as Stripe.Checkout.Session
  const reservationId = session.metadata?.reservation_id
  const supabaseSessionId = session.metadata?.supabase_session_id
  if (!reservationId) {
    console.error('reservation_id manquant dans metadata')
    return NextResponse.json({ received: true })
  }

  const supabase = await createAdminClient()
```

Insert immediately after the `const supabase = await createAdminClient()` line:

```typescript
  // ── FINAL PAYMENT BRANCH ─────────────────────────────────────────────────
  if (session.metadata?.is_final_payment === 'true') {
    // This checkout was for the final balance (solde), not the initial deposit
    const { data: reservation } = await supabase
      .from('reservations')
      .select(`
        id, prenom, nom, nom_client, email_client,
        telephone, telephone_client, adresse, client_type, raison_sociale, siret,
        acompte_amount, acompte_paid_at, stripe_payment_id, solde_paid_at,
        sessions ( date_debut, date_fin, formations ( titre, prix ) )
      `)
      .eq('id', reservationId)
      .single()

    if (!reservation || reservation.solde_paid_at) {
      // Already processed or not found
      return NextResponse.json({ received: true })
    }

    const formation: any = (reservation as any).sessions?.formations
    const sessionRow: any = (reservation as any).sessions
    const dateDebut = new Date(sessionRow?.date_debut ?? Date.now()).toLocaleDateString('fr-FR')
    const dateFin   = new Date(sessionRow?.date_fin   ?? Date.now()).toLocaleDateString('fr-FR')
    const dateSession = dateDebut === dateFin ? `le ${dateDebut}` : `du ${dateDebut} au ${dateFin}`
    const formationTitre = formation?.titre ?? 'Formation'
    const prixTotal = formation?.prix ?? 0
    const acompte = reservation.acompte_amount ?? 0
    const solde = Math.round((session.amount_total ?? 0) / 100)
    const soldePaidAt = new Date().toISOString()
    const soldePaid = (session.payment_intent as string) || session.id
    const nomComplet = (`${reservation.prenom ?? ''} ${reservation.nom ?? ''}`.trim() || reservation.nom_client) ?? 'client'

    // Generate final invoice PDF
    let facturePdfBuffer: Buffer | null = null
    let facturePath: string | null = null
    try {
      const { generateFactureFinaleHTML } = await import('@/lib/contract/facture-finale')
      const { generatePDFFromHtml } = await import('@/lib/contract/pdf')
      const factureHtml = generateFactureFinaleHTML({
        prenom: reservation.prenom ?? '',
        nom: reservation.nom ?? '',
        email: reservation.email_client ?? '',
        telephone: reservation.telephone ?? reservation.telephone_client ?? '',
        adresse: reservation.adresse ?? '',
        clientType: (reservation.client_type ?? 'particulier') as 'particulier' | 'pro',
        raisonSociale: reservation.raison_sociale ?? undefined,
        siret: reservation.siret ?? undefined,
        formationTitre, dateSession, prixTotal, acompte,
        acompteStripeId: reservation.stripe_payment_id ?? reservationId,
        acomptePaidAt: reservation.acompte_paid_at ?? soldePaidAt,
        solde, soldePaidAt, soldePaymentMethod: 'CB en ligne (Stripe)',
      })
      facturePdfBuffer = await generatePDFFromHtml(factureHtml)
      const { error: upErr } = await supabase.storage
        .from('contracts')
        .upload(`${reservationId}/facture-finale.pdf`, facturePdfBuffer, {
          contentType: 'application/pdf', upsert: true,
        })
      if (!upErr) facturePath = `${reservationId}/facture-finale.pdf`
    } catch (e) { console.error('[webhook-final] PDF error:', e) }

    // Update reservation
    await supabase.from('reservations').update({
      solde_paid_at: soldePaidAt,
      solde_payment_method: 'CB en ligne (Stripe)',
      stripe_solde_session_id: session.id,
      ...(facturePath ? { facture_finale_url: facturePath } : {}),
    }).eq('id', reservationId)

    // Send email
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const FinalInvoiceEmail = (await import('@/emails/FinalInvoiceEmail')).default
      const attachments: Array<{ filename: string; content: string }> = []
      if (facturePdfBuffer) {
        attachments.push({
          filename: `Facture_solde_${nomComplet.replace(/\s+/g, '_')}.pdf`,
          content: facturePdfBuffer.toString('base64'),
        })
      }
      await resend.emails.send({
        from: 'Beauty Home Concept <contact@beautyhomeconcept.fr>',
        to: [reservation.email_client!],
        subject: `Paiement complet — ${formationTitre}`,
        react: FinalInvoiceEmail({
          nomClient: nomComplet,
          prenom: reservation.prenom ?? nomComplet.split(' ')[0],
          formationTitre, dateSession, prixTotal, acompte, solde,
          soldePaymentMethod: 'CB en ligne (Stripe)',
        }),
        attachments,
      })
    } catch (e) { console.error('[webhook-final] Email error:', e) }

    return NextResponse.json({ received: true })
  }
  // ── END FINAL PAYMENT BRANCH ─────────────────────────────────────────────
```

- [ ] **Step 3: Verify the existing acompte flow is unchanged**

After your edit, the file should have: (1) the is_final_payment branch that returns early, (2) the existing supabase_session_id check, idempotence check, etc. all still in place. Read through the file to confirm the logic is correct.

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/webhook/stripe/route.ts
git commit -m "feat(webhook): handle is_final_payment Stripe checkout for online solde payments"
```

---

### Task 12: ZIP Dossier Enhancement — Add Both Invoices

**Files:**
- Modify: `src/app/api/admin/reservations/[id]/dossier/route.ts`

Add two new documents to the ZIP:
1. **Facture d'acompte** — regenerated from `generateFactureHTML()` using data already in the reservation (stripe_payment_id, acompte_paid_at, acompte_amount, formation.prix).
2. **Facture finale** — fetched from Supabase Storage at `reservation.facture_finale_url` (if it exists).

- [ ] **Step 1: Read the current dossier route**

Open `src/app/api/admin/reservations/[id]/dossier/route.ts`.
The ZIP currently contains: (1) Fiche d'inscription PDF, (2) Signed contract PDF, (3) Programme PDF.
We will add after item (3).

- [ ] **Step 2: Add the two invoice sections before the ZIP generation**

Find the comment `// Generate ZIP buffer` near the end of the GET handler. Insert the following code blocks before it:

```typescript
  // 4. Facture d'acompte — regenerated from stored reservation data
  if (reservation.stripe_payment_id && reservation.acompte_paid_at) {
    try {
      const { generateFactureHTML } = await import('@/lib/contract/facture')
      const { generatePDFFromHtml } = await import('@/lib/contract/pdf')
      const acompte = reservation.acompte_amount ?? 0
      const prixTotal = formation?.prix ?? 0

      const factureAcompteHtml = generateFactureHTML({
        prenom:        reservation.prenom ?? '',
        nom:           reservation.nom ?? '',
        email:         reservation.email_client ?? '',
        telephone:     reservation.telephone ?? reservation.telephone_client ?? '',
        adresse:       reservation.adresse ?? '',
        clientType:    (reservation.client_type ?? 'particulier') as 'particulier' | 'pro',
        raisonSociale: reservation.raison_sociale ?? undefined,
        siret:         reservation.siret ?? undefined,
        formationTitre,
        dateSession,
        acompte,
        solde:         Math.max(0, prixTotal - acompte),
        stripeId:      reservation.stripe_payment_id,
        paidAt:        reservation.acompte_paid_at,
      })

      const factureAcomptePdf = await generatePDFFromHtml(factureAcompteHtml)
      zip.file(`Facture_acompte_${safeName}.pdf`, factureAcomptePdf)
    } catch (e) {
      console.error('Facture acompte ZIP error:', e)
    }
  }

  // 5. Facture finale — fetched from Storage if the solde has been paid
  const factureFinalePath = (reservation as any).facture_finale_url as string | null
  if (factureFinalePath) {
    try {
      const { data: signedFinale } = await supabaseAdmin.storage
        .from('contracts')
        .createSignedUrl(factureFinalePath, 3600)
      if (signedFinale?.signedUrl) {
        const r = await fetch(signedFinale.signedUrl)
        if (r.ok) {
          zip.file(`Facture_finale_${safeName}.pdf`, await r.arrayBuffer())
        }
      }
    } catch (e) {
      console.error('Facture finale ZIP error:', e)
    }
  }
```

- [ ] **Step 3: Add `facture_finale_url` to the reservation select query**

Find the `.select()` call in the dossier route (approximately line 24):
```typescript
  const { data: reservation, error } = await supabaseAdmin
    .from('reservations')
    .select(`
      *,
      sessions (
        date_debut, date_fin,
        formations ( titre, prix, programme_pdf_url )
      )
    `)
```

The `*` already selects all columns including `facture_finale_url`, `acompte_amount`, `acompte_paid_at`, `stripe_payment_id`. No change needed — `*` covers them.

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Test ZIP download**

In the admin dashboard, click the ZIP download link for a confirmed reservation that has `acompte_paid_at` and `stripe_payment_id`. 
Expected ZIP contains: `Fiche_Inscription_*.pdf`, `Contrat_*.pdf` (if signed), `Programme_*.pdf` (if exists), `Facture_acompte_*.pdf`, and `Facture_finale_*.pdf` (if `facture_finale_url` is set).

- [ ] **Step 6: Commit**

```bash
git add "src/app/api/admin/reservations/[id]/dossier/route.ts"
git commit -m "feat: add deposit + final invoices to dossier ZIP download"
```

---

### Final Verification

- [ ] **Step 1: Full TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 2: Build check**

```bash
npm run build
```

Expected: build completes without errors.

- [ ] **Step 3: Smoke test the admin**

1. Navigate to `/admin` — verify dashboard loads, no JS errors in console
2. Navigate to `/admin/sessions` — create a test session, verify it appears on the homepage formations section
3. Navigate to `/admin/sessions` — try to delete a session WITH reservations → should show error message
4. Navigate to `/admin/facturation` — verify page loads with stats and table
5. Click "Encaisser" on a confirmed reservation → modal opens, select "Espèces", enter amount, click validate → success message appears, row updates to "Réglé ✓"
6. Download ZIP dossier → open ZIP, verify `Facture_acompte_*.pdf` is present

- [ ] **Step 4: Final commit and push**

```bash
git push
```
