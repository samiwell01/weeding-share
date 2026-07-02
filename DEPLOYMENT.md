# Déploiement sur Render

Ce projet est maintenant préparé pour être déployé directement sur Render sans installation locale.

## Étapes

1. Initialiser un dépôt Git si ce n’est pas déjà fait.
2. Ajouter tous les fichiers et faire un commit.
3. Pousser vers GitHub.
4. Sur Render, choisir "New" puis "Blueprint / Import from Git".
5. Sélectionner le dépôt GitHub.
6. Render lira automatiquement le fichier render.yaml.
7. Déployer le backend et le frontend.

## Configuration attendue

- Backend : service web Node.js
- Frontend : service web statique Vite
- Variable d’environnement frontend : VITE_API_URL = URL publique du backend Render

## Vérification

Après déploiement :
- ouvrir l’URL du frontend ;
- vérifier la page de test ;
- tester le flux de connexion et d’upload.
