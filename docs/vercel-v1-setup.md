# Vercel V1 Setup

## 1. Pousser le code

```bash
git add .
git commit -m "Base Next.js et Supabase pour la phase 3"
git push
```

## 2. Importer le repo dans Vercel

1. Ouvrir Vercel.
2. Cliquer sur `Add New Project`.
3. Selectionner le repository `MadajobPage`.
4. Vercel detectera automatiquement `Next.js`.
5. Si le projet existait deja en version statique:
   - ouvrir `Settings > Build & Development Settings`
   - verifier `Framework Preset = Next.js`
   - vider `Output Directory` si `public` ou une autre ancienne valeur est encore presente
   - laisser Vercel gerer automatiquement la sortie du build Next.js

## 3. Ajouter les variables d'environnement

Ajouter dans `Project Settings > Environment Variables`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 4. Ajouter les URLs dans Supabase

Dans `Authentication > URL Configuration`, ajouter:

- `http://localhost:3000`
- `https://madajob-page.vercel.app`
- le domaine custom final quand il sera pret
- `https://madajob-page.vercel.app/auth/callback`

## 5. Redeployer

Apres ajout des variables:

1. Lancer un redeploiement Vercel.
2. Verifier:
   - accueil
   - `/connexion`
   - `/inscription`
   - `/carrieres`
   - `/app/*`

## 6. En cas d'erreur "No Output Directory named public"

Cette erreur signifie en general que le projet Vercel garde encore la configuration de l'ancienne version HTML statique.

Correction:

1. Aller dans `Project Settings > Build & Development Settings`
2. Mettre `Framework Preset` sur `Next.js`
3. Effacer `Output Directory` si `public` est renseigne
4. Sauvegarder
5. Redeployer

Le fichier `vercel.json` du repo force maintenant aussi `framework = nextjs`.
