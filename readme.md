# Wedding Share

Application web simple et rapide dédiée à un mariage, permettant aux invités de partager leurs photos, vidéos et messages vocaux, tout en donnant aux mariés un espace de consultation clair et organisé.

## Objectif

Permettre aux invités du mariage de :
- s'identifier avec leur nom et prénom ;
- entrer un code d'accès de l'événement ;
- envoyer des photos ;
- envoyer des vidéos ;
- enregistrer un message vocal ;
- supprimer uniquement leurs propres contenus.

Permettre aux mariés de :
- voir tous les invités ;
- consulter les médias envoyés par chaque invité ;
- écouter les messages vocaux.

## Fonctionnalités principales

### Pour les invités
- Connexion avec un code mariage, un prénom et un nom ;
- Accueil simple avec accès rapide aux actions de partage ;
- Upload de photos et de vidéos ;
- Enregistrement et envoi de messages vocaux ;
- Consultation de ses propres contenus ;
- Suppression de ses propres fichiers uniquement.

### Pour les mariés
- Tableau de bord avec statistiques globales ;
- Liste des invités ;
- Vue détaillée d'un invité ;
- Consultation des photos, vidéos et messages vocaux de chaque invité.

## Parcours utilisateur

### 1. Connexion
L'utilisateur entre :
- le code du mariage ;
- son nom ;
- son prénom.

Après validation, il accède à l'accueil principal.

### 2. Accueil invité
L'interface propose :
- ajouter une photo ;
- ajouter une vidéo ;
- enregistrer un message vocal ;
- consulter ses souvenirs.

### 3. Upload photo
Processus simple :
1. choisir une photo ;
2. uploader ;
3. confirmer la fin du traitement.

### 4. Upload vidéo
Même logique que pour les photos.

### 5. Message vocal
L'utilisateur peut :
1. démarrer l'enregistrement ;
2. arrêter l'enregistrement ;
3. envoyer le message vocal.

## Espace mariés

### Dashboard
Le tableau de bord affiche :
- nombre d'invités ;
- nombre de photos ;
- nombre de vidéos ;
- nombre de messages audio.

### Liste des invités
Les mariés peuvent voir la liste de tous les invités et ouvrir le profil d'un invité pour consulter ses médias.

## Modèle de données simplifié

### Table events
- id
- name
- access_code
- created_at

### Table guests
- id
- event_id
- first_name
- last_name
- created_at

### Table media
- id
- guest_id
- event_id
- type (photo, video, audio)
- file_url
- created_at

## Architecture technique

### Frontend
- React + Vite
- PWA compatible

Pourquoi ce choix :
- développement rapide ;
- interface simple et moderne ;
- expérience proche d'une application mobile.

### Backend
- Node.js + Express

Pourquoi ce choix :
- solution légère ;
- simple à maintenir ;
- suffisante pour le MVP.

### Base de données
- Supabase PostgreSQL

### Stockage de fichiers
- Supabase Storage

Ce choix permet de stocker efficacement :
- photos ;
- vidéos ;
- fichiers audio.

## Déploiement

Tout est déployé en tant qu'**un seul service Node.js** sur Render :

```
Render Web Service (wedding-share)
├── Backend Express (APIs)
├── Frontend Vite compilé (fichiers statiques)
└── Une seule URL publique
```

**Pour déployer** : voir [DEPLOYMENT.md](DEPLOYMENT-NEW.md)

## API MVP

### Rejoindre un événement
- POST /join-event

Body attendu :
```json
{
  "code": "MARIAGE2026",
  "firstName": "Jean",
  "lastName": "Rakoto"
}
```

### Upload média
- POST /upload

### Lister mes médias
- GET /my-media/:guestId

### Supprimer un média
- DELETE /media/:id

### Lister les invités
- GET /guests

## MVP final

### Invité
- [x] Entrer un code mariage
- [x] Saisir son nom et prénom
- [x] Uploader une photo
- [x] Uploader une vidéo
- [x] Enregistrer un message vocal
- [x] Voir ses uploads
- [x] Supprimer ses uploads

### Mariés
- [x] Voir tous les invités
- [x] Ouvrir un invité
- [x] Voir ses photos
- [x] Voir ses vidéos
- [x] Écouter ses messages vocaux
- [x] Consulter un dashboard simple avec statistiques

## Notes de développement

Cette version peut être développée rapidement avec React, Vite, Express, Supabase et Render, sans authentification complexe, sans WebSocket, sans cache avancé et sans architecture trop lourde.
