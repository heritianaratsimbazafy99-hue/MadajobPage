# Madajob Phase 3 V1 Blueprint

## Objectif

Construire une V1 solide, rapide a deployer sur Vercel, avec une architecture evolutive basee sur Next.js et Supabase.

La V1 couvre trois roles seulement:

- candidat
- recruteur
- admin

Le reste est volontairement reporte:

- consultant_rh dedie
- parsing PDF avance
- scoring IA
- recherche semantique complete
- recommandations de profils
- notifications avancees
- audit complet de niveau enterprise

## Stack cible

- Frontend: Next.js App Router + TypeScript
- Hosting: Vercel
- Auth: Supabase Auth
- Base de donnees: Supabase PostgreSQL
- Fichiers: Supabase Storage
- Permissions: Supabase RLS
- Emails: Resend ou Brevo plus tard

## Espaces produits

### 1. Site public

- pages marketing Madajob
- pages offres publiques
- detail d'offre
- tunnel de candidature

### 2. Espace candidat

- creation de compte
- edition du profil
- upload du CV
- gestion des candidatures
- suivi des statuts

### 3. Espace recruteur

- creation et gestion de ses offres
- consultation des candidatures de ses offres
- pipeline simple
- shortlist et annotations visibles selon permissions

### 4. Espace admin

- vue transverse
- gestion des comptes
- moderation des offres
- moderation des candidatures
- exports
- historique minimum sur actions sensibles

## Principes de permissions

### Candidat

- peut voir et modifier son propre profil
- peut uploader ses documents
- peut postuler
- peut voir ses propres candidatures
- ne voit jamais les notes internes

### Recruteur

- peut creer et modifier ses offres
- peut voir les candidatures reliees a ses offres
- ne voit pas toute la base candidats
- ne peut pas voir les notes admin privees

### Admin

- voit l'ensemble des offres
- voit l'ensemble des candidatures
- peut moderer les comptes et les contenus
- peut executer des exports
- toute action sensible devra etre journalisee

## Modele de donnees V1

### Tables coeur

- `profiles`
- `organizations`
- `job_posts`
- `candidate_profiles`
- `candidate_documents`
- `applications`
- `application_status_history`
- `internal_notes`
- `audit_events`

### Choix de modelisation

- Une colonne `organization_id` est conservee des la V1.
- Madajob pourra commencer avec une seule organisation interne.
- Les recruteurs externes peuvent etre rattaches a une organisation cliente.
- Le modele reste simple sans aller jusqu'a un systeme complet de multi-membres multi-scopes.

## Routes recommandees

### Marketing

- `/`
- `/candidats`
- `/recruteurs`
- `/carrieres`
- `/carrieres/[slug]`

### Auth

- `/connexion`
- `/inscription`
- `/mot-de-passe-oublie`

### App privee

- `/app/candidat`
- `/app/candidat/profil`
- `/app/candidat/candidatures`
- `/app/recruteur`
- `/app/recruteur/offres`
- `/app/recruteur/offres/[id]`
- `/app/recruteur/candidatures`
- `/app/admin`
- `/app/admin/offres`
- `/app/admin/candidatures`
- `/app/admin/utilisateurs`
- `/app/admin/exports`

## Dashboards V1

### Dashboard candidat

- resume du profil
- CV principal
- candidatures recentes
- statuts en cours
- suggestions d'offres simples plus tard

### Dashboard recruteur

- nombre d'offres actives
- candidatures recues
- pipeline par offre
- acces rapide aux brouillons et publications

### Dashboard admin

- supervision globale
- nouveaux candidats
- nouvelles offres
- offres a moderer
- candidatures recentes
- exports

## CV et documents

### V1

- upload propre dans Supabase Storage
- un CV principal par candidat
- extraction simple ou semi-automatique
- correction humaine dans le profil

### V2 plus tard

- parsing PDF avance
- enrichissement de competences
- recherche semantique
- scoring

## Image et performance

### Strategie recommandee

- utiliser `next/image` sur toutes les images du site public
- servir des formats modernes comme WebP via l'optimisation Next.js
- lazy loading partout sauf pour l'image hero critique
- utiliser `preload` uniquement pour les images LCP
- compresser les assets a la source avant upload
- stocker les visuels dynamiques dans Supabase Storage si necessaire
- conserver les dashboards prives hors cache public

### Regles pratiques

- logos partenaires: versions nettoyees et compressees
- hero public: image optimisee, pas de poids inutile
- avatars et documents: buckets dedies
- pas de bibliotheques UI lourdes inutiles en V1

## Buckets proposes

- `candidate-cv` prive
- `candidate-documents` prive
- `brand-assets` public ou prive selon besoin
- `exports-private` prive

## Audit minimum V1

Journaliser au minimum:

- creation ou suppression d'offre
- changement de statut de candidature
- export candidats ou candidatures
- changement de role utilisateur

## Roadmap de build

### Etape 1

- bootstrap Next.js
- configuration Supabase SSR
- structure App Router
- design system V1

### Etape 2

- schema SQL
- buckets storage
- policies RLS
- creation des profils a l'inscription

### Etape 3

- portail public offres
- details d'offre
- formulaire de candidature

### Etape 4

- dashboard candidat
- profil
- upload CV
- suivi des candidatures

### Etape 5

- dashboard recruteur
- CRUD offres
- listing candidatures
- pipeline simple

### Etape 6

- dashboard admin
- moderation
- exports
- audit minimum

## Decisions produit deja tranchees

- V1 simple avec trois roles
- pas de consultant RH dedie au lancement
- pas d'IA lourde au lancement
- pas de parsing intelligent partout au lancement
- architecture preparee pour evoluer sans recasser le socle

## Sources officielles a suivre pendant l'implementation

- Supabase Auth avec Next.js: https://supabase.com/docs/guides/auth/quickstarts/nextjs
- Supabase SSR pour Next.js: https://supabase.com/docs/guides/auth/server-side/nextjs
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Storage: https://supabase.com/docs/guides/storage
- Supabase Storage access control: https://supabase.com/docs/guides/storage/security/access-control
- Next.js Image optimization: https://nextjs.org/docs/app/getting-started/images
- Next.js Image component: https://nextjs.org/docs/app/api-reference/components/image
