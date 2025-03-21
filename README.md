# Base Parfaite PWA

Application de gestion de commandes et de livraisons avec fonctionnalités d'archivage intelligent.

## Fonctionnalités

- Gestion des commandes pour les commerciaux et préparateurs
- Suivi des statuts de commandes (à planifier, planifiée, livrée)
- Archivage des commandes
- Nettoyage intelligent des archives (30 jours, 90 jours, 1 an)
- Interface utilisateur responsive et moderne

## Technologies utilisées

- Next.js 14
- React
- TypeScript
- Firebase/Firestore
- Tailwind CSS
- Zustand (gestion d'état)

## Installation

```bash
# Installer les dépendances
npm install

# Lancer l'application en mode développement
npm run dev

# Construire l'application pour la production
npm run build

# Lancer l'application en mode production
npm start
```

## Structure du projet

- `/src/app` - Pages de l'application (App Router)
- `/src/pages` - Pages de l'application (Pages Router)
- `/src/components` - Composants réutilisables
- `/src/store` - Gestion de l'état avec Zustand
- `/src/types` - Types TypeScript
- `/src/config` - Configuration Firebase

## Authentification

L'application utilise une authentification simplifiée basée sur la sélection d'un profil (préparateur ou commercial) et d'un utilisateur.

## Gestion des archives

Les commandes peuvent être archivées et consultées dans une page dédiée. Le nettoyage intelligent permet de supprimer automatiquement les archives selon différents critères temporels.

## Synchronisation multi-appareils

L'application est conçue pour fonctionner sur plusieurs appareils avec une synchronisation en temps réel :

### Configuration pour la production

1. Créez un projet Firebase sur [console.firebase.google.com](https://console.firebase.google.com)
2. Activez Firestore dans votre projet Firebase
3. Copiez le fichier `.env.local.example` vers `.env.local` et mettez à jour les variables avec vos identifiants Firebase
4. Déployez l'application sur un service d'hébergement (Vercel, Netlify, etc.)

### Fonctionnalités de synchronisation

- **Synchronisation en temps réel** : Les modifications sont immédiatement propagées à tous les appareils connectés
- **Indicateur de statut** : Un indicateur en bas à droite de l'écran affiche l'état de la connexion
- **Reconnexion automatique** : En cas de perte de connexion, l'application tente de se reconnecter automatiquement
- **Mode hors ligne** : Les données sont mises en cache localement pour permettre une utilisation hors ligne (fonctionnalité limitée)

### Résolution des problèmes de synchronisation

Si vous rencontrez des problèmes de synchronisation :

1. Vérifiez votre connexion internet
2. Cliquez sur le bouton "Reconnecter" dans l'indicateur de statut
3. Rechargez l'application si les problèmes persistent
4. Assurez-vous que les règles de sécurité Firestore permettent l'accès à vos données
