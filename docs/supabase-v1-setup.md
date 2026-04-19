# Supabase V1 Setup

## 1. Creer le projet

1. Ouvrir le dashboard Supabase.
2. Creer un nouveau projet.
3. Recuperer:
   - Project URL
   - Publishable key
   - Service role key

## 2. Configurer Auth

1. Aller dans `Authentication`.
2. Activer `Email + Password`.
3. Configurer l'URL de redirection de confirmation:
   - `http://localhost:3000/auth/callback`
   - `https://ton-domaine-vercel/auth/callback`

## 3. Creer les buckets Storage

Creer manuellement ces buckets dans `Storage`:

- `candidate-cv` prive
- `candidate-documents` prive
- `brand-assets` public

Reglages recommandes:

- CV: PDF, DOC, DOCX
- Documents: PDF, JPG, PNG
- Taille max a definir selon ton besoin RH

## 4. Executer le SQL

Ordre recommande dans le SQL Editor:

1. `supabase/schema-v1.sql`
2. `supabase/policies-v1.sql`
3. `supabase/storage-policies-v1.sql`
4. `supabase/role-assignments-v1.sql`

## 5. Brancher les variables locales

Copier `.env.example` vers `.env.local` puis remplir:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 6. Creer les premiers comptes

1. Creer un compte candidat via l'interface du site.
2. Creer les comptes recruteur/admin via l'interface ou le dashboard Auth.
3. Executer ensuite `supabase/role-assignments-v1.sql` en adaptant les emails.

## 7. Verifier le fonctionnement

1. Candidat:
   - inscription
   - connexion
   - acces au dashboard candidat
2. Recruteur:
   - connexion
   - acces au dashboard recruteur
3. Admin:
   - connexion
   - acces au dashboard admin
