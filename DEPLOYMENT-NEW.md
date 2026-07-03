# Déploiement sur Render

Ce projet est préparé pour être déployé directement sur Render en tant que **service unique fusionné**.

## Architecture

Le frontend et le backend sont fusionnés dans un seul service Node.js :
- Backend Express sert les APIs (`/join-event`, `/upload`, `/my-media`, etc.)
- Backend Express sert également les fichiers statiques du frontend compilé
- Une seule URL publique pour tout

## Étapes de déploiement

### 1. Vérifier le dépôt GitHub
- ✅ Dépôt : `https://github.com/samiwell01/weeding-share`
- ✅ Code poussé et à jour

### 2. Se connecter à Render
- Aller sur https://render.com
- Se connecter ou créer un compte
- Cliquer sur **"New +"**

### 3. Créer un Web Service
- Cliquer sur **"Web Service"**
- Sélectionner **"Deploy an existing repository"**
- Choisir le dépôt `weeding-share`
- Cliquer sur **"Connect"**

### 4. Configurer le Web Service

| Paramètre | Valeur |
|-----------|--------|
| **Name** | `wedding-share` |
| **Region** | Choisir la région la plus proche |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `npm install --prefix backend && npm install --prefix frontend --include=dev && npm run build --prefix frontend` |
| **Start Command** | `npm start --prefix backend` |

### 5. Variables d'environnement
Ajouter dans la section "Environment" :
- `NODE_ENV` = `production`
- `SUPABASE_URL` = `https://<your-project>.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` = `<your-service-role-key>`
- `SUPABASE_BUCKET_NAME` = `wedding-media`

### 6. Lancer le déploiement
- Cliquer sur **"Create Web Service"**
- Attendre le build et le déploiement (2-3 minutes)
- Render génère automatiquement une URL publique : `https://wedding-share-xxx.onrender.com`

## Vérification après déploiement

1. Ouvrir l'URL publique générée par Render
2. Vérifier que la page Wedding Share s'affiche correctement
3. Tester le flux complet :
   - Entrer le code : `MARIAGE2026`
   - Entrer prénom : `Jean`
   - Entrer nom : `Rakoto`
   - Cliquer sur **"Entrer"**
   - Vérifier l'affichage : `"Bienvenue Jean 👋"`
4. Tester l'upload d'un fichier
5. Vérifier que le fichier apparaît dans **"Mes souvenirs"**
6. Tester la suppression du fichier

## Troubleshooting

### ❌ Build échoue
- Vérifier les logs Render (onglet "Logs")
- Vérifier que les fichiers `package.json` existent dans `backend/` et `frontend/`
- Vérifier les noms des fichiers et chemins

### ❌ Page blanche au chargement
- Vérifier que le build du frontend Vite a réussi
- Vérifier dans les logs que le chemin `/frontend/dist` est correctement configuré
- Vérifier que le fichier `index.html` est bien généré

### ❌ API ne répond pas (erreur 404)
- Vérifier les logs du backend
- Vérifier que Express écoute bien sur le PORT configuré
- Vérifier que CORS est activé

## Logs et monitoring

Pour déboguer en production :
- Aller sur Render → votre service → onglet **"Logs"**
- Les logs en temps réel s'affichent
- Chercher les erreurs lors du build ou au démarrage
