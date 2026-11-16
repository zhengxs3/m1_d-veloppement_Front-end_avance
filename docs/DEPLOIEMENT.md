# Déploiement et remise du projet

## 1. Publier le backend PHP

Choisir un hébergement avec PHP 8.2 ou supérieur, Composer, `pdo_sqlite`, `mbstring` et un disque persistant. Le backend utilise les composants Symfony 7.4, sans FrameworkBundle ni Doctrine.

1. Installer les dépendances avec `composer --working-dir=backend install --no-dev --optimize-autoloader`.
2. Configurer la racine Web sur `backend/public`. Transmettre les requêtes à `index.php`.
3. Définir `FRONTEND_ORIGINS=https://votre-site.vercel.app`. Plusieurs origines peuvent être séparées par des virgules.
4. Définir éventuellement `POKEDEX_DATABASE_PATH` avec un chemin SQLite absolu sur le disque persistant. Par défaut : `backend/var/pokedex.sqlite`.
5. Autoriser le processus PHP à écrire dans le dossier de la base.
6. Vérifier `https://votre-backend.example/api/health` : réponse attendue `{"status":"ok"}`.

Le serveur PHP intégré convient au développement ; utiliser la configuration Web de l’hébergement en production. Ne pas exposer la base ou `vendor` comme racine publique.

## 2. Préparer Vercel

Importer le dépôt GitHub. Utiliser la racine du dépôt, le framework Vite, la commande `npm run build` et la sortie `build`.

Dans les variables d’environnement Vercel de production, définir :

```text
VITE_CUSTOM_API_URL=https://votre-backend.example/api
```

Cette valeur est intégrée au JavaScript lors du build. Après modification, reconstruire et redéployer le frontend. Les variables `VITE_` sont publiques : ne jamais y placer de secret.

## 3. Activer la livraison continue après les tests

Le workflow `.github/workflows/ci.yml` contient un job `deploy` dépendant des jobs `frontend` et `backend`. Seuls les push sur la branche de production peuvent déployer ; les pull requests exécutent les vérifications.

Dans les paramètres GitHub du dépôt, sous **Secrets and variables → Actions**, ajouter :

| Type     | Nom                 | Valeur                                                                        |
| -------- | ------------------- | ----------------------------------------------------------------------------- |
| Secret   | `VERCEL_TOKEN`      | Jeton Vercel autorisé à déployer le projet.                                   |
| Secret   | `VERCEL_ORG_ID`     | Identifiant du compte ou de l’équipe Vercel.                                  |
| Secret   | `VERCEL_PROJECT_ID` | Identifiant du projet Vercel.                                                 |
| Variable | `DEPLOY_ENABLED`    | `true` pour activer le déploiement.                                           |
| Variable | `PRODUCTION_BRANCH` | Branche publiée, par exemple `Pokedex` ou `main`. Valeur par défaut : `main`. |

Les identifiants du projet sont disponibles dans les paramètres Vercel ou `.vercel/project.json` après `vercel link`. Ne pas versionner les jetons.

Le job récupère les paramètres de production, construit avec `vercel build --prod`, puis publie avec `vercel deploy --prebuilt --prod`, selon la [documentation officielle Vercel](https://vercel.com/kb/guide/how-can-i-use-github-actions-with-vercel).

L’intégration Git native Vercel peut publier indépendamment de GitHub Actions. Pour une livraison exclusivement contrôlée par cette pipeline, désactiver les déploiements Git automatiques du projet Vercel. Le backend est déployé séparément : ce workflow teste son code sans publier le serveur PHP.

## 4. Vérifier la remise

- Ouvrir `/`, `/add` et `/poke/1` directement depuis leur URL publique.
- Vérifier la pagination et le retour depuis une fiche.
- Envoyer une création et vérifier la réponse POST 201.
- Recharger et vérifier que la création existe toujours.
- Vérifier les réponses CORS pour l’origine exacte du frontend.
- Confirmer que les jobs GitHub Actions sont verts et que le déploiement n’est pas ignoré.
- Renseigner le frontend, le backend et le nom de l’auteur dans `README.md`.

Conserver une exécution CI/CD réussie comme preuve pour la soutenance. Une adresse fictive ou une configuration seule ne prouve pas une mise en ligne effective.
