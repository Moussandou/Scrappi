# Scrappi 📖🎨

Une application moderne et artistique de création de "scrapbooks" (carnets de collages) numériques, conçue avec une esthétique premium de papier texturé et une expérience utilisateur fluide.

## ✨ Caractéristiques

- **Éditeur de Canvas Artistique** : Glissez-déposez des images, du texte et des éléments décoratifs.
- **Esthétique Premium** : Design minimaliste basé sur des textures de papier, des ombres douces et une typographie soignée.
- **Gestion Multi-Support** : Mode Cloud (Firebase) pour la synchronisation ou mode Local pour la rapidité.
- **Authentification Hybride** : Connexion via Google (Redirect) ou par Email/Mot de passe.
- **Profil Utilisateur** : Gestion des informations personnelles et suppression sécurisée des données.
- **Responsive Design** : Optimisé pour PC, tablettes et mobiles avec gestes tactiles (zoom/pan).

## 🚀 Technologies

- **Frontend** : Next.js 15+ (App Router), React 19, Tailwind CSS.
- **Graphismes** : Konva.js / React-Konva pour le rendu du canvas.
- **Backend / Infrastructure** : Firebase (Auth, Firestore, Storage, Hosting).
- **Images** : Intégration API Pixabay pour la recherche d'images.
- **Qualité** : TypeScript, ESLint, Vitest.

## 🛠 Installation et Configuration

### 1. Prérequis
- Node.js 18+
- Un projet Firebase configuré

### 2. Installation
```bash
npm install
```

### 3. Variables d'Environnement
Créez un fichier `.env.local` à la racine et remplissez les valeurs suivantes :
```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_PIXABAY_API_KEY=...
NEXT_PUBLIC_GOOGLE_FONTS_API_KEY=...
```

### 4. Lancement
```bash
# Mode développement
npm run dev

# Construction production
npm run build
```

## 📦 Déploiement

Le projet est configuré pour un déploiement automatique sur **Firebase Hosting** via GitHub Actions lors d'un push sur la branche `main`.

Commandes manuelles (si besoin) :
```bash
firebase deploy
```

## 📜 Licence
Privé - Tous droits réservés.
