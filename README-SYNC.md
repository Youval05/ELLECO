# Guide de synchronisation multi-appareils pour Base Parfaite

Ce guide explique comment configurer et utiliser l'application Base Parfaite sur plusieurs appareils avec une synchronisation en temps réel des données.

## Configuration pour la synchronisation

L'application utilise Firebase Firestore pour synchroniser les données entre tous vos appareils. Voici comment cela fonctionne :

1. **En mode développement local** :
   - Par défaut, l'application utilise un émulateur Firestore local
   - Les données ne sont pas partagées entre les appareils

2. **En mode production** :
   - L'application se connecte à la base de données Firestore en ligne
   - Tous les appareils partagent les mêmes données en temps réel

## Déploiement pour utilisation sur iPhone et autres appareils

Pour utiliser l'application sur plusieurs appareils avec synchronisation :

1. **Construire l'application en mode production** :
   ```
   npm run deploy-prod
   ```
   
   Cette commande :
   - Crée un fichier `.env.production` si nécessaire
   - Construit l'application en mode production
   - Démarre l'application en mode production

2. **Accéder à l'application depuis votre iPhone** :
   - Ouvrez Safari sur votre iPhone
   - Accédez à l'URL de votre application déployée
   - Pour une utilisation locale, utilisez l'adresse IP de votre ordinateur (ex: http://192.168.1.100:3000)
   - Pour une utilisation en ligne, déployez sur Vercel ou Netlify

3. **Ajouter à l'écran d'accueil** :
   - Dans Safari, appuyez sur l'icône de partage
   - Sélectionnez "Sur l'écran d'accueil"
   - Donnez un nom à l'application et appuyez sur "Ajouter"

## Fonctionnalités de synchronisation

- **Indicateur de statut** : Un indicateur dans le coin inférieur droit montre l'état de la connexion
- **Reconnexion manuelle** : Si la connexion est perdue, vous pouvez appuyer sur le bouton de reconnexion
- **Mises à jour en temps réel** : Les modifications effectuées sur un appareil sont automatiquement visibles sur tous les autres

## Dépannage

Si vous rencontrez des problèmes de synchronisation :

1. **Vérifiez votre connexion Internet** sur tous les appareils
2. **Assurez-vous d'utiliser la version production** de l'application
3. **Vérifiez l'indicateur de statut** pour voir l'état de la connexion
4. **Redémarrez l'application** si nécessaire

Pour toute assistance supplémentaire, contactez le support technique.
