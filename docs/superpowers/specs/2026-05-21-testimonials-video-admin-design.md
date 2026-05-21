# Témoignages vidéo + Admin — Design Spec
Date: 2026-05-21  
Statut: Approuvé

## Contexte

La section Témoignages actuelle (`TestimonialsSection.tsx`) affiche 4 avis texte hardcodés dans un carrousel horizontal. Objectif : migrer tous les témoignages dans Supabase, ajouter le support vidéo (YouTube/Instagram/upload), et fournir une interface admin complète pour les gérer.

## Layout retenu : Option C — Vidéo vedette + grille texte

- **Vidéo vedette** : une grande vidéo `is_featured = true` s'affiche en haut de la section (pleine largeur sur mobile, 60% sur desktop). Embed YouTube/Vimeo/Instagram ou `<video>` natif selon la source.
- **Grille texte** : tous les avis de type `text` s'affichent en dessous en grille 3 colonnes (desktop) / 2 (tablet) / 1 (mobile).
- **Fallback** : si aucune vidéo featured → seule la grille texte s'affiche (pas de bloc vide).
- **Mobile** : la grille passe en carrousel horizontal snap (comme actuellement).

## Schéma de données — table `testimonials`

```sql
create table testimonials (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('text', 'video')),
  auteur text not null,
  role text,                          -- ex: "Prothésiste — Lille"
  texte text,                         -- contenu de l'avis (optionnel pour vidéo)
  note int check (note between 1 and 5),
  video_url text,                     -- lien YouTube, Instagram, TikTok, Vimeo
  video_file_url text,                -- URL Supabase Storage (bucket: testimonials)
  is_featured boolean default false,  -- une seule vidéo vedette à la fois
  ordre int default 0,                -- tri de l'affichage
  visible boolean default true,       -- masquer sans supprimer
  created_at timestamptz default now()
);

-- Contrainte : une seule vidéo featured à la fois (gérée côté applicatif)
-- Index pour les fetches courants
create index on testimonials (visible, ordre);
```

**Migration initiale** : les 4 avis hardcodés sont insérés comme `type = 'text'` via un script SQL de seed.

## Composant frontend

**Fichier** : `src/components/TestimonialsSection.tsx` (rewrite complet, reste client component)

```
TestimonialsSection
├── fetch depuis Supabase : testimonials WHERE visible = true ORDER BY ordre ASC
├── FeaturedVideo (si is_featured existe)
│   ├── YouTubeEmbed | NativeVideo selon la source détectée
│   └── Overlay : nom de l'auteur + rôle
└── TestimonialsGrid
    ├── Sur desktop : CSS grid 3 colonnes
    └── Sur mobile : flex scroll horizontal snap
```

**Détection source vidéo** :
```ts
function getVideoType(url: string): 'youtube' | 'instagram' | 'native' {
  if (url.includes('youtube') || url.includes('youtu.be')) return 'youtube'
  if (url.includes('instagram')) return 'instagram'
  return 'native' // Supabase Storage URL
}
```

- YouTube → `<iframe src="https://www.youtube.com/embed/VIDEO_ID" />`
- Instagram → lien vers le post (pas d'embed direct possible sans API)
- Native → `<video src={url} controls />`

Pour Instagram : afficher une miniature cliquable qui ouvre le lien dans un nouvel onglet (Instagram bloque les iframes).

## Interface Admin

**Route** : `/admin/testimonials`

### Liste
- Tableau avec colonnes : Type (badge text/vidéo), Auteur, Note (étoiles), Visible (toggle), Featured (étoile), Ordre (flèches ↑↓)
- Actions par ligne : Modifier, Supprimer (avec confirmation)
- Bouton "Ajouter un témoignage"

### Formulaire Ajouter/Modifier (modal ou page dédiée)
- Champ **Type** : radio "Avis texte" / "Vidéo témoignage" → change les champs affichés
- **Commun** : Auteur*, Rôle, Note (1-5 étoiles cliquables), Visible, Ordre
- **Si texte** : champ Texte (textarea)*
- **Si vidéo** : 
  - Champ URL (YouTube, Instagram, TikTok)
  - **OU** Upload fichier (accept="video/*") → Supabase Storage bucket `testimonials`
  - Checkbox "Mettre en vedette" → si cochée, retire `is_featured` de tous les autres automatiquement
  - Champ Texte optionnel (description courte sous la vidéo)

### Gestion du "Featured"
- Un clic sur l'étoile dans le tableau bascule `is_featured = true` pour ce témoignage et `false` pour tous les autres (UPDATE en une transaction).
- Seuls les témoignages `type = 'video'` peuvent être mis en vedette.

## Supabase Storage

- Bucket : `testimonials` (public)
- Chemins : `testimonials/{testimonial_id}/{filename}`
- Taille max recommandée : 50 MB (vidéos courtes de 1-2 min)
- RLS : lecture publique, écriture pour admins authentifiés uniquement

## États d'erreur

- Supabase indisponible → affiche les 4 avis hardcodés en fallback (constante dans le composant)
- Vidéo YouTube inaccessible → message "Vidéo temporairement indisponible" avec lien vers Instagram
- Upload échoué → toast d'erreur avec message détaillé, fichier local non perdu

## Hors périmètre

- Modération des avis (pas de système de soumission publique)
- Notifications par email lors d'un nouvel avis (pas de flow d'ajout public)
- Sous-titres vidéo automatiques
