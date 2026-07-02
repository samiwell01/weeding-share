# Plan d'architecture et de test - Wedding Share

Ce document sert de plan opérationnel pour préparer l'application Wedding Share jusqu'à un état testable directement, avec toutes les briques techniques nécessaires.

## 1. Objectif

Construire un MVP fonctionnel permettant de :
- faire rejoindre un invité à un mariage via un code ;
- uploader des photos, vidéos et messages vocaux ;
- consulter ses propres contenus ;
- permettre aux mariés de voir les invités et leurs médias.

---

## 2. Architecture cible

### Modèle unifié
- Un seul service Node.js sur Render
- Backend Express sert les APIs
- Backend Express sert le frontend compilé
- Une seule URL pour les utilisateurs

### Frontend
- React + Vite
- Interface simple, responsive et pensée mobile first
- Compilé vers `/frontend/dist` au build
- Servi en tant que fichiers statiques par le backend

### Backend
- Node.js + Express
- API REST pour la logique métier
- Gestion des uploads
- Liaison avec la base de données
- Sert aussi les fichiers statiques du frontend

### Base de données
- Supabase PostgreSQL
- Stockage des événements, invités et médias

### Stockage de fichiers
- Supabase Storage
- Photos, vidéos et audios stockés ici

### Déploiement
- Frontend sur Render
- Backend sur Render
- Base de données et stockage Supabase

---

## 3. Services à préparer

### 3.1 Frontend
Objectif : offrir une interface simple et rapide pour les invités et les mariés.

Étapes :
1. Initialiser le projet React + Vite.
2. Ajouter la structure de pages :
   - Login / join event
   - Home invité
   - Upload photo
   - Upload vidéo
   - Enregistrement vocal
   - Mes souvenirs
   - Dashboard mariés
   - Liste des invités
   - Détail d'un invité
3. Mettre en place le routing.
4. Ajouter un state global simple pour stocker :
   - guestId
   - eventId
   - prénom / nom
   - rôle (invité ou marié)
5. Connecter le frontend à l'API backend.
6. Gérer les erreurs d'upload et les messages utilisateur.
7. Tester l'UI sur mobile et desktop.

### 3.2 Backend
Objectif : exposer une API REST simple pour gérer la logique principale.

Étapes :
1. Initialiser un serveur Express.
2. Ajouter les routes principales :
   - POST /join-event
   - POST /upload
   - GET /my-media/:guestId
   - DELETE /media/:id
   - GET /guests
   - GET /guest/:id/media
3. Ajouter la validation des entrées.
4. Gérer les fichiers envoyés via multipart/form-data.
5. Connecter le backend à Supabase.
6. Ajouter la logique de suppression : un invité ne peut supprimer que ses propres médias.
7. Ajouter un endpoint de santé /health pour vérifier le service.
8. Tester chaque endpoint avec des requêtes locales.

### 3.3 Base de données Supabase
Objectif : stocker les données principales de l'application.

Étapes :
1. Créer un projet Supabase.
2. Créer les tables suivantes :
   - events
   - guests
   - media
3. Ajouter les colonnes nécessaires :
   - events: id, name, access_code, created_at
   - guests: id, event_id, first_name, last_name, created_at
   - media: id, guest_id, event_id, type, file_url, created_at
4. Ajouter les index utiles pour les recherches rapides.
5. Configurer les politiques d'accès si nécessaire.
6. Insérer un événement de test.
7. Insérer un ou deux invités de test.
8. Vérifier les requêtes SQL de base.

### 3.4 Stockage Supabase Storage
Objectif : stocker les fichiers multimédias.

Étapes :
1. Créer un bucket nommé par exemple wedding-media.
2. Configurer les permissions d'upload/download.
3. Vérifier que les fichiers sont bien accessibles via une URL publique ou privée selon le besoin.
4. Tester l'upload d'une photo, d'une vidéo et d'un audio.
5. Vérifier que les liens de fichiers sont bien enregistrés dans la table media.

---

## 4. Configuration environnementale

Créer un fichier d'environnement pour chaque service.

### Frontend
Variables attendues :
- VITE_API_URL

### Backend
Variables attendues :
- PORT
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- SUPABASE_BUCKET_NAME

### Déploiement
Ajouter les mêmes variables dans Render pour chaque service.

---

## 5. Checklist de développement par étape

### Étape 1 - Préparation du workspace
- [ ] créer le projet frontend
- [ ] créer le projet backend
- [ ] créer le projet Supabase
- [ ] préparer les variables d'environnement

### Étape 2 - Base de données
- [ ] créer les tables events, guests, media
- [ ] insérer des données seed de test
- [ ] valider les requêtes SQL

### Étape 3 - Stockage de fichiers
- [ ] créer le bucket Supabase Storage
- [ ] configurer les politiques
- [ ] tester l'upload d'un fichier

### Étape 4 - Backend API
- [ ] ajouter la route d'inscription /join-event
- [ ] ajouter la route d'upload /upload
- [ ] ajouter la route de liste /my-media/:guestId
- [ ] ajouter la route de suppression /media/:id
- [ ] ajouter la route /guests
- [ ] ajouter la route /guest/:id/media
- [ ] vérifier la gestion des erreurs

### Étape 5 - Frontend
- [ ] créer la page de connexion
- [ ] créer la page d'accueil invité
- [ ] créer les formulaires d'upload photo/vidéo
- [ ] intégrer l'enregistrement audio
- [ ] créer la liste de ses propres médias
- [ ] créer le dashboard mariés
- [ ] créer la liste des invités
- [ ] créer la vue détail d'un invité

### Étape 6 - Intégration
- [ ] connecter le frontend au backend
- [ ] gérer l'authentification simple via guestId/eventId
- [ ] vérifier la récupération des médias
- [ ] vérifier la suppression limitée aux propres contenus

### Étape 7 - Tests manuels
- [ ] inviter un utilisateur de test
- [ ] uploader une photo
- [ ] uploader une vidéo
- [ ] enregistrer un audio
- [ ] consulter ses médias
- [ ] supprimer un média personnel
- [ ] vérifier que l'invité ne voit pas les contenus des autres
- [ ] vérifier que les mariés voient tous les invités et leurs médias

### Étape 8 - Déploiement
- [ ] déployer le backend sur Render
- [ ] déployer le frontend sur Render
- [ ] connecter les variables d'environnement
- [ ] tester la version déployée

---

## 6. Scénarios de test directs

### Scénario invité
1. Ouvrir l'application.
2. Entrer le code mariage, le prénom et le nom.
3. Vérifier que l'utilisateur accède à l'accueil.
4. Uploader une photo.
5. Uploader une vidéo.
6. Enregistrer un message vocal.
7. Vérifier que les contenus apparaissent dans la liste.
8. Supprimer un contenu personnel.

### Scénario mariés
1. Se connecter avec un compte marié ou un profil de test.
2. Ouvrir la page des invités.
3. Sélectionner un invité.
4. Vérifier l'affichage des photos, vidéos et audios.
5. Vérifier les statistiques du dashboard.

---

## 7. Critères d'acceptation MVP

L'application sera considérée comme prête à tester si :
- l'inscription d'un invité fonctionne ;
- l'upload photo fonctionne ;
- l'upload vidéo fonctionne ;
- l'enregistrement vocal fonctionne ;
- la liste des médias personnels fonctionne ;
- la suppression fonctionne uniquement pour les médias propres ;
- les mariés peuvent voir les invités et leurs contenus ;
- l'application fonctionne en local puis en production.

---

## 8. Recommandation d'ordre de travail

Pour aller vite, l'ordre recommandé est :
1. Supabase database + storage
2. Backend API
3. Frontend pages
4. Intégration frontend/backend
5. Tests manuels
6. Déploiement Render

---

## 9. Résultat attendu

À la fin de cette préparation, l'application devra être prête pour un premier test complet en environnement local, puis en production avec des données réelles de mariage.
