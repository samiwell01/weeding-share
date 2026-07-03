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
- `SUPABASE_S3_ACCESS_KEY` = `<your-s3-access-key>`
- `SUPABASE_S3_SECRET_KEY` = `<your-s3-secret-key>`
- `SUPABASE_S3_REGION` = `<your-s3-region>` (ex: `eu-west-1`)
- `SUPABASE_S3_ENDPOINT` = `https://<your-project>.supabase.co/storage/v1/s3`
- `VITE_SUPABASE_URL` = `https://<your-project>.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = `<your-anon-key>` (Supabase Dashboard > Settings > API > anon public)
- `VITE_API_URL` = `https://<your-render-app>.onrender.com`

> Important : utilisez la **service role key** fournie par Supabase et non la clé publique `anon`. La clé publique ne peut pas écrire sur des tables protégées par la row-level security.

> Le bucket reste **privé**. Les fichiers sont accessibles via des signed URLs générées par le backend avec la service role key.

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

## Configuration Google OAuth (Supabase)

Les mariés et les invités se connectent avec Google via Supabase Auth.

### 1. Activer Google OAuth dans Supabase

1. Aller sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Ouvrir ton projet
3. Aller dans **Authentication** > **Providers**
4. Trouver **Google** et cliquer pour l'activer
5. Tu auras besoin d'un **Client ID** et **Client Secret** Google

### 2. Créer les credentials Google OAuth

1. Aller sur [https://console.cloud.google.com](https://console.cloud.google.com)
2. Créer un projet ou sélectionner un existant
3. Aller dans **APIs & Services** > **Credentials**
4. Cliquer **Create Credentials** > **OAuth 2.0 Client IDs**
5. Application type : **Web application**
6. Authorized redirect URIs — ajouter :
   - `https://<your-project>.supabase.co/auth/v1/callback`
7. Copier le **Client ID** et **Client Secret**

### 3. Configurer dans Supabase

1. Retourner dans Supabase > **Authentication** > **Providers** > **Google**
2. Coller le **Client ID** et **Client Secret**
3. Dans **Redirect URLs** (Supabase > Authentication > URL Configuration), ajouter :
   - `https://<your-render-app>.onrender.com/auth/callback`
4. Sauvegarder

### 4. Mettre à jour le schéma SQL

1. Aller dans Supabase > **SQL Editor**
2. Copier le contenu de `supabase/schema.sql`
3. Exécuter le script

## Configuration Supabase Storage (bucket privé)

Le bucket reste **privé**, pas besoin de le rendre public. Le backend génère des signed URLs avec la service role key.

### Récupérer les clés S3 Supabase

1. Aller sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Ouvrir ton projet
3. Aller dans **Storage** (menu gauche)
4. Cliquer sur **S3 Access Keys** (en haut à droite de la page Storage)
5. Cliquer sur **New access key**
6. Copier :
   - `Access Key ID` → c'est ton `SUPABASE_S3_ACCESS_KEY`
   - `Secret Access Key` → c'est ton `SUPABASE_S3_SECRET_KEY`
7. La région et l'endpoint sont visibles sur cette même page :
   - `Region` → ex: `eu-west-1`
   - `Endpoint` → ex: `https://<project-ref>.supabase.co/storage/v1/s3`

### Vérifier que le bucket existe

1. Aller dans **Storage** > **Buckets**
2. Vérifier que le bucket `wedding-media` existe
3. S'il n'existe pas, cliquer sur **New bucket**, nommer `wedding-media`, laisser **privé** (ne pas cocher public)

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
