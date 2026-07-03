# Wedding Share - Brief de design

## 1. Contexte général
Wedding Share est une application web événementielle centrée sur un événement unique (mariage, anniversaire, fête, réunion). Elle permet à un organisateur / hôte et à ses invités de partager des photos, des vidéos et des messages vocaux dans un espace dédié.

L'application doit être simple, mobile-friendly, chaleureuse et faciliter l'interaction directe avec l'événement.

## 2. Objectif du design
Créer une interface moderne, claire et conviviale qui :
- valorise l'événement en premier plan
- met en avant l'accès aux uploads depuis chaque page d'événement
- permet à l'organisateur et aux invités de facilement ajouter des médias
- renforce la confiance et l'usage immédiat du service
- garde une navigation minimale et un look harmonieux

## 3. Public cible
### Organisateur / hôte
- Crée et gère l'événement
- Consulte le détail de l'événement
- Consulte les invités et leurs médias
- Upload également des photos, vidéos ou messages vocaux
- Doit pouvoir modifier l'événement
- Doit pouvoir gérer son profil

### Invité
- Rejoint l'événement via un code / lien
- Upload photos et vidéos
- Enregistre et partage des audios
- Consulte ses propres médias
- Ne peut modifier que son propre profil et supprimer ses propres uploads

## 4. Ton et ambiance
- chaleureux, festif et personnel
- moderne, propre et lisible
- usage de couleurs douces avec accents colorés
- typographie simple, bonne hiérarchie visuelle
- iconographie intuitive (photo, vidéo, audio, participants, upload)
- éléments visuels qui évoquent un événement partagé : fleurs, lumière, badges, couvertures de photos

## 5. Écrans principaux à designer
### 5.1 Page d'événements / Accueil
Contenu :
- liste des événements disponibles pour l'utilisateur
- vignette de chaque événement avec nom, date, catégorie, image de couverture
- actions rapides : ouvrir l'événement, créer un nouvel événement, rejoindre par code
- recherche / filtre simple si plusieurs événements existent

### 5.2 Page détail de l'événement
Contenu :
- grande image de couverture ou bloc visuel de l'événement
- titre, description, catégorie, date, lieu
- boutons d'action visibles :
  - `Mes médias`
  - `Ajouter` (upload photo/video/audio)
  - `Participants`
  - `Modifier` (pour l'organisateur)
- statut ou résumé rapide du nombre de médias et participants

### 5.3 Page d'upload
Contenu :
- sélection du type de média : photo / vidéo / audio
- interface d'upload de fichiers pour photo et vidéo
- interface d'enregistrement vocal intégrée pour audio
- aperçu des fichiers sélectionnés
- bouton clair `Uploader`
- message d'erreur / de succès
- indication de l'événement ciblé pour l'upload

### 5.4 Page `Mes médias`
Contenu :
- grille ou liste des médias uploadés par l'utilisateur
- miniatures photo / vidéo / audio
- contrôle de lecture audio intégré
- suppression possible pour chaque média
- bouton `Ajouter` vers la page d'upload
- états vides et retour visuel lorsque l'utilisateur n'a aucun média

### 5.5 Page profil utilisateur
Contenu :
- avatar ou initiales
- nom, email, téléphone
- formulaire de modification du profil
- bouton `Déconnexion`
- feedback de sauvegarde

### 5.6 Page des participants / invités
Contenu :
- liste d'invités
- recherche simple parmi les noms
- accès au détail de chaque invité
- pour l'organisateur : vue des médias d'un invité spécifique

## 6. Composants et interactions spécifiques
- **Card événement** : image de couverture, titre, catégorie, date, bouton action
- **Hero événement** : grande bannière avec actions principales
- **Upload card** : switch entre photo / vidéo / audio
- **Audio recorder** : bouton démarrer/arrêter, status visuel, mini-enregistrement
- **Media grid** : affichage adaptatif avec photo, vidéo, audio
- **Navigation minimale** : événements, profil, éventuellement actions principales
- **Feedback utilisateur** : messages de confirmation, erreurs, chargement

## 7. Priorités UX
1. `Upload` doit être accessible directement depuis la page événementielle.
2. L'utilisateur doit voir clairement s'il est connecté en tant qu'organisateur ou invité.
3. Les types de médias doivent être traités comme des actions distinctes, mais dans un même flux.
4. La page profil reste le seul endroit où se trouve le bouton `Déconnexion`.
5. L'organisateur doit pouvoir modifier l'événement et uploader sans friction.
6. Le flux d'enregistrement audio doit être intuitif et rassurant.

## 8. Directives pour le design IA
- Créer un style épuré, pas trop chargé
- Privilégier les espaces blancs, les cartes et les boutons doux
- Préférer une palette pastel avec un accent festif (rose, beige, doré, vert léger)
- Utiliser des illustrations ou icônes fines pour photo / vidéo / audio
- Proposer une version mobile-first et responsive
- Mettre en avant l’événement comme point de focus visuel
- Prévoir une interface accessible : boutons larges, contrastes suffisants, textes lisibles

## 9. Contenu utile pour le designer
- App name : `Wedding Share`
- But principal : partager souvenirs multimédias autour d’un événement
- Actions clés : rejoindre un événement, uploader une photo/vidéo/audio, consulter ses médias, modifier l’événement
- Utilisateurs : organisateur/hôte + invités
- Palette attendue : chaleureux, festif, simple
- Navigation : `Événements`, `Profil`, boutons d’upload, boutons de retour

## 10. Résumé fonctionnel
Wedding Share est une appli événementielle centrée sur l’expérience multimédia partagée.
Elle doit offrir un accès rapide à la création d’événement, à l’ajout de contenu et à la consultation des médias.
Le design doit refléter l'idée d'un moment collectif, chaleureux et facile à utiliser pour tout type d'invité.
