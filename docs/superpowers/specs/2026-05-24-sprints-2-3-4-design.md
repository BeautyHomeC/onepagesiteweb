# Sprints 2, 3, 4 — Design Spec
Date: 2026-05-24  
Statut: Approuvé

## Contexte

Suite du roadmap Beauty Home Concept. Cinq nouvelles features réparties sur 3 sprints, implementées dans l'ordre de dépendance. Features skippées : galerie avant/après, FAQ par formation, quiz formation, feed Instagram.

---

## Sprint 2 — Feature 1 : Note Google

### Objectif
Afficher un badge "Note Google" sur le site public avec note, nombre d'avis et lien vers la fiche Google. L'admin met à jour ces valeurs manuellement.

### Schéma de données

```sql
create table google_rating (
  id int primary key default 1 check (id = 1), -- single-row enforcement
  note decimal(2,1) not null default 5.0,
  nb_avis int not null default 0,
  google_url text not null default '',
  updated_at timestamptz not null default now()
);

alter table google_rating enable row level security;
create policy "Public read" on google_rating for select using (true);
create policy "Admin write" on google_rating for all using (auth.role() = 'service_role');

insert into google_rating (id, note, nb_avis, google_url) values (1, 5.0, 0, '');
```

### Composant public — `GoogleRatingBadge`
- Server Component, fetche la table `google_rating`
- Affiche : étoiles SVG (remplissage proportionnel à `note`), `note/5`, `(nb_avis avis)`, lien externe vers `google_url`
- Fallback si la table est vide ou la requête échoue : masquer le badge silencieusement
- Placement : bande décorative sous le hero, avant la section témoignages

### Admin — `/admin/parametres` (nouvelle page)
- Formulaire : Note (0.0–5.0, step 0.1), Nombre d'avis (entier), URL Google Maps
- Server Action `updateGoogleRating(fd: FormData)` — upsert la ligne id=1
- `revalidatePath('/')` après mise à jour

---

## Sprint 2 — Feature 2 : Formulaire de contact

### Objectif
Permettre aux visiteurs d'envoyer un message depuis le site. Le message est stocké en DB et une notification email est envoyée à la propriétaire.

### Schéma de données

```sql
create table contact_messages (
  id uuid primary key default gen_random_uuid(),
  prenom text not null,
  nom text not null,
  email text not null,
  message text not null,
  lu boolean not null default false,
  created_at timestamptz not null default now()
);

alter table contact_messages enable row level security;
create policy "Public insert" on contact_messages for insert with check (true);
create policy "Admin read/write" on contact_messages for all using (auth.role() = 'service_role');
```

### Server Action — `submitContact(fd: FormData)`
- Validation : prénom/nom (2+ chars), email valide, message (10–2000 chars)
- Champ honeypot `website` : si rempli → retourner succès silencieux (anti-bot)
- Insère dans `contact_messages`
- Envoie via Resend :
  - Email notification → propriétaire (adresse en `CONTACT_EMAIL` env)
  - Email confirmation → visiteur

### Composant public — `ContactSection` + `ContactForm`
- `ContactSection` : Server Component, inclus dans la page principale (`/`)
- `ContactForm` : Client Component
  - Champs : Prénom, Nom, Email, Message (textarea)
  - Champ honeypot caché (`website`, `display:none`, `tabIndex=-1`)
  - États : `idle` → `loading` → `success` | `error`
  - En succès : message de confirmation, formulaire masqué
  - En erreur : message d'erreur inline, formulaire conservé avec les valeurs

### Emails — templates React Email
- `ContactNotificationEmail` : notifie la propriétaire (prénom, nom, email visiteur, message)
- `ContactConfirmationEmail` : confirme réception au visiteur (prénom, résumé message)

### Admin — `/admin/messages`
- Server Component listant les messages par date DESC
- Badge rouge "non lu" sur les entrées récentes
- Clic sur une ligne → Server Action `markAsRead(id)` + affichage message complet (inline expand ou slide-in)
- Pas de suppression en admin (conservation des données)

---

## Sprint 3 — Feature 3 : Page Financement

### Objectif
Page statique `/financement` expliquant les options de financement des formations. Linkée depuis la navigation et les pages de formation.

### Route : `/src/app/financement/page.tsx`
Page Next.js statique (aucune DB), rendue côté serveur.

### Contenu — 3 sections
1. **CPF (Compte Personnel de Formation)**
   - Explication courte
   - Lien vers moncompteformation.gouv.fr
   - Note : selon éligibilité Qualiopi (à confirmer par la propriétaire)

2. **OPCO (via employeur)**
   - Explication courte
   - Démarche : demander à l'employeur de financer via OPCO de branche

3. **Paiement personnel**
   - Paiement en une fois via le système de réservation existant
   - Possibilité de paiement en 2-3 fois (mention, pas encore implémenté)

### SEO
- `metadata.title` : "Financement des formations — Beauty Home Concept"
- `metadata.description` : description courte des options

### Liens entrants
- Header navigation : lien "Financement"
- Pages de formation (`/formations/[id]`) : lien discret sous le prix

---

## Sprint 3 — Feature 4 : Vue calendrier (liste groupée par mois)

### Objectif
Page `/calendrier` affichant toutes les sessions à venir, triées chronologiquement et groupées par mois. Alternative plus visuelle à la liste dans les pages de formation.

### Route : `/src/app/calendrier/page.tsx`
Server Component fetche les données, passe à `CalendrierView` Client Component.

### Requête Supabase
```sql
select
  sessions.id,
  sessions.date,
  sessions.heure_debut,
  sessions.heure_fin,
  sessions.places_disponibles,
  formations.id as formation_id,
  formations.titre,
  formations.duree,
  formations.prix
from sessions
join formations on sessions.formation_id = formations.id
where sessions.date >= current_date
  and formations.active = true
order by sessions.date asc
```

### Groupement
- Clé de groupe : `format(date, 'MMMM yyyy', { locale: fr })`
- Format date : "lundi 14 juin 2025"
- Format heure : "9h00 – 17h00"

### Composant `CalendrierView` (Client Component)
- Props : `sessions: SessionAvecFormation[]`, `formations: { id, titre }[]`
- Filtre dropdown "Toutes les formations" / par formation (state local)
- Filtre appliqué côté client (pas de refetch)
- Rendu : en-tête mois (uppercase, gold, bordure basse), puis cartes sessions

### Carte session
- Nom de la formation (lien → `/formations/[formation_id]`)
- Date formatée + horaire
- Badge places : "X places" (vert si ≥ 3, orange si 1-2, rouge si complet)
- CTA : "Réserver" (lien → `/formations/[formation_id]`) ou "Liste d'attente" si complet
- Aucune action de booking directe depuis le calendrier (redirect vers page formation)

### Lien entrant
- Header navigation : lien "Calendrier"
- Homepage : lien "Voir toutes les sessions" sous la section formations

---

## Sprint 4 — Feature 5 : Transitions de page (Framer Motion)

### Objectif
Animer les transitions entre routes Next.js pour un rendu plus fluide et premium. Respecte `prefers-reduced-motion`.

### Dépendance
- `framer-motion` — vérifier si déjà présent, sinon `npm install framer-motion`

### Composant `PageTransition`
```tsx
// src/components/PageTransition.tsx
'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'

const variants = {
  hidden: { opacity: 0, y: 8 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial="hidden"
        animate="enter"
        exit="exit"
        variants={variants}
        transition={{
          duration: 0.28,
          ease: [0.23, 1, 0.32, 1], // ease-out expo
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
```

### Intégration layout
- Wrapper dans `src/app/layout.tsx` autour de `{children}`, dans le `<body>`
- Le composant est `'use client'` mais son parent (`layout.tsx`) reste Server Component — compatible avec Next.js App Router

### Reduced motion
- CSS global : `@media (prefers-reduced-motion: reduce) { .page-transition { transition-duration: 0ms !important; } }`
- OU prop `transition` conditionnelle via `useReducedMotion()` de Framer Motion

### Contraintes
- Exit animation (200ms) plus courte que l'entrée (280ms) — sensation de réactivité
- Animer uniquement `opacity` et `transform` — jamais `height`, `width`, `padding`
- Durée totale ≤ 300ms pour ne pas ralentir la navigation

---

## Résumé des migrations SQL

Deux nouvelles tables :
- `google_rating` — single-row, admin-managed
- `contact_messages` — messages visiteurs, public insert, admin read

Les tables `sessions` et `formations` existantes sont réutilisées sans modification.

## Nouvelles variables d'environnement
- `CONTACT_EMAIL` — adresse email de réception des messages contact

## Nouvelles routes
| Route | Type | Description |
|-------|------|-------------|
| `/financement` | Page statique | Options de financement |
| `/calendrier` | Page dynamique | Vue calendrier des sessions |
| `/admin/messages` | Admin | Gestion messages de contact |
| `/admin/parametres` | Admin (nouvelle page) | Note Google |
| `submitContact()` (Server Action) | Action | Soumission formulaire contact |
