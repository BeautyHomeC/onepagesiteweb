# Réservation + Contrat + Signature électronique — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer le modal de consentement 3-cases par un flow 4 étapes (infos → contrat personnalisé → e-signature → Stripe), avec templates par formation dans l'admin et dossier complet envoyé par email.

**Architecture:** Le contrat est généré et signé AVANT le paiement Stripe. `/api/contract/sign` crée la reservation (`en_attente_paiement`) et upload le PDF. Le webhook Stripe met à jour la reservation vers `confirmee` et envoie les emails. L'admin dispose d'un éditeur Tiptap par formation et d'une page réservations filtrée.

**Tech Stack:** Next.js 16 App Router, Supabase, Stripe, Resend, `@react-pdf/renderer`, `@tiptap/react`, `jszip`, `crypto` (Node built-in)

---

## Fichiers créés / modifiés

| Fichier | Action |
|---|---|
| `src/lib/contract/template.ts` | Créer — renderTemplate(), RGPD_CLAUSE |
| `src/lib/contract/pdf.ts` | Créer — generateContractPDF(), generateFichePDF() |
| `src/app/api/contract/preview/route.ts` | Créer |
| `src/app/api/contract/sign/route.ts` | Créer |
| `src/app/api/admin/reservations/[id]/dossier/route.ts` | Créer |
| `src/components/booking/SignatureCanvas.tsx` | Créer |
| `src/components/booking/Step1Form.tsx` | Créer |
| `src/components/booking/Step2Contract.tsx` | Créer |
| `src/components/booking/Step3Signature.tsx` | Créer |
| `src/app/formations/[id]/SessionBooking.tsx` | Modifier — refactor complet stepper |
| `src/app/api/checkout/route.ts` | Modifier — retire custom_fields, ajoute reservation_id |
| `src/app/api/webhook/stripe/route.ts` | Modifier — update au lieu d'insert, nouveaux emails |
| `src/emails/ConfirmationEmail.tsx` | Modifier — récap client + mention solde |
| `src/emails/AdminNotificationEmail.tsx` | Modifier — infos complètes + lien admin |
| `src/app/admin/(protected)/reservations/page.tsx` | Créer |
| `src/app/admin/(protected)/reservations/ReservationsTable.tsx` | Créer |
| `src/app/admin/(protected)/reservations/ReservationSlideIn.tsx` | Créer |
| `src/app/admin/(protected)/formations/[id]/contrats/page.tsx` | Créer |
| `src/app/admin/(protected)/formations/[id]/contrats/ContractEditor.tsx` | Créer |
| `src/app/admin/(protected)/parametres/page.tsx` | Créer |
| `src/app/admin/actions.ts` | Modifier — ajouter saveContractTemplate(), saveParametre() |

---

## Task 1 — Migrations Supabase

**Files:**
- SQL à exécuter dans le dashboard Supabase

- [ ] **Step 1 : Créer la table `contract_templates`**

```sql
create table contract_templates (
  id           uuid primary key default gen_random_uuid(),
  formation_id uuid references formations(id) on delete cascade,
  type         text not null check (type in ('particulier', 'pro')),
  titre        text,
  contenu      text not null default '',
  version      int default 1,
  updated_at   timestamptz default now(),
  unique(formation_id, type)
);
```

- [ ] **Step 2 : Créer la table `parametres_admin`**

```sql
create table parametres_admin (
  cle    text primary key,
  valeur text not null
);

insert into parametres_admin (cle, valeur)
values
  ('livret_accueil_url', ''),
  ('reglement_interieur_url', '');
```

- [ ] **Step 3 : Modifier la table `reservations`**

```sql
-- Supprimer l'ancienne contrainte check sur statut
alter table reservations drop constraint if exists reservations_statut_check;

-- Ajouter les nouvelles colonnes
alter table reservations
  add column if not exists prenom            text,
  add column if not exists nom               text,
  add column if not exists telephone         text,
  add column if not exists adresse           text,
  add column if not exists client_type       text check (client_type in ('particulier', 'pro')),
  add column if not exists raison_sociale    text,
  add column if not exists siret             text,
  add column if not exists instagram         text,
  add column if not exists contrat_signe_url text,
  add column if not exists contrat_version   int,
  add column if not exists signature_data    jsonb,
  add column if not exists rgpd_consent_at   timestamptz,
  add column if not exists statut            text check (statut in (
    'en_attente_signature','en_attente_paiement','confirmee','presente','annulee'
  )),
  add column if not exists acompte_amount    numeric,
  add column if not exists acompte_paid_at   timestamptz;
```

- [ ] **Step 4 : Créer le bucket Supabase Storage `contracts`**

Dans le dashboard Supabase → Storage → New bucket :
- Name: `contracts`
- Public: **NON** (privé)

Puis appliquer cette RLS policy :
```sql
-- Seul le service role peut lire/écrire (webhook + admin)
create policy "service_role_only" on storage.objects
  for all using (bucket_id = 'contracts' and auth.role() = 'service_role');
```

- [ ] **Step 5 : Commit**

```bash
git add -A
git commit -m "feat: migrations DB contract_templates, parametres_admin, reservations v2"
```

---

## Task 2 — Utilitaires contrat

**Files:**
- Create: `src/lib/contract/template.ts`
- Create: `src/lib/contract/pdf.ts`

- [ ] **Step 1 : Créer `src/lib/contract/template.ts`**

```typescript
export const RGPD_CLAUSE = `Conformément au Règlement (UE) 2016/679 (RGPD), les données collectées sont utilisées exclusivement pour la gestion de votre formation. Durée de conservation : 5 ans. Droit d'accès, rectification et effacement : contact@beautyhomeconcept.fr — sous réserve des obligations légales de conservation.`

export interface TemplateVars {
  nom_prenom: string
  prenom: string
  adresse: string
  email: string
  telephone: string
  raison_sociale?: string
  siret?: string
  instagram?: string
  formation: string
  date_session: string
  duree: string
  prix_total: string
  acompte: string
  solde: string
  date_signature: string
  clause_rgpd: string
}

export function renderTemplate(contenu: string, vars: TemplateVars): string {
  let result = contenu
  const entries: [string, string][] = [
    ['nom_prenom',     vars.nom_prenom],
    ['prenom',         vars.prenom],
    ['adresse',        vars.adresse],
    ['email',          vars.email],
    ['telephone',      vars.telephone],
    ['raison_sociale', vars.raison_sociale ?? ''],
    ['siret',          vars.siret ?? ''],
    ['instagram',      vars.instagram ?? ''],
    ['formation',      vars.formation],
    ['date_session',   vars.date_session],
    ['duree',          vars.duree],
    ['prix_total',     vars.prix_total],
    ['acompte',        vars.acompte],
    ['solde',          vars.solde],
    ['date_signature', vars.date_signature],
    ['clause_rgpd',    RGPD_CLAUSE],
  ]
  for (const [key, value] of entries) {
    result = result.replaceAll(`{{${key}}}`, value)
  }
  return result
}

export function buildTemplateVars(params: {
  prenom: string
  nom: string
  adresse: string
  email: string
  telephone: string
  raison_sociale?: string
  siret?: string
  instagram?: string
  formation_titre: string
  date_debut: string
  date_fin: string
  duree_formation: string
  prix: number
}): TemplateVars {
  const acompte = Math.round(params.prix * 0.3)
  const solde   = Math.round(params.prix * 0.7)
  const dateSession = params.date_debut === params.date_fin
    ? `le ${params.date_debut}`
    : `du ${params.date_debut} au ${params.date_fin}`

  return {
    nom_prenom:     `${params.prenom} ${params.nom}`,
    prenom:         params.prenom,
    adresse:        params.adresse,
    email:          params.email,
    telephone:      params.telephone,
    raison_sociale: params.raison_sociale,
    siret:          params.siret,
    instagram:      params.instagram,
    formation:      params.formation_titre,
    date_session:   dateSession,
    duree:          params.duree_formation,
    prix_total:     `${params.prix} €`,
    acompte:        `${acompte} €`,
    solde:          `${solde} €`,
    date_signature: new Date().toLocaleDateString('fr-FR'),
    clause_rgpd:    RGPD_CLAUSE,
  }
}
```

- [ ] **Step 2 : Installer `@react-pdf/renderer` et `jszip`**

```bash
npm install @react-pdf/renderer jszip
npm install --save-dev @types/jszip
```

- [ ] **Step 3 : Créer `src/lib/contract/pdf.ts`**

```typescript
import { Document, Page, Text, View, StyleSheet, pdf, Font } from '@react-pdf/renderer'
import { createHash } from 'crypto'
import React from 'react'

const styles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', fontSize: 10, padding: 50, color: '#1b1c1c', lineHeight: 1.6 },
  title: { fontSize: 14, fontFamily: 'Helvetica-Bold', marginBottom: 20, textAlign: 'center', color: '#755a2d' },
  body: { fontSize: 10, lineHeight: 1.7, marginBottom: 8 },
  auditBox: { marginTop: 30, padding: 16, border: '1px solid #755a2d', backgroundColor: '#fdf9f4' },
  auditTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#755a2d', marginBottom: 10 },
  auditRow: { fontSize: 9, color: '#4e463a', marginBottom: 4 },
  auditLabel: { fontFamily: 'Helvetica-Bold' },
  sigImage: { marginTop: 10, maxHeight: 60 },
})

export interface SignatureData {
  type: 'text' | 'draw'
  valeur: string
  timestamp: string
  ip: string
  userAgent: string
}

export interface ContractPDFParams {
  contenuHtml: string
  formationTitre: string
  signature: SignatureData
}

export interface FichePDFParams {
  prenom: string
  nom: string
  email: string
  telephone: string
  adresse: string
  client_type: 'particulier' | 'pro'
  raison_sociale?: string
  siret?: string
  instagram?: string
  formation_titre: string
  date_session: string
  acompte: number
  created_at: string
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .trim()
}

export async function generateContractPDF(params: ContractPDFParams): Promise<Buffer> {
  const plainText = stripHtml(params.contenuHtml)
  const hash = createHash('sha256').update(plainText).digest('hex').slice(0, 16)

  const doc = React.createElement(Document, {},
    React.createElement(Page, { size: 'A4', style: styles.page },
      React.createElement(View, {},
        React.createElement(Text, { style: styles.title }, params.formationTitre),
        ...plainText.split('\n\n').filter(Boolean).map((para, i) =>
          React.createElement(Text, { key: i, style: styles.body }, para.trim())
        ),
        React.createElement(View, { style: styles.auditBox },
          React.createElement(Text, { style: styles.auditTitle }, 'CERTIFICAT DE SIGNATURE ÉLECTRONIQUE'),
          React.createElement(Text, { style: styles.auditRow },
            React.createElement(Text, { style: styles.auditLabel }, 'Signataire : '),
            params.signature.valeur
          ),
          React.createElement(Text, { style: styles.auditRow },
            React.createElement(Text, { style: styles.auditLabel }, 'Date : '),
            new Date(params.signature.timestamp).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })
          ),
          React.createElement(Text, { style: styles.auditRow },
            React.createElement(Text, { style: styles.auditLabel }, 'IP : '),
            params.signature.ip
          ),
          React.createElement(Text, { style: styles.auditRow },
            React.createElement(Text, { style: styles.auditLabel }, 'Mode : '),
            params.signature.type === 'text' ? 'Nom tapé' : 'Signature manuscrite numérique'
          ),
          React.createElement(Text, { style: styles.auditRow },
            React.createElement(Text, { style: styles.auditLabel }, 'Empreinte SHA-256 : '),
            hash
          ),
        )
      )
    )
  )

  const stream = await pdf(doc).toBuffer()
  return Buffer.from(stream)
}

export async function generateFichePDF(params: FichePDFParams): Promise<Buffer> {
  const rows: [string, string][] = [
    ['Prénom', params.prenom],
    ['Nom', params.nom],
    ['Email', params.email],
    ['Téléphone', params.telephone],
    ['Adresse', params.adresse],
    ['Type de client', params.client_type === 'pro' ? 'Professionnel' : 'Particulier'],
    ...(params.client_type === 'pro' ? [
      ['Raison sociale', params.raison_sociale ?? ''],
      ['SIRET', params.siret ?? ''],
      ['Instagram', params.instagram ?? ''],
    ] as [string, string][] : []),
    ['Formation', params.formation_titre],
    ['Session', params.date_session],
    ['Acompte réglé', `${params.acompte} €`],
    ['Date d\'inscription', new Date(params.created_at).toLocaleDateString('fr-FR')],
  ]

  const doc = React.createElement(Document, {},
    React.createElement(Page, { size: 'A4', style: styles.page },
      React.createElement(View, {},
        React.createElement(Text, { style: styles.title }, 'Fiche d\'inscription — Beauty Home Concept'),
        ...rows.map(([label, value], i) =>
          React.createElement(Text, { key: i, style: styles.body },
            React.createElement(Text, { style: styles.auditLabel }, `${label} : `),
            value
          )
        )
      )
    )
  )

  const stream = await pdf(doc).toBuffer()
  return Buffer.from(stream)
}
```

- [ ] **Step 4 : Commit**

```bash
git add src/lib/contract/
git commit -m "feat: utilitaires renderTemplate et generateContractPDF"
```

---

## Task 3 — API `/api/contract/preview`

**Files:**
- Create: `src/app/api/contract/preview/route.ts`

- [ ] **Step 1 : Créer la route**

```typescript
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { renderTemplate, buildTemplateVars } from '@/lib/contract/template'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      formation_id, session_id, client_type,
      prenom, nom, adresse, email, telephone,
      raison_sociale, siret, instagram,
    } = body

    if (!formation_id || !client_type || !prenom || !nom || !email) {
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Charger le template
    const { data: template, error } = await supabase
      .from('contract_templates')
      .select('contenu, version')
      .eq('formation_id', formation_id)
      .eq('type', client_type)
      .single()

    if (error || !template) {
      return NextResponse.json({
        error: 'Template de contrat manquant pour cette formation. Contactez l\'administrateur.',
      }, { status: 404 })
    }

    // Charger la session pour les dates
    const { data: sessionData } = await supabase
      .from('sessions')
      .select('date_debut, date_fin, formations(titre, prix, duree_formation)')
      .eq('id', session_id)
      .single()

    const formation = (sessionData as any)?.formations
    const dateDebut = new Date(sessionData?.date_debut ?? Date.now()).toLocaleDateString('fr-FR')
    const dateFin   = new Date(sessionData?.date_fin   ?? Date.now()).toLocaleDateString('fr-FR')

    const vars = buildTemplateVars({
      prenom, nom, adresse, email, telephone,
      raison_sociale, siret, instagram,
      formation_titre: formation?.titre ?? '',
      date_debut: dateDebut,
      date_fin:   dateFin,
      duree_formation: formation?.duree_formation ?? '',
      prix: formation?.prix ?? 0,
    })

    const html = renderTemplate(template.contenu, vars)

    return NextResponse.json({ html, template_version: template.version })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
```

- [ ] **Step 2 : Commit**

```bash
git add src/app/api/contract/preview/
git commit -m "feat: route POST /api/contract/preview"
```

---

## Task 4 — API `/api/contract/sign`

**Files:**
- Create: `src/app/api/contract/sign/route.ts`

- [ ] **Step 1 : Créer la route**

```typescript
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { renderTemplate, buildTemplateVars } from '@/lib/contract/template'
import { generateContractPDF, type SignatureData } from '@/lib/contract/pdf'
import { randomUUID } from 'crypto'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      formation_id, session_id, client_type, template_version,
      prenom, nom, adresse, email, telephone,
      raison_sociale, siret, instagram,
      signature_data, rgpd_consent,
    }: {
      formation_id: string
      session_id: string
      client_type: 'particulier' | 'pro'
      template_version: number
      prenom: string; nom: string; adresse: string
      email: string; telephone: string
      raison_sociale?: string; siret?: string; instagram?: string
      signature_data: SignatureData
      rgpd_consent: boolean
    } = body

    if (!rgpd_consent) {
      return NextResponse.json({ error: 'Consentement RGPD requis' }, { status: 400 })
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || 'IP non disponible'

    const signatureWithIp: SignatureData = { ...signature_data, ip, userAgent: req.headers.get('user-agent') ?? '' }

    const supabase = await createAdminClient()

    // Vérifier que la version du template est toujours courante
    const { data: template } = await supabase
      .from('contract_templates')
      .select('contenu, version')
      .eq('formation_id', formation_id)
      .eq('type', client_type)
      .single()

    if (!template) {
      return NextResponse.json({ error: 'Template introuvable' }, { status: 404 })
    }
    if (template.version !== template_version) {
      return NextResponse.json({
        error: 'Le contrat a été mis à jour. Veuillez recharger la page.',
      }, { status: 409 })
    }

    // Charger la session
    const { data: sessionData } = await supabase
      .from('sessions')
      .select('date_debut, date_fin, formations(titre, prix, duree_formation)')
      .eq('id', session_id)
      .single()

    const formation = (sessionData as any)?.formations
    const dateDebut = new Date(sessionData?.date_debut ?? Date.now()).toLocaleDateString('fr-FR')
    const dateFin   = new Date(sessionData?.date_fin   ?? Date.now()).toLocaleDateString('fr-FR')

    const vars = buildTemplateVars({
      prenom, nom, adresse, email, telephone,
      raison_sociale, siret, instagram,
      formation_titre: formation?.titre ?? '',
      date_debut: dateDebut,
      date_fin:   dateFin,
      duree_formation: formation?.duree_formation ?? '',
      prix: formation?.prix ?? 0,
    })

    const contenuRendu = renderTemplate(template.contenu, vars)

    // Générer le PDF
    const pdfBuffer = await generateContractPDF({
      contenuHtml: contenuRendu,
      formationTitre: formation?.titre ?? '',
      signature: signatureWithIp,
    })

    // Upload dans Storage avec temp_uuid
    const tempUuid = randomUUID()
    const storagePath = `${tempUuid}/contrat-signe.pdf`

    const { error: uploadError } = await supabase.storage
      .from('contracts')
      .upload(storagePath, pdfBuffer, { contentType: 'application/pdf', upsert: false })

    if (uploadError) {
      return NextResponse.json({ error: 'Erreur upload contrat' }, { status: 500 })
    }

    // Insérer la réservation en attente de paiement
    const prix = formation?.prix ?? 0
    const { data: reservation, error: insertError } = await supabase
      .from('reservations')
      .insert({
        session_id,
        prenom, nom,
        email_client: email,
        nom_client: `${prenom} ${nom}`,
        telephone_client: telephone,
        telephone,
        adresse,
        client_type,
        raison_sociale:    raison_sociale ?? null,
        siret_client:      siret ?? null,
        siret:             siret ?? null,
        instagram_client:  instagram ?? null,
        instagram:         instagram ?? null,
        contrat_signe_url: storagePath,
        contrat_version:   template.version,
        signature_data:    signatureWithIp,
        statut:            'en_attente_paiement',
        rgpd_consent_at:   new Date().toISOString(),
      })
      .select('id')
      .single()

    if (insertError || !reservation) {
      return NextResponse.json({ error: 'Erreur création réservation' }, { status: 500 })
    }

    return NextResponse.json({
      reservation_id: reservation.id,
      temp_uuid: tempUuid,
      contrat_url: storagePath,
    })
  } catch (err: any) {
    console.error('contract/sign error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
```

- [ ] **Step 2 : Commit**

```bash
git add src/app/api/contract/sign/
git commit -m "feat: route POST /api/contract/sign — génération PDF + insert reservation"
```

---

## Task 5 — Composant `SignatureCanvas`

**Files:**
- Create: `src/components/booking/SignatureCanvas.tsx`

- [ ] **Step 1 : Créer le composant**

```typescript
'use client'
import { useRef, useEffect, useCallback } from 'react'

interface Props {
  onChange: (dataUrl: string | null) => void
}

export default function SignatureCanvas({ onChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)

  const getPos = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    const source = 'touches' in e ? e.touches[0] : e
    return { x: source.clientX - rect.left, y: source.clientY - rect.top }
  }

  const startDraw = useCallback((e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current; if (!canvas) return
    e.preventDefault()
    drawing.current = true
    const ctx = canvas.getContext('2d')!
    const { x, y } = getPos(e, canvas)
    ctx.beginPath(); ctx.moveTo(x, y)
  }, [])

  const draw = useCallback((e: MouseEvent | TouchEvent) => {
    if (!drawing.current) return
    const canvas = canvasRef.current; if (!canvas) return
    e.preventDefault()
    const ctx = canvas.getContext('2d')!
    const { x, y } = getPos(e, canvas)
    ctx.lineTo(x, y); ctx.stroke()
  }, [])

  const endDraw = useCallback(() => {
    drawing.current = false
    const canvas = canvasRef.current; if (!canvas) return
    onChange(canvas.toDataURL('image/png'))
  }, [onChange])

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.strokeStyle = '#1b1c1c'; ctx.lineWidth = 2; ctx.lineCap = 'round'

    canvas.addEventListener('mousedown', startDraw)
    canvas.addEventListener('mousemove', draw)
    canvas.addEventListener('mouseup', endDraw)
    canvas.addEventListener('touchstart', startDraw, { passive: false })
    canvas.addEventListener('touchmove', draw, { passive: false })
    canvas.addEventListener('touchend', endDraw)
    return () => {
      canvas.removeEventListener('mousedown', startDraw)
      canvas.removeEventListener('mousemove', draw)
      canvas.removeEventListener('mouseup', endDraw)
      canvas.removeEventListener('touchstart', startDraw)
      canvas.removeEventListener('touchmove', draw)
      canvas.removeEventListener('touchend', endDraw)
    }
  }, [startDraw, draw, endDraw])

  const clear = () => {
    const canvas = canvasRef.current; if (!canvas) return
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height)
    onChange(null)
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={400}
        height={120}
        className="w-full border border-outline-variant bg-white touch-none"
        style={{ cursor: 'crosshair' }}
      />
      <button
        type="button"
        onClick={clear}
        className="mt-2 text-xs text-on-surface-variant hover:text-error underline font-label-caps uppercase tracking-widest"
      >
        Effacer
      </button>
    </div>
  )
}
```

- [ ] **Step 2 : Commit**

```bash
git add src/components/booking/SignatureCanvas.tsx
git commit -m "feat: composant SignatureCanvas (canvas doigt/souris)"
```

---

## Task 6 — Refactor `SessionBooking.tsx` (stepper 4 étapes)

**Files:**
- Create: `src/components/booking/Step1Form.tsx`
- Create: `src/components/booking/Step2Contract.tsx`
- Create: `src/components/booking/Step3Signature.tsx`
- Modify: `src/app/formations/[id]/SessionBooking.tsx`

- [ ] **Step 1 : Créer `Step1Form.tsx`**

```typescript
'use client'
import { useState } from 'react'

export interface ClientFormData {
  prenom: string; nom: string; email: string
  telephone: string; adresse: string
  client_type: 'particulier' | 'pro'
  raison_sociale?: string; siret?: string; instagram?: string
  rgpd_consent: boolean
}

const EMPTY: ClientFormData = {
  prenom: '', nom: '', email: '', telephone: '', adresse: '',
  client_type: 'particulier', raison_sociale: '', siret: '', instagram: '',
  rgpd_consent: false,
}

interface Props {
  initial: ClientFormData
  onNext: (data: ClientFormData) => void
}

export default function Step1Form({ initial, onNext }: Props) {
  const [data, setData] = useState<ClientFormData>(initial.prenom ? initial : EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof ClientFormData, string>>>({})

  const set = (k: keyof ClientFormData, v: string | boolean) =>
    setData(prev => ({ ...prev, [k]: v }))

  const validate = (): boolean => {
    const e: typeof errors = {}
    if (!data.prenom.trim())    e.prenom    = 'Requis'
    if (!data.nom.trim())       e.nom       = 'Requis'
    if (!data.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Email invalide'
    if (!data.telephone.trim()) e.telephone = 'Requis'
    if (!data.adresse.trim())   e.adresse   = 'Requis'
    if (data.client_type === 'pro') {
      if (!data.raison_sociale?.trim()) e.raison_sociale = 'Requis'
      if (!data.siret?.match(/^\d{14}$/)) e.siret = '14 chiffres requis'
    }
    if (!data.rgpd_consent) e.rgpd_consent = 'Requis'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const field = (
    id: keyof ClientFormData, label: string, type = 'text', placeholder = '', required = true
  ) => (
    <div>
      <label htmlFor={id} className="block font-label-caps text-xs uppercase tracking-widest text-on-surface-variant mb-1">
        {label}{required && ' *'}
      </label>
      <input
        id={id} type={type} placeholder={placeholder}
        value={(data[id] as string) ?? ''}
        onChange={e => set(id, e.target.value)}
        className={`w-full border px-4 py-3 font-body-md text-sm bg-surface focus:outline-none focus:border-primary transition-colors ${errors[id] ? 'border-error' : 'border-outline-variant'}`}
      />
      {errors[id] && <p className="mt-1 text-xs text-error">{errors[id]}</p>}
    </div>
  )

  return (
    <form onSubmit={e => { e.preventDefault(); if (validate()) onNext(data) }} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        {field('prenom', 'Prénom')}
        {field('nom', 'Nom')}
      </div>
      {field('email', 'Email', 'email')}
      {field('telephone', 'Téléphone', 'tel')}
      {field('adresse', 'Adresse complète')}

      <div>
        <p className="font-label-caps text-xs uppercase tracking-widest text-on-surface-variant mb-2">Type de client *</p>
        <div className="flex gap-3">
          {(['particulier', 'pro'] as const).map(t => (
            <label key={t} className={`flex-1 border px-4 py-3 text-center cursor-pointer transition-colors ${data.client_type === t ? 'border-primary bg-primary/5 text-primary' : 'border-outline-variant text-on-surface'}`}>
              <input type="radio" name="client_type" value={t} checked={data.client_type === t}
                onChange={() => set('client_type', t)} className="sr-only" />
              {t === 'particulier' ? 'Particulier' : 'Professionnel'}
            </label>
          ))}
        </div>
      </div>

      {data.client_type === 'pro' && (
        <div className="space-y-4 p-4 bg-surface-container-lowest border border-outline-variant">
          {field('raison_sociale', 'Raison sociale')}
          {field('siret', 'N° SIRET', 'text', '12345678901234')}
          {field('instagram', 'Instagram', 'text', '@votre_compte', false)}
        </div>
      )}

      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" checked={data.rgpd_consent}
          onChange={e => set('rgpd_consent', e.target.checked)}
          className="mt-1 accent-primary flex-shrink-0" />
        <span className="text-sm text-on-surface">
          J'accepte que mes données personnelles soient utilisées dans le cadre de ma formation et conservées 5 ans conformément aux obligations des organismes de formation (Art. L.6353-8 du Code du travail).
        </span>
      </label>
      {errors.rgpd_consent && <p className="text-xs text-error">{errors.rgpd_consent}</p>}

      <button type="submit"
        className="w-full bg-primary text-on-primary py-4 font-label-caps text-xs uppercase tracking-widest hover:opacity-90 transition-opacity min-h-[44px]">
        Voir mon contrat →
      </button>
    </form>
  )
}
```

- [ ] **Step 2 : Créer `Step2Contract.tsx`**

```typescript
'use client'
import { useRef, useState, useEffect } from 'react'

interface Props {
  html: string
  onSign: () => void
  onBack: () => void
}

export default function Step2Contract({ html, onSign, onBack }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [hasScrolled, setHasScrolled] = useState(false)

  const handleScroll = () => {
    const el = scrollRef.current; if (!el) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) setHasScrolled(true)
  }

  // Auto-marquer comme lu si le contrat est court
  useEffect(() => {
    const el = scrollRef.current; if (!el) return
    if (el.scrollHeight <= el.clientHeight + 10) setHasScrolled(true)
  }, [html])

  return (
    <div className="space-y-5">
      <p className="font-body-md text-sm text-on-surface-variant">
        Lisez votre contrat en entier avant de signer. Le bouton de signature s'active après lecture complète.
      </p>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="border border-outline-variant bg-white max-h-[55vh] overflow-y-auto p-6 font-body-md text-sm text-on-surface leading-relaxed"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {!hasScrolled && (
        <p className="text-xs text-on-surface-variant italic text-center">
          ↓ Faites défiler jusqu'en bas pour activer la signature
        </p>
      )}

      <div className="flex gap-3">
        <button onClick={onBack}
          className="border border-outline-variant px-6 py-3 font-label-caps text-xs uppercase tracking-widest text-on-surface hover:bg-surface-container-low transition-colors min-h-[44px]">
          ← Retour
        </button>
        <button onClick={onSign} disabled={!hasScrolled}
          className="flex-1 bg-primary text-on-primary py-3 font-label-caps text-xs uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed min-h-[44px]">
          Signer →
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3 : Créer `Step3Signature.tsx`**

```typescript
'use client'
import { useState } from 'react'
import SignatureCanvas from './SignatureCanvas'

export interface SignatureData {
  type: 'text' | 'draw'
  valeur: string
  timestamp: string
  ip: string
  userAgent: string
}

interface Props {
  defaultName: string
  loading: boolean
  error: string | null
  onConfirm: (sig: SignatureData) => void
  onBack: () => void
}

export default function Step3Signature({ defaultName, loading, error, onConfirm, onBack }: Props) {
  const [tab, setTab] = useState<'text' | 'draw'>('text')
  const [textVal, setTextVal] = useState(defaultName)
  const [drawVal, setDrawVal] = useState<string | null>(null)

  const handleConfirm = () => {
    const valeur = tab === 'text' ? textVal.trim() : (drawVal ?? '')
    if (!valeur) return
    onConfirm({
      type: tab,
      valeur,
      timestamp: new Date().toISOString(),
      ip: '',
      userAgent: navigator.userAgent,
    })
  }

  const canSubmit = tab === 'text' ? textVal.trim().length > 0 : drawVal !== null

  return (
    <div className="space-y-5">
      <div className="flex border border-outline-variant">
        {(['text', 'draw'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-3 font-label-caps text-xs uppercase tracking-widest transition-colors ${tab === t ? 'bg-primary text-on-primary' : 'text-on-surface hover:bg-surface-container-low'}`}>
            {t === 'text' ? 'Taper mon nom' : 'Dessiner'}
          </button>
        ))}
      </div>

      {tab === 'text' ? (
        <div>
          <label className="block font-label-caps text-xs uppercase tracking-widest text-on-surface-variant mb-2">
            Votre nom complet
          </label>
          <input
            type="text" value={textVal}
            onChange={e => setTextVal(e.target.value)}
            className="w-full border border-outline-variant px-4 py-3 text-sm bg-surface focus:border-primary focus:outline-none"
          />
          {textVal.trim() && (
            <p className="mt-3 font-serif italic text-xl text-on-surface border-b border-outline-variant pb-2">
              {textVal}
            </p>
          )}
        </div>
      ) : (
        <SignatureCanvas onChange={setDrawVal} />
      )}

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="flex gap-3">
        <button onClick={onBack} disabled={loading}
          className="border border-outline-variant px-6 py-3 font-label-caps text-xs uppercase tracking-widest text-on-surface hover:bg-surface-container-low transition-colors min-h-[44px]">
          ← Retour
        </button>
        <button onClick={handleConfirm} disabled={!canSubmit || loading}
          className="flex-1 bg-primary text-on-primary py-3 font-label-caps text-xs uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed min-h-[44px]">
          {loading ? 'Traitement...' : 'Signer et payer l\'acompte →'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4 : Réécrire `SessionBooking.tsx`**

```typescript
'use client'
import { useState } from 'react'
import Step1Form, { type ClientFormData } from '@/components/booking/Step1Form'
import Step2Contract from '@/components/booking/Step2Contract'
import Step3Signature, { type SignatureData } from '@/components/booking/Step3Signature'

const STEPS = ['Informations', 'Contrat', 'Signature', 'Paiement']

export default function SessionBooking({ formation, sessions }: { formation: any; sessions: any[] }) {
  const [step, setStep]             = useState<1 | 2 | 3 | 4>(1)
  const [selectedSessionId, setSel] = useState<string | null>(null)
  const [formData, setFormData]     = useState<ClientFormData>({} as ClientFormData)
  const [contractHtml, setHtml]     = useState('')
  const [templateVersion, setTv]    = useState(0)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState<string | null>(null)

  const acompte = Math.round(formation.prix * 0.3)
  const solde   = formation.prix - acompte

  const openFlow = (sessionId: string) => {
    setSel(sessionId); setStep(1); setError(null)
    setFormData({} as ClientFormData); setHtml('')
  }

  const closeFlow = () => { setSel(null); setStep(1) }

  const onStep1Next = async (data: ClientFormData) => {
    setFormData(data); setLoading(true); setError(null)
    try {
      const res = await fetch('/api/contract/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formation_id: formation.id,
          session_id: selectedSessionId,
          client_type: data.client_type,
          prenom: data.prenom, nom: data.nom,
          adresse: data.adresse, email: data.email, telephone: data.telephone,
          raison_sociale: data.raison_sociale, siret: data.siret, instagram: data.instagram,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error); return }
      setHtml(json.html); setTv(json.template_version); setStep(2)
    } catch { setError('Erreur réseau — réessayez.') }
    finally { setLoading(false) }
  }

  const onStep3Confirm = async (sig: SignatureData) => {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/contract/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formation_id: formation.id, session_id: selectedSessionId,
          client_type: formData.client_type, template_version: templateVersion,
          prenom: formData.prenom, nom: formData.nom, adresse: formData.adresse,
          email: formData.email, telephone: formData.telephone,
          raison_sociale: formData.raison_sociale, siret: formData.siret, instagram: formData.instagram,
          signature_data: sig, rgpd_consent: formData.rgpd_consent,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error); return }

      setStep(4)
      // Redirect vers Stripe checkout
      const checkoutRes = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: selectedSessionId, reservation_id: json.reservation_id }),
      })
      const checkout = await checkoutRes.json()
      if (checkout.url) { window.location.href = checkout.url }
      else { setError(checkout.error || 'Erreur Stripe'); setStep(3) }
    } catch { setError('Erreur réseau — réessayez.'); setStep(3) }
    finally { setLoading(false) }
  }

  return (
    <>
      {/* Liste des sessions */}
      <div className="bg-surface p-8 shadow-ambient border border-surface-container-highest">
        <h3 className="font-headline-sm text-headline-sm text-on-surface mb-2">Prochaines Sessions</h3>
        <p className="font-body-md text-on-surface-variant mb-6">Sélectionnez une date pour réserver votre place.</p>
        <div className="space-y-4">
          {sessions.length > 0 ? sessions.map(s => (
            <div key={s.id}
              className="border border-outline-variant p-4 flex flex-col xl:flex-row justify-between items-center gap-4 hover:border-primary transition-colors">
              <div>
                <p className="font-body-md text-on-surface font-medium">
                  Du {new Date(s.date_debut).toLocaleDateString('fr-FR')} au {new Date(s.date_fin).toLocaleDateString('fr-FR')}
                </p>
                <p className="font-label-caps text-label-caps text-primary mt-1 uppercase">
                  {s.places_disponibles} place(s) restante(s)
                </p>
              </div>
              <button onClick={() => openFlow(s.id)}
                className="border border-primary text-primary font-label-caps text-label-caps px-6 py-3 uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-colors whitespace-nowrap min-h-[44px]">
                Réserver — Acompte {acompte}€
              </button>
            </div>
          )) : (
            <p className="text-on-surface-variant font-body-md italic py-4">Aucune session disponible pour le moment.</p>
          )}
        </div>
        {formation.programme_pdf_url && (
          <a href={formation.programme_pdf_url} target="_blank" rel="noopener noreferrer" download
            className="mt-6 inline-flex items-center gap-2 text-primary hover:underline font-label-caps text-xs uppercase tracking-widest">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Télécharger le programme détaillé (PDF)
          </a>
        )}
        <div className="mt-6 pt-6 border-t border-surface-container-highest text-sm text-on-surface-variant font-body-md">
          <p>Le solde de {solde}€ sera réglé le dernier jour de la formation (espèces, virement ou carte).</p>
        </div>
      </div>

      {/* Overlay modal */}
      {selectedSessionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={step < 4 ? closeFlow : undefined}>
          <div className="bg-surface max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-primary text-on-primary px-8 py-6">
              <p className="font-label-caps text-xs uppercase tracking-widest opacity-80 mb-1">
                Étape {step} / 4 — {STEPS[step - 1]}
              </p>
              <h2 className="font-headline-md text-2xl">{formation.titre}</h2>
              <p className="text-sm opacity-80 mt-1">Acompte : {acompte}€ · Solde : {solde}€</p>
            </div>

            {/* Steps */}
            <div className="px-8 py-6">
              {step === 1 && (
                <Step1Form initial={formData} onNext={onStep1Next} />
              )}
              {step === 2 && (
                <Step2Contract html={contractHtml} onSign={() => setStep(3)} onBack={() => setStep(1)} />
              )}
              {step === 3 && (
                <Step3Signature
                  defaultName={`${formData.prenom} ${formData.nom}`}
                  loading={loading} error={error}
                  onConfirm={onStep3Confirm} onBack={() => setStep(2)}
                />
              )}
              {step === 4 && (
                <div className="text-center py-12">
                  <p className="font-headline-sm text-on-surface mb-2">Redirection en cours…</p>
                  <p className="text-sm text-on-surface-variant">Vous allez être redirigé vers le paiement sécurisé.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 5 : Commit**

```bash
git add src/components/booking/ src/app/formations/
git commit -m "feat: SessionBooking refactor — stepper 4 étapes avec contrat + signature"
```

---

## Task 7 — Mise à jour `/api/checkout`

**Files:**
- Modify: `src/app/api/checkout/route.ts`

- [ ] **Step 1 : Modifier la route — retirer custom_fields, ajouter reservation_id**

Remplacer le contenu entier du fichier :

```typescript
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-04-22.dahlia' })
    const body = await req.json()
    const { session_id, reservation_id } = body

    if (!session_id || !reservation_id) {
      return NextResponse.json({ error: 'session_id et reservation_id requis' }, { status: 400 })
    }

    const siteOrigin = new URL(req.url).origin
    const supabase = await createAdminClient()

    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('*, formations(*)')
      .eq('id', session_id)
      .single()

    if (sessionError || !sessionData) {
      return NextResponse.json({ error: 'Session introuvable' }, { status: 404 })
    }
    if (sessionData.places_disponibles <= 0) {
      return NextResponse.json({ error: 'Cette session est complète.' }, { status: 400 })
    }

    const formation = sessionData.formations

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      invoice_creation: { enabled: true },
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Acompte (30%) — ${formation.titre}`,
            description: `Session du ${new Date(sessionData.date_debut).toLocaleDateString('fr-FR')} au ${new Date(sessionData.date_fin).toLocaleDateString('fr-FR')}`,
            images: formation.image_url ? [formation.image_url] : [],
          },
          unit_amount: Math.round(formation.prix * 0.3 * 100),
        },
        quantity: 1,
      }],
      metadata: {
        supabase_session_id: session_id,
        reservation_id,
        formation_titre: formation.titre,
        formation_prix: String(formation.prix),
        date_debut: sessionData.date_debut,
        date_fin: sessionData.date_fin,
      },
      success_url: `${siteOrigin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${siteOrigin}/formations/${formation.id}`,
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error: any) {
    console.error('Erreur Checkout:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

- [ ] **Step 2 : Commit**

```bash
git add src/app/api/checkout/route.ts
git commit -m "feat: checkout retire custom_fields, passe reservation_id en metadata"
```

---

## Task 8 — Mise à jour Webhook Stripe

**Files:**
- Modify: `src/app/api/webhook/stripe/route.ts`

- [ ] **Step 1 : Réécrire le webhook**

```typescript
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { readFileSync } from 'fs'
import { join } from 'path'
import ConfirmationEmail from '@/emails/ConfirmationEmail'
import AdminNotificationEmail from '@/emails/AdminNotificationEmail'

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-04-22.dahlia' })
  const resend = new Resend(process.env.RESEND_API_KEY)

  const payload = await req.text()
  const signature = req.headers.get('stripe-signature')
  if (!signature) return NextResponse.json({ error: 'No signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') return NextResponse.json({ received: true })

  const session = event.data.object as Stripe.Checkout.Session
  const reservationId = session.metadata?.reservation_id
  const supabaseSessionId = session.metadata?.supabase_session_id
  if (!reservationId) { console.error('reservation_id manquant dans metadata'); return NextResponse.json({ received: true }) }

  const supabase = await createAdminClient()

  // Idempotence
  const { data: existing } = await supabase.from('reservations').select('statut').eq('id', reservationId).single()
  if (existing?.statut === 'confirmee') return NextResponse.json({ received: true })

  const stripeId = (session.payment_intent as string) || session.id
  const acompteAmount = Math.round((session.amount_total ?? 0) / 100)

  // Update reservation
  const { data: reservation, error: updateError } = await supabase
    .from('reservations')
    .update({
      statut: 'confirmee',
      stripe_payment_id: stripeId,
      acompte_amount: acompteAmount,
      acompte_paid_at: new Date().toISOString(),
    })
    .eq('id', reservationId)
    .select('*, sessions(date_debut, date_fin, formations(titre, prix, duree_formation, programme_pdf_url))')
    .single()

  if (updateError || !reservation) {
    console.error('Erreur update reservation:', updateError)
    return NextResponse.json({ received: true })
  }

  // Décrémenter les places
  const { error: rpcError } = await supabase.rpc('decrement_places', { session_id: supabaseSessionId })
  if (rpcError) {
    const { data: sess } = await supabase.from('sessions').select('places_disponibles').eq('id', supabaseSessionId).single()
    if (sess) await supabase.from('sessions').update({ places_disponibles: Math.max(0, sess.places_disponibles - 1) }).eq('id', supabaseSessionId)
  }

  // Déplacer le PDF dans Storage vers le path final
  const oldPath = reservation.contrat_signe_url // ex: "{temp_uuid}/contrat-signe.pdf"
  const newPath = `${reservationId}/contrat-signe.pdf`
  let contratFinalPath = oldPath
  if (oldPath && oldPath !== newPath) {
    try {
      await supabase.storage.from('contracts').move(oldPath, newPath)
      await supabase.from('reservations').update({ contrat_signe_url: newPath }).eq('id', reservationId)
      contratFinalPath = newPath
    } catch (e) { console.error('Erreur move PDF:', e) }
  }

  try {
    const formation: any = (reservation as any).sessions?.formations
    const sessionRow: any = (reservation as any).sessions
    const dateDebut = new Date(sessionRow?.date_debut ?? Date.now()).toLocaleDateString('fr-FR')
    const dateFin   = new Date(sessionRow?.date_fin   ?? Date.now()).toLocaleDateString('fr-FR')
    const dateSession = dateDebut === dateFin ? `le ${dateDebut}` : `du ${dateDebut} au ${dateFin}`
    const formationTitre = formation?.titre ?? session.metadata?.formation_titre ?? 'Formation'
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin

    // Facture Stripe
    let invoiceUrl: string | null = null
    let invoicePdfBase64: string | null = null
    if (session.invoice) {
      try {
        const invoice = await stripe.invoices.retrieve(session.invoice as string)
        invoiceUrl = invoice.hosted_invoice_url ?? null
        if (invoice.invoice_pdf) {
          const r = await fetch(invoice.invoice_pdf)
          if (r.ok) invoicePdfBase64 = Buffer.from(await r.arrayBuffer()).toString('base64')
        }
      } catch (e) { console.error('Facture Stripe:', e) }
    }

    // Contrat signé depuis Storage
    let contratBase64: string | null = null
    try {
      const { data: signedUrl } = await supabase.storage.from('contracts').createSignedUrl(contratFinalPath, 3600)
      if (signedUrl?.signedUrl) {
        const r = await fetch(signedUrl.signedUrl)
        if (r.ok) contratBase64 = Buffer.from(await r.arrayBuffer()).toString('base64')
      }
    } catch (e) { console.error('Récup contrat signé:', e) }

    // Règlement intérieur
    const reglementBuffer = readFileSync(join(process.cwd(), 'public', 'documents', 'reglement-interieur.pdf'))
    const reglementBase64 = reglementBuffer.toString('base64')

    // Livret d'accueil depuis parametres_admin
    let livretBase64: string | null = null
    try {
      const { data: param } = await supabase.from('parametres_admin').select('valeur').eq('cle', 'livret_accueil_url').single()
      if (param?.valeur) {
        const r = await fetch(param.valeur)
        if (r.ok) livretBase64 = Buffer.from(await r.arrayBuffer()).toString('base64')
      }
    } catch (e) { console.error('Livret accueil:', e) }

    // Programme PDF
    let programmeBase64: string | null = null
    const programmeUrl = formation?.programme_pdf_url
    if (programmeUrl) {
      try {
        const r = await fetch(programmeUrl)
        if (r.ok) programmeBase64 = Buffer.from(await r.arrayBuffer()).toString('base64')
      } catch (e) { console.error('Programme PDF:', e) }
    }

    // Fiche inscription (texte simple pour l'admin)
    const { generateFichePDF } = await import('@/lib/contract/pdf')
    const ficheBuffer = await generateFichePDF({
      prenom: reservation.prenom ?? '',
      nom: reservation.nom ?? '',
      email: reservation.email_client ?? '',
      telephone: reservation.telephone ?? reservation.telephone_client ?? '',
      adresse: reservation.adresse ?? '',
      client_type: reservation.client_type ?? 'particulier',
      raison_sociale: reservation.raison_sociale ?? undefined,
      siret: reservation.siret ?? reservation.siret_client ?? undefined,
      instagram: reservation.instagram ?? undefined,
      formation_titre: formationTitre,
      date_session: dateSession,
      acompte: acompteAmount,
      created_at: new Date().toISOString(),
    })
    const ficheBase64 = ficheBuffer.toString('base64')

    const docLabel = reservation.client_type === 'pro' ? 'Convention' : 'Contrat'
    const nomComplet = `${reservation.prenom ?? ''} ${reservation.nom ?? ''}`.trim() || reservation.nom_client ?? ''

    // Email client
    const clientAttachments: any[] = [
      { filename: 'Reglement_Interieur.pdf', content: reglementBase64 },
    ]
    if (contratBase64) clientAttachments.unshift({ filename: `${docLabel}_${formationTitre.replace(/\s+/g,'_')}.pdf`, content: contratBase64 })
    if (programmeBase64) clientAttachments.push({ filename: `Programme_${formationTitre.replace(/\s+/g,'_')}.pdf`, content: programmeBase64 })
    if (livretBase64) clientAttachments.push({ filename: 'Livret_Accueil.pdf', content: livretBase64 })
    if (invoicePdfBase64) clientAttachments.push({ filename: `Facture_acompte.pdf`, content: invoicePdfBase64 })

    await resend.emails.send({
      from: 'Beauty Home Concept <contact@beautyhomeconcept.fr>',
      to: [reservation.email_client!],
      subject: `Votre inscription est confirmée — ${formationTitre}`,
      react: ConfirmationEmail({
        nomClient: nomComplet,
        prenom: reservation.prenom ?? nomComplet.split(' ')[0],
        formationTitre,
        dateSession,
        acompte: acompteAmount,
        solde: Math.round((formation?.prix ?? 0) * 0.7),
        invoiceUrl,
        clientType: reservation.client_type as 'particulier' | 'pro',
      }),
      attachments: clientAttachments,
    })

    // Email admin
    const adminAttachments: any[] = [{ filename: 'Fiche_Inscription.pdf', content: ficheBase64 }]
    if (contratBase64) adminAttachments.push({ filename: `${docLabel}_${nomComplet.replace(/\s+/g,'_')}.pdf`, content: contratBase64 })

    await resend.emails.send({
      from: 'Beauty Home Concept <contact@beautyhomeconcept.fr>',
      to: ['beautyhomeconcept@gmail.com'],
      subject: `Nouvelle inscription — ${nomComplet} · ${formationTitre}`,
      react: AdminNotificationEmail({
        nomClient: nomComplet, emailClient: reservation.email_client!,
        telephoneClient: reservation.telephone ?? reservation.telephone_client ?? '',
        adresse: reservation.adresse ?? '',
        clientType: reservation.client_type as 'particulier' | 'pro',
        raisonSociale: reservation.raison_sociale ?? undefined,
        siret: reservation.siret ?? reservation.siret_client ?? undefined,
        instagram: reservation.instagram ?? undefined,
        formationTitre, dateSession, acompte: acompteAmount,
        reservationId: reservationId,
        siteUrl,
      }),
      attachments: adminAttachments,
    })
  } catch (err) {
    console.error('Erreur email/PDF:', err)
  }

  return NextResponse.json({ received: true })
}
```

- [ ] **Step 2 : Commit**

```bash
git add src/app/api/webhook/stripe/route.ts
git commit -m "feat: webhook stripe — update reservation, emails complets avec PJ"
```

---

## Task 9 — Mise à jour des emails

**Files:**
- Modify: `src/emails/ConfirmationEmail.tsx`
- Modify: `src/emails/AdminNotificationEmail.tsx`

- [ ] **Step 1 : Réécrire `ConfirmationEmail.tsx`**

```typescript
import React from 'react'
import { Html, Head, Preview, Body, Container, Text, Button, Hr } from '@react-email/components'

interface Props {
  nomClient: string; prenom: string; formationTitre: string; dateSession: string
  acompte: number; solde: number; invoiceUrl: string | null
  clientType: 'particulier' | 'pro'
}

export default function ConfirmationEmail({ nomClient, prenom, formationTitre, dateSession, acompte, solde, invoiceUrl, clientType }: Props) {
  const gold = '#755a2d'
  const bg   = '#faf9f9'
  const docLabel = clientType === 'pro' ? 'convention' : 'contrat'

  return (
    <Html>
      <Head />
      <Preview>Votre inscription est confirmée — {formationTitre}</Preview>
      <Body style={{ backgroundColor: bg, fontFamily: 'Georgia, serif', padding: '32px 16px' }}>
        <Container style={{ backgroundColor: '#fff', maxWidth: 560, margin: '0 auto', border: '1px solid #e3e2e2' }}>
          <div style={{ backgroundColor: gold, padding: '32px 40px' }}>
            <Text style={{ color: '#fff', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'sans-serif', margin: 0 }}>Beauty Home Concept</Text>
            <Text style={{ color: '#fff', fontSize: 22, margin: '8px 0 0', fontWeight: 400 }}>Inscription confirmée</Text>
          </div>

          <div style={{ padding: '32px 40px' }}>
            <Text style={{ fontSize: 16, color: '#1b1c1c', marginBottom: 24 }}>Bonjour {prenom},</Text>
            <Text style={{ fontSize: 14, color: '#4e463a', lineHeight: 1.7, marginBottom: 24 }}>
              Votre inscription à la formation <strong>{formationTitre}</strong> {dateSession} est bien confirmée. Vous trouverez en pièce jointe votre {docLabel} de formation signé, le programme détaillé, le livret d'accueil et le règlement intérieur.
            </Text>

            <div style={{ backgroundColor: bg, padding: 20, marginBottom: 24, border: '1px solid #e3e2e2' }}>
              <Text style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'sans-serif', color: gold, margin: '0 0 12px' }}>Récapitulatif financier</Text>
              <Text style={{ fontSize: 13, color: '#1b1c1c', margin: '4px 0', fontFamily: 'sans-serif' }}>Acompte réglé : <strong>{acompte} €</strong></Text>
              <Text style={{ fontSize: 13, color: '#4e463a', margin: '4px 0', fontFamily: 'sans-serif' }}>Solde restant : {solde} € — à régler le dernier jour de la formation (espèces, virement ou carte).</Text>
            </div>

            {invoiceUrl && (
              <Button href={invoiceUrl} style={{ backgroundColor: gold, color: '#fff', padding: '12px 24px', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'sans-serif', textDecoration: 'none', display: 'inline-block', marginBottom: 24 }}>
                Voir ma facture →
              </Button>
            )}

            <Hr style={{ borderColor: '#e3e2e2', margin: '24px 0' }} />
            <Text style={{ fontSize: 12, color: '#7f7669', fontFamily: 'sans-serif', lineHeight: 1.6 }}>
              En cas de question : <a href="mailto:contact@beautyhomeconcept.fr" style={{ color: gold }}>contact@beautyhomeconcept.fr</a>
            </Text>
          </div>
        </Container>
      </Body>
    </Html>
  )
}
```

- [ ] **Step 2 : Réécrire `AdminNotificationEmail.tsx`**

```typescript
import React from 'react'
import { Html, Head, Preview, Body, Container, Text, Button, Hr } from '@react-email/components'

interface Props {
  nomClient: string; emailClient: string; telephoneClient: string
  adresse: string; clientType: 'particulier' | 'pro'
  raisonSociale?: string; siret?: string; instagram?: string
  formationTitre: string; dateSession: string; acompte: number
  reservationId: string; siteUrl: string
}

export default function AdminNotificationEmail({
  nomClient, emailClient, telephoneClient, adresse, clientType,
  raisonSociale, siret, instagram,
  formationTitre, dateSession, acompte, reservationId, siteUrl,
}: Props) {
  const gold = '#755a2d'
  const bg   = '#faf9f9'

  const row = (label: string, value: string) => value ? (
    <Text style={{ fontSize: 13, color: '#1b1c1c', margin: '4px 0', fontFamily: 'sans-serif' }}>
      <span style={{ color: '#7f7669' }}>{label} : </span>{value}
    </Text>
  ) : null

  return (
    <Html>
      <Head />
      <Preview>Nouvelle inscription — {nomClient} · {formationTitre}</Preview>
      <Body style={{ backgroundColor: bg, fontFamily: 'Georgia, serif', padding: '32px 16px' }}>
        <Container style={{ backgroundColor: '#fff', maxWidth: 560, margin: '0 auto', border: '1px solid #e3e2e2' }}>
          <div style={{ backgroundColor: '#1b1c1c', padding: '24px 40px' }}>
            <Text style={{ color: gold, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'sans-serif', margin: 0 }}>Admin · Beauty Home Concept</Text>
            <Text style={{ color: '#fff', fontSize: 20, margin: '8px 0 0', fontWeight: 400 }}>Nouvelle inscription</Text>
          </div>

          <div style={{ padding: '32px 40px' }}>
            <Text style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'sans-serif', color: gold, margin: '0 0 12px' }}>Formation</Text>
            {row('Formation', formationTitre)}
            {row('Date', dateSession)}
            {row('Acompte reçu', `${acompte} €`)}
            {row('Solde à encaisser le dernier jour', `en présentiel`)}

            <Hr style={{ borderColor: '#e3e2e2', margin: '20px 0' }} />

            <Text style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'sans-serif', color: gold, margin: '0 0 12px' }}>
              Élève — {clientType === 'pro' ? 'Professionnel' : 'Particulier'}
            </Text>
            {row('Nom', nomClient)}
            {row('Email', emailClient)}
            {row('Téléphone', telephoneClient)}
            {row('Adresse', adresse)}
            {clientType === 'pro' && <>
              {row('Raison sociale', raisonSociale ?? '')}
              {row('SIRET', siret ?? '')}
              {row('Instagram', instagram ?? '')}
            </>}

            <Hr style={{ borderColor: '#e3e2e2', margin: '20px 0' }} />

            <Button href={`${siteUrl}/admin/reservations`}
              style={{ backgroundColor: gold, color: '#fff', padding: '12px 24px', fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'sans-serif', textDecoration: 'none', display: 'inline-block' }}>
              Voir dans l'admin →
            </Button>
          </div>
        </Container>
      </Body>
    </Html>
  )
}
```

- [ ] **Step 3 : Commit**

```bash
git add src/emails/
git commit -m "feat: emails confirmation + admin avec nouveaux champs et layout"
```

---

## Task 10 — Admin éditeur contrats

**Files:**
- Create: `src/app/admin/(protected)/formations/[id]/contrats/page.tsx`
- Create: `src/app/admin/(protected)/formations/[id]/contrats/ContractEditor.tsx`
- Modify: `src/app/admin/actions.ts`

- [ ] **Step 1 : Installer Tiptap**

```bash
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-underline @tiptap/extension-text-align
```

- [ ] **Step 2 : Ajouter `saveContractTemplate` dans `src/app/admin/actions.ts`**

Ajouter à la fin du fichier :

```typescript
export async function saveContractTemplate(
  formationId: string,
  type: 'particulier' | 'pro',
  contenu: string,
  titre: string,
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('contract_templates')
    .upsert(
      { formation_id: formationId, type, contenu, titre, updated_at: new Date().toISOString() },
      { onConflict: 'formation_id,type', ignoreDuplicates: false }
    )
  if (error) throw new Error(error.message)
  // Incrémenter la version
  await supabase.rpc('increment_contract_version', { p_formation_id: formationId, p_type: type })
    .catch(() => {}) // RPC optionnelle — fallback : on met à jour manuellement
}
```

Ajouter également dans Supabase la fonction RPC d'incrémentation de version :
```sql
create or replace function increment_contract_version(p_formation_id uuid, p_type text)
returns void language plpgsql as $$
begin
  update contract_templates
  set version = version + 1
  where formation_id = p_formation_id and type = p_type;
end;
$$;
```

- [ ] **Step 3 : Créer `ContractEditor.tsx`**

```typescript
'use client'
import { useState, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { saveContractTemplate } from '@/app/admin/actions'

const VARIABLES = [
  '{{nom_prenom}}','{{prenom}}','{{adresse}}','{{email}}','{{telephone}}',
  '{{raison_sociale}}','{{siret}}','{{instagram}}',
  '{{formation}}','{{date_session}}','{{duree}}',
  '{{prix_total}}','{{acompte}}','{{solde}}',
  '{{date_signature}}','{{clause_rgpd}}',
]

interface Props {
  formationId: string
  type: 'particulier' | 'pro'
  initialContent: string
  initialTitre: string
}

export default function ContractEditor({ formationId, type, initialContent, initialTitre }: Props) {
  const [titre, setTitre] = useState(initialTitre)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: initialContent || '<p>Saisissez le contenu du contrat ici…</p>',
  })

  const insertVariable = (v: string) => {
    editor?.chain().focus().insertContent(v).run()
  }

  const handleSave = async () => {
    if (!editor) return
    setSaving(true); setError(null); setSaved(false)
    try {
      await saveContractTemplate(formationId, type, editor.getHTML(), titre)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handlePreview = async () => {
    if (!editor) return
    const res = await fetch('/api/contract/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        formation_id: formationId,
        session_id: 'preview',
        client_type: type,
        prenom: 'Marie', nom: 'Dupont',
        email: 'marie@exemple.fr', telephone: '06 00 00 00 00',
        adresse: '12 rue de la Paix, 75001 Paris',
        raison_sociale: type === 'pro' ? 'Salon Marie Dupont' : undefined,
        siret: type === 'pro' ? '12345678901234' : undefined,
      }),
    })
    // Ouvrir dans un onglet — le HTML brut suffit pour l'aperçu
    const blob = new Blob([(await res.json()).html ?? ''], { type: 'text/html' })
    window.open(URL.createObjectURL(blob))
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block font-label-caps text-xs uppercase tracking-widest text-on-surface-variant mb-1">Titre du document</label>
        <input value={titre} onChange={e => setTitre(e.target.value)}
          className="w-full border border-outline-variant px-4 py-2 text-sm bg-surface focus:border-primary focus:outline-none" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 p-2 bg-surface-container-lowest border border-outline-variant">
        {[
          { label: 'G', cmd: () => editor?.chain().focus().toggleBold().run(), active: editor?.isActive('bold') },
          { label: 'I', cmd: () => editor?.chain().focus().toggleItalic().run(), active: editor?.isActive('italic') },
          { label: 'S', cmd: () => editor?.chain().focus().toggleUnderline().run(), active: editor?.isActive('underline') },
          { label: 'H2', cmd: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(), active: editor?.isActive('heading', { level: 2 }) },
          { label: 'H3', cmd: () => editor?.chain().focus().toggleHeading({ level: 3 }).run(), active: editor?.isActive('heading', { level: 3 }) },
          { label: '• Liste', cmd: () => editor?.chain().focus().toggleBulletList().run(), active: editor?.isActive('bulletList') },
        ].map(({ label, cmd, active }) => (
          <button key={label} onClick={cmd} type="button"
            className={`px-3 py-1 text-xs border font-label-caps transition-colors ${active ? 'border-primary bg-primary/5 text-primary' : 'border-outline-variant text-on-surface hover:border-primary'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Variables */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-on-surface-variant font-label-caps uppercase tracking-widest self-center">Insérer :</span>
        {VARIABLES.map(v => (
          <button key={v} onClick={() => insertVariable(v)} type="button"
            className="text-xs bg-surface-container-lowest border border-outline-variant px-2 py-1 text-primary hover:bg-primary/5 transition-colors font-mono">
            {v}
          </button>
        ))}
      </div>

      {/* Editor */}
      <EditorContent editor={editor}
        className="min-h-[400px] border border-outline-variant p-4 bg-white prose prose-sm max-w-none focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[380px]" />

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="flex gap-3">
        <button onClick={handlePreview} type="button"
          className="border border-outline-variant px-6 py-3 font-label-caps text-xs uppercase tracking-widest text-on-surface hover:border-primary hover:text-primary transition-colors">
          Aperçu PDF
        </button>
        <button onClick={handleSave} disabled={saving} type="button"
          className="bg-primary text-on-primary px-6 py-3 font-label-caps text-xs uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50">
          {saving ? 'Sauvegarde…' : saved ? '✓ Sauvegardé' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4 : Créer `page.tsx` pour la route `/admin/formations/[id]/contrats`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ContractEditor from './ContractEditor'

export default async function FormationContratsPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: formation } = await supabase.from('formations').select('id, titre').eq('id', params.id).single()
  if (!formation) redirect('/admin/formations')

  const { data: templates } = await supabase
    .from('contract_templates')
    .select('type, titre, contenu')
    .eq('formation_id', params.id)

  const particulier = templates?.find(t => t.type === 'particulier')
  const pro         = templates?.find(t => t.type === 'pro')

  return (
    <div>
      <div className="mb-8">
        <a href="/admin/formations" className="text-xs text-on-surface-variant hover:text-primary font-label-caps uppercase tracking-widest">← Formations</a>
        <h2 className="font-headline-md text-headline-md mt-2">{formation.titre} — Contrats</h2>
      </div>

      <div className="space-y-12">
        <section>
          <h3 className="font-label-caps text-xs uppercase tracking-widest text-on-surface-variant mb-6 pb-2 border-b border-outline-variant">
            Contrat — Particulier
          </h3>
          <ContractEditor
            formationId={formation.id}
            type="particulier"
            initialContent={particulier?.contenu ?? ''}
            initialTitre={particulier?.titre ?? `Contrat de formation — ${formation.titre}`}
          />
        </section>

        <section>
          <h3 className="font-label-caps text-xs uppercase tracking-widest text-on-surface-variant mb-6 pb-2 border-b border-outline-variant">
            Convention — Professionnel
          </h3>
          <ContractEditor
            formationId={formation.id}
            type="pro"
            initialContent={pro?.contenu ?? ''}
            initialTitre={pro?.titre ?? `Convention de formation — ${formation.titre}`}
          />
        </section>
      </div>
    </div>
  )
}
```

- [ ] **Step 5 : Ajouter lien "Contrats" dans la page `/admin/formations`**

Dans `src/app/admin/(protected)/formations/page.tsx`, ajouter pour chaque formation :
```typescript
<a href={`/admin/formations/${f.id}/contrats`}
  className="text-xs font-label-caps uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors border border-outline-variant px-3 py-2">
  Contrats
</a>
```

- [ ] **Step 6 : Commit**

```bash
git add src/app/admin/
git commit -m "feat: admin éditeur contrats Tiptap par formation"
```

---

## Task 11 — Admin `/admin/reservations`

**Files:**
- Create: `src/app/admin/(protected)/reservations/page.tsx`
- Create: `src/app/admin/(protected)/reservations/ReservationsTable.tsx`
- Create: `src/app/admin/(protected)/reservations/ReservationSlideIn.tsx`

- [ ] **Step 1 : Créer `ReservationSlideIn.tsx`**

```typescript
'use client'
import { useState } from 'react'

interface Props {
  reservation: any
  onClose: () => void
}

export default function ReservationSlideIn({ reservation: r, onClose }: Props) {
  const [downloading, setDownloading] = useState(false)

  const downloadDossier = async () => {
    setDownloading(true)
    try {
      const res = await fetch(`/api/admin/reservations/${r.id}/dossier`)
      if (!res.ok) throw new Error('Erreur serveur')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url
      a.download = `dossier-${r.nom ?? r.nom_client}.zip`; a.click()
      URL.revokeObjectURL(url)
    } catch (e: any) { alert(e.message) }
    finally { setDownloading(false) }
  }

  const statusColors: Record<string, string> = {
    confirmee: 'bg-green-50 text-green-800',
    en_attente_paiement: 'bg-amber-50 text-amber-800',
    en_attente_signature: 'bg-blue-50 text-blue-800',
    presente: 'bg-primary/10 text-primary',
    annulee: 'bg-red-50 text-red-800',
  }

  const field = (label: string, value: string | undefined) => value ? (
    <div key={label} className="py-2 border-b border-surface-container-low last:border-0">
      <span className="font-label-caps text-xs uppercase tracking-widest text-on-surface-variant">{label}</span>
      <p className="text-sm text-on-surface mt-1">{value}</p>
    </div>
  ) : null

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-surface shadow-2xl z-50 overflow-y-auto"
      style={{ borderLeft: '1px solid #e3e2e2' }}>
      <div className="p-6 border-b border-outline-variant flex justify-between items-start">
        <div>
          <p className="font-label-caps text-xs uppercase tracking-widest text-on-surface-variant mb-1">Dossier élève</p>
          <h3 className="font-headline-sm text-lg text-on-surface">{r.prenom ?? ''} {r.nom ?? r.nom_client}</h3>
          <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-label-caps uppercase tracking-widest ${statusColors[r.statut] ?? ''}`}>
            {r.statut?.replace(/_/g, ' ')}
          </span>
        </div>
        <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface text-2xl leading-none">×</button>
      </div>

      <div className="p-6 space-y-1">
        <p className="font-label-caps text-xs uppercase tracking-widest text-primary mb-4">Informations client</p>
        {field('Email', r.email_client)}
        {field('Téléphone', r.telephone ?? r.telephone_client)}
        {field('Adresse', r.adresse)}
        {field('Type', r.client_type === 'pro' ? 'Professionnel' : 'Particulier')}
        {r.client_type === 'pro' && <>
          {field('Raison sociale', r.raison_sociale)}
          {field('SIRET', r.siret ?? r.siret_client)}
          {field('Instagram', r.instagram)}
        </>}
      </div>

      <div className="px-6 pb-4 space-y-1 border-t border-outline-variant pt-4">
        <p className="font-label-caps text-xs uppercase tracking-widest text-primary mb-4">Contrat</p>
        {r.signature_data ? (
          <p className="text-sm text-on-surface">
            Signé le {new Date(r.signature_data.timestamp).toLocaleString('fr-FR')}
            {' '}({r.signature_data.type === 'text' ? 'nom tapé' : 'signature dessinée'})
          </p>
        ) : <p className="text-sm text-on-surface-variant italic">Non signé</p>}
      </div>

      <div className="px-6 pb-4 space-y-1 border-t border-outline-variant pt-4">
        <p className="font-label-caps text-xs uppercase tracking-widest text-primary mb-4">Paiement</p>
        {field('Acompte', r.acompte_amount ? `${r.acompte_amount} €` : undefined)}
        {field('Payé le', r.acompte_paid_at ? new Date(r.acompte_paid_at).toLocaleDateString('fr-FR') : undefined)}
      </div>

      <div className="p-6 border-t border-outline-variant space-y-3">
        <button onClick={downloadDossier} disabled={downloading}
          className="w-full border border-primary text-primary py-3 font-label-caps text-xs uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-colors disabled:opacity-50 min-h-[44px]">
          {downloading ? 'Préparation…' : '⬇ Télécharger le dossier complet'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2 : Créer `ReservationsTable.tsx`**

```typescript
'use client'
import { useState } from 'react'
import ReservationSlideIn from './ReservationSlideIn'

const STATUS_LABELS: Record<string, string> = {
  confirmee: 'Confirmée', en_attente_paiement: 'En attente paiement',
  en_attente_signature: 'En attente signature', presente: 'Présente', annulee: 'Annulée',
}
const STATUS_COLORS: Record<string, string> = {
  confirmee: 'bg-green-50 text-green-800', en_attente_paiement: 'bg-amber-50 text-amber-800',
  en_attente_signature: 'bg-blue-50 text-blue-800', presente: 'bg-primary/10 text-primary',
  annulee: 'bg-red-50 text-red-800',
}

export default function ReservationsTable({ reservations }: { reservations: any[] }) {
  const [selected, setSelected] = useState<any | null>(null)
  const [filter, setFilter] = useState<string>('toutes')
  const [formationFilter, setFormationFilter] = useState<string>('toutes')

  const formations = [...new Set(reservations.map(r => r.sessions?.formations?.titre).filter(Boolean))]

  const filtered = reservations.filter(r => {
    const statusOk = filter === 'toutes' || r.statut === filter
    const formationOk = formationFilter === 'toutes' || r.sessions?.formations?.titre === formationFilter
    return statusOk && formationOk
  })

  return (
    <>
      {/* Filtres */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['toutes', 'confirmee', 'en_attente_paiement', 'presente', 'annulee'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`font-label-caps text-xs uppercase tracking-widest px-4 py-2 border transition-colors ${filter === s ? 'border-primary text-primary bg-primary/5' : 'border-outline-variant text-on-surface-variant hover:border-primary'}`}>
            {s === 'toutes' ? 'Toutes' : STATUS_LABELS[s]}
          </button>
        ))}
        {formations.length > 0 && (
          <select value={formationFilter} onChange={e => setFormationFilter(e.target.value)}
            className="font-label-caps text-xs uppercase tracking-widest px-4 py-2 border border-outline-variant text-on-surface bg-surface focus:border-primary focus:outline-none">
            <option value="toutes">Toutes formations</option>
            {formations.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left font-body-md">
          <thead>
            <tr className="border-b border-surface-container-high text-on-surface-variant">
              {['Élève', 'Formation', 'Date session', 'Type', 'Statut', 'Inscription'].map(h => (
                <th key={h} className="py-3 pr-4 font-normal font-label-caps text-xs uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id}
                onClick={() => setSelected(r)}
                className="border-b border-surface-container-low last:border-0 cursor-pointer hover:bg-surface-container-lowest transition-colors">
                <td className="py-4 pr-4 font-medium text-on-surface">{r.prenom ?? ''} {r.nom ?? r.nom_client}</td>
                <td className="py-4 pr-4 text-on-surface-variant text-sm">{r.sessions?.formations?.titre}</td>
                <td className="py-4 pr-4 text-on-surface-variant text-sm">
                  {r.sessions?.date_debut ? new Date(r.sessions.date_debut).toLocaleDateString('fr-FR') : '—'}
                </td>
                <td className="py-4 pr-4 text-on-surface-variant text-sm">{r.client_type === 'pro' ? 'Pro' : 'Particulier'}</td>
                <td className="py-4 pr-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-label-caps uppercase tracking-widest ${STATUS_COLORS[r.statut] ?? ''}`}>
                    {STATUS_LABELS[r.statut] ?? r.statut}
                  </span>
                </td>
                <td className="py-4 text-on-surface-variant text-sm">
                  {new Date(r.created_at).toLocaleDateString('fr-FR')}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-on-surface-variant italic">Aucune réservation.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && <ReservationSlideIn reservation={selected} onClose={() => setSelected(null)} />}
      {selected && <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setSelected(null)} />}
    </>
  )
}
```

- [ ] **Step 3 : Créer `page.tsx`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReservationsTable from './ReservationsTable'

export default async function ReservationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: reservations } = await supabase
    .from('reservations')
    .select(`
      id, prenom, nom, nom_client, email_client, telephone, telephone_client,
      adresse, client_type, raison_sociale, siret, siret_client, instagram,
      statut, signature_data, contrat_signe_url, acompte_amount, acompte_paid_at,
      created_at,
      sessions ( date_debut, date_fin, formations ( titre ) )
    `)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex justify-between items-end mb-10">
        <h2 className="font-headline-md text-headline-md">Réservations</h2>
        <p className="text-sm text-on-surface-variant">{reservations?.length ?? 0} au total</p>
      </div>
      <ReservationsTable reservations={reservations ?? []} />
    </div>
  )
}
```

- [ ] **Step 4 : Ajouter lien dans le nav admin** (`src/app/admin/(protected)/layout.tsx`)

Ajouter dans la liste de liens :
```typescript
<a href="/admin/reservations" className="font-label-caps text-xs uppercase tracking-widest hover:text-primary transition-colors">
  Réservations
</a>
```

- [ ] **Step 5 : Commit**

```bash
git add src/app/admin/(protected)/reservations/
git commit -m "feat: admin /reservations — tableau filtrable + slide-in détail"
```

---

## Task 12 — Admin `/admin/parametres`

**Files:**
- Create: `src/app/admin/(protected)/parametres/page.tsx`
- Modify: `src/app/admin/actions.ts`

- [ ] **Step 1 : Ajouter `saveParametre` dans actions.ts**

```typescript
export async function saveParametre(cle: string, file: File) {
  const supabase = await createAdminClient()
  const ext = file.name.split('.').pop() ?? 'pdf'
  const path = `documents/${cle}.${ext}`
  const bytes = await file.arrayBuffer()

  const { error: uploadError } = await supabase.storage
    .from('formations_images')
    .upload(path, bytes, { contentType: file.type, upsert: true })

  if (uploadError) throw new Error(uploadError.message)

  const { data } = supabase.storage.from('formations_images').getPublicUrl(path)

  const { error } = await supabase
    .from('parametres_admin')
    .upsert({ cle, valeur: data.publicUrl }, { onConflict: 'cle' })

  if (error) throw new Error(error.message)
}
```

- [ ] **Step 2 : Créer `page.tsx`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ParametresForm from './ParametresForm'

export default async function ParametresPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: params } = await supabase.from('parametres_admin').select('cle, valeur')
  const map = Object.fromEntries((params ?? []).map(p => [p.cle, p.valeur]))

  return (
    <div>
      <h2 className="font-headline-md text-headline-md mb-10">Paramètres</h2>
      <ParametresForm livretUrl={map.livret_accueil_url ?? ''} reglementUrl={map.reglement_interieur_url ?? ''} />
    </div>
  )
}
```

- [ ] **Step 3 : Créer `ParametresForm.tsx`**

```typescript
'use client'
import { useState } from 'react'
import { saveParametre } from '@/app/admin/actions'

interface Props { livretUrl: string; reglementUrl: string }

export default function ParametresForm({ livretUrl, reglementUrl }: Props) {
  const [saving, setSaving] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successes, setSuccesses] = useState<Record<string, boolean>>({})

  const handleUpload = async (cle: string, file: File | undefined) => {
    if (!file) return
    setSaving(cle); setErrors(e => ({ ...e, [cle]: '' }))
    try {
      await saveParametre(cle, file)
      setSuccesses(s => ({ ...s, [cle]: true }))
      setTimeout(() => setSuccesses(s => ({ ...s, [cle]: false })), 3000)
    } catch (e: any) {
      setErrors(er => ({ ...er, [cle]: e.message }))
    } finally { setSaving(null) }
  }

  const FileRow = ({ cle, label, currentUrl }: { cle: string, label: string, currentUrl: string }) => (
    <div className="py-6 border-b border-outline-variant last:border-0">
      <p className="font-label-caps text-xs uppercase tracking-widest text-on-surface-variant mb-2">{label}</p>
      {currentUrl && <a href={currentUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline block mb-3">Voir le fichier actuel ↗</a>}
      <input type="file" accept="application/pdf"
        onChange={e => handleUpload(cle, e.target.files?.[0])}
        className="text-sm text-on-surface file:mr-4 file:py-2 file:px-4 file:border file:border-outline-variant file:text-xs file:font-label-caps file:uppercase file:tracking-widest file:text-on-surface file:bg-surface hover:file:border-primary" />
      {saving === cle && <p className="mt-1 text-xs text-on-surface-variant">Upload en cours…</p>}
      {successes[cle] && <p className="mt-1 text-xs text-green-700">✓ Sauvegardé</p>}
      {errors[cle] && <p className="mt-1 text-xs text-error">{errors[cle]}</p>}
    </div>
  )

  return (
    <div className="bg-surface border border-surface-container-highest p-8">
      <p className="font-label-caps text-xs uppercase tracking-widest text-primary mb-6">Documents</p>
      <FileRow cle="livret_accueil_url" label="Livret d'accueil (PDF)" currentUrl={livretUrl} />
      <FileRow cle="reglement_interieur_url" label="Règlement intérieur (PDF)" currentUrl={reglementUrl} />
    </div>
  )
}
```

- [ ] **Step 4 : Ajouter lien dans le nav admin**

```typescript
<a href="/admin/parametres" className="font-label-caps text-xs uppercase tracking-widest hover:text-primary transition-colors">
  Paramètres
</a>
```

- [ ] **Step 5 : Commit**

```bash
git add src/app/admin/(protected)/parametres/
git commit -m "feat: admin /parametres — upload livret accueil + règlement"
```

---

## Task 13 — API dossier ZIP

**Files:**
- Create: `src/app/api/admin/reservations/[id]/dossier/route.ts`

- [ ] **Step 1 : Créer la route**

```typescript
import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import JSZip from 'jszip'
import { generateFichePDF } from '@/lib/contract/pdf'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const admin = await createAdminClient()

  const { data: r, error } = await admin
    .from('reservations')
    .select('*, sessions(date_debut, date_fin, formations(titre, prix, programme_pdf_url))')
    .eq('id', params.id)
    .single()

  if (error || !r) return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 })

  const formation: any = (r as any).sessions?.formations
  const sessionRow: any = (r as any).sessions
  const dateDebut = new Date(sessionRow?.date_debut ?? Date.now()).toLocaleDateString('fr-FR')
  const dateFin   = new Date(sessionRow?.date_fin   ?? Date.now()).toLocaleDateString('fr-FR')
  const dateSession = dateDebut === dateFin ? `le ${dateDebut}` : `du ${dateDebut} au ${dateFin}`

  const zip = new JSZip()

  // 1. Fiche inscription
  const ficheBuffer = await generateFichePDF({
    prenom: r.prenom ?? '', nom: r.nom ?? r.nom_client ?? '',
    email: r.email_client ?? '', telephone: r.telephone ?? r.telephone_client ?? '',
    adresse: r.adresse ?? '',
    client_type: r.client_type ?? 'particulier',
    raison_sociale: r.raison_sociale ?? undefined,
    siret: r.siret ?? r.siret_client ?? undefined,
    instagram: r.instagram ?? undefined,
    formation_titre: formation?.titre ?? '',
    date_session: dateSession,
    acompte: r.acompte_amount ?? 0,
    created_at: r.created_at ?? new Date().toISOString(),
  })
  zip.file('fiche-inscription.pdf', ficheBuffer)

  // 2. Contrat signé depuis Storage
  if (r.contrat_signe_url) {
    try {
      const { data: signed } = await admin.storage.from('contracts').createSignedUrl(r.contrat_signe_url, 600)
      if (signed?.signedUrl) {
        const res = await fetch(signed.signedUrl)
        if (res.ok) zip.file('contrat-signe.pdf', Buffer.from(await res.arrayBuffer()))
      }
    } catch (e) { console.error('Contrat signé zip:', e) }
  }

  // 3. Programme PDF si disponible
  if (formation?.programme_pdf_url) {
    try {
      const res = await fetch(formation.programme_pdf_url)
      if (res.ok) zip.file('programme-formation.pdf', Buffer.from(await res.arrayBuffer()))
    } catch (e) { console.error('Programme zip:', e) }
  }

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
  const nomFichier = `dossier-${(r.prenom ?? r.nom_client ?? 'eleve').replace(/\s+/g, '-').toLowerCase()}.zip`

  return new Response(zipBuffer, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${nomFichier}"`,
    },
  })
}
```

- [ ] **Step 2 : Commit**

```bash
git add src/app/api/admin/reservations/
git commit -m "feat: GET /api/admin/reservations/[id]/dossier — ZIP contrat + fiche + programme"
```

---

## Checklist finale

- [ ] Tester le flow complet : Étape 1 → Étape 2 (contrat visible) → Étape 3 (signature) → Stripe → email reçu avec toutes les PJ
- [ ] Vérifier que l'email admin reçoit bien le contrat signé et la fiche
- [ ] Créer un template de test dans `/admin/formations/[id]/contrats` et prévisualiser
- [ ] Uploader le livret d'accueil dans `/admin/parametres`
- [ ] Télécharger un dossier ZIP depuis `/admin/reservations`
- [ ] Vérifier les statuts de réservation dans le tableau admin
