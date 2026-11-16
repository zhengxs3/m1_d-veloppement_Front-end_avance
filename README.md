# Mon Pokédex — Développement frontend avancé

Application React en français pour explorer les Pokémon de PokéAPI et créer ses propres fiches. Ce projet est organisé selon la grille « TP POKEDEX — Projet initial et Extended » fournie avec le sujet.

## Livrables

- Dépôt GitHub : [m1_d-veloppement_Front-end_avance](https://github.com/zhengxs3/m1_d-veloppement_Front-end_avance).
- Site en ligne : **adresse à renseigner après le déploiement effectif**.
- Backend en ligne : **adresse à renseigner après le déploiement effectif**.
- Auteur : **nom et prénom à compléter avant la remise**.

La configuration de déploiement ne prouve pas que le site est en ligne. Le formulaire de création nécessite un backend PHP accessible depuis le site publié.

## Installation et démarrage

Prérequis : Node.js 22, npm, PHP 8.2 ou supérieur, Composer et les extensions PHP `pdo_sqlite` et `mbstring`.

Depuis la racine du dépôt :

```bash
npm ci
composer --working-dir=backend install
```

Dans un premier terminal, lancer le backend :

```bash
npm run backend:start
```

Dans un second terminal, lancer le frontend :

```bash
npm run dev
```

Ouvrir `http://localhost:5173`. Vite transmet `/api` au serveur PHP sur `127.0.0.1:8000`. La base `backend/var/pokedex.sqlite` est créée au premier accès et exclue de Git.

Les deux terminaux doivent rester ouverts. `backend/start.php` charge ponctuellement `pdo_sqlite` si cette extension est installée mais désactivée dans le `php.ini`, puis lance le serveur PHP sans modifier la configuration système.

### Dépannage : collection indisponible ou erreur 502

Si le catalogue officiel s’affiche mais que « Créations partagées » est indisponible, vérifier le backend avec `http://127.0.0.1:8000/api/health`. La réponse attendue est `{"status":"ok"}`. Une erreur 502 sur `/api/pokemons` indique généralement que le proxy de développement n’arrive pas à joindre le serveur PHP : lancer `npm run backend:start` dans un terminal distinct. Une réponse 503 de l’API demande de vérifier SQLite et les droits d’écriture du dossier de la base. Consulter également les erreurs du terminal PHP.

Sur un poste où SQLite est installé sans être activé, activer `extension=pdo_sqlite` dans le `php.ini` utilisé par PHP. Pour exécuter ponctuellement les tests sans modifier la configuration système :

```bash
php -d extension=pdo_sqlite -d xdebug.mode=off backend/tests/api.php
```

## Projet initial : correspondance avec la grille /20

| Critère                   | Points | Réalisation et preuve                                                                                                                                                                                |
| ------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Liste des Pokémon         | 2      | `src/pages/Home.jsx` affiche les cartes du catalogue et la collection de créations.                                                                                                                  |
| Navigation liste ↔ détail | 2      | `PokeCard` ouvre `/poke/:id` ; le retour restitue la page et les filtres de départ.                                                                                                                  |
| Formulaire d’ajout        | 2      | `src/pages/AddPokemon.jsx` valide les champs, attend la sauvegarde, puis ouvre la fiche créée.                                                                                                       |
| Menu global               | 2      | `src/components/organisms/Navbar.jsx`, affiché en dehors des routes.                                                                                                                                 |
| React Router              | 2      | `BrowserRouter` dans `main.jsx`, `Routes` et `Route` dans `App.jsx` ; routes `/`, `/add`, `/poke/:id` et page 404.                                                                                   |
| API REST                  | 2      | PokéAPI pour le catalogue ; API PHP pour les créations partagées.                                                                                                                                    |
| Axios GET et POST         | 2      | `src/services/api.js` effectue les GET ; `customPokemonApi.js` effectue les GET et POST des créations.                                                                                               |
| Pagination client         | 2      | `Home` pilote les boutons précédente/suivante, avec 12 éléments par page. La liste non filtrée utilise `limit`/`offset` de l’API ; les recherches et filtres sont découpés côté client avec `slice`. |
| Hooks React               | 2      | `useState` pour l’état local et `useEffect` pour les chargements et leur nettoyage.                                                                                                                  |
| Composants séparés        | 2      | Atomes, molécules et organismes assemblés dans les pages.                                                                                                                                            |

Le tableau indique les éléments implémentés ; la note finale dépend de la vérification de l’enseignant.

## Extension : correspondance avec la grille /10

| Critère                                            | Points | Réalisation ou condition restante                                                                                                                      |
| -------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Site en ligne                                      | 1      | Configuration Vercel présente. Adresse publique et fonctionnement du backend à confirmer avant la remise.                                              |
| Pipeline CI/CD                                     | 2      | `.github/workflows/ci.yml` vérifie le frontend et le backend ; le déploiement dépend du succès des deux jobs et de la configuration des secrets.       |
| 2 tests unitaires et 2 tests fonctionnels minimum  | 2      | Jest : 4 tests unitaires, 9 tests de services mockés et 8 tests fonctionnels avec Testing Library et jsdom. Le backend possède aussi 29 vérifications. |
| Optimisation des performances                      | 1      | `React.lazy`, `Suspense`, cache des ressources et rubriques de détail chargées à la demande.                                                           |
| KISS et qualité du code                            | 1      | Responsabilités séparées, fonctions pures, composants réutilisables, ESLint et Prettier.                                                               |
| Gestion d’état moderne                             | 1      | État de navigation dans l’URL avec `useSearchParams` ; état local avec les hooks.                                                                      |
| Stratégie de rendu moderne expliquée               | 1      | SPA avec rendu côté client (CSR) et découpage du code par route, détaillés ci-dessous.                                                                 |
| Atomic Design et/ou Feature-Sliced Design expliqué | 1      | Organisation effective selon Atomic Design, détaillée ci-dessous.                                                                                      |

## Stratégie de rendu : CSR et chargement à la demande

L’application est une **SPA avec rendu côté client (CSR)**. Vite produit un fichier HTML et des ressources statiques. `createRoot` monte React dans le navigateur ; `BrowserRouter` change la vue sans recharger le document. Les données sont demandées aux API après le montage des composants.

`React.lazy(() => import(...))` découpe les pages en modules JavaScript distincts. `Suspense` affiche un état de chargement pendant leur téléchargement. La fiche charge ses rubriques à la demande : ouvrir « Défense » ne télécharge pas les capacités ou la chaîne d’évolution.

Cette stratégie convient à un catalogue interactif avec recherche, filtres et formulaires. Elle évite un serveur de rendu supplémentaire. En contrepartie, JavaScript est nécessaire pour afficher le catalogue et le référencement initial est moins favorable qu’avec du SSR ou du SSG. Le projet ne réalise pas de rendu serveur, de génération statique des fiches ni de React Server Components.

## Organisation du frontend : Atomic Design

```text
src/
├── components/
│   ├── atoms/          # TypeBadge
│   ├── molecules/      # PokeCard, SearchBar, TypeFilter, Pagination, StatPanel
│   └── organisms/      # Navbar, CustomCollection, PokemonSections
├── pages/              # Home, PokemonDetails, AddPokemon, NotFound
├── services/           # Axios, cache, calculs et préparation des rubriques
├── data/               # Libellés français des types et statistiques
├── App.jsx             # Composition commune et déclaration des routes
└── main.jsx            # Montage React et fournisseur de routage
```

- **Atome** : `TypeBadge` représente une unité visuelle élémentaire sans chargement de données.
- **Molécules** : `SearchBar` regroupe un champ et ses actions ; `PokeCard` associe une image, un nom et un lien ; `Pagination` regroupe les contrôles de page.
- **Organismes** : `CustomCollection` coordonne le chargement des créations et plusieurs cartes ; `PokemonSections` compose les rubriques de la fiche ; `Navbar` fournit le menu commun.
- **Pages** : elles assemblent ces éléments avec les paramètres de route et les données propres à chaque écran.

Le cadre commun est composé directement dans `App.jsx`. Aucun dossier `templates` vide n’est ajouté : une abstraction supplémentaire n’apporterait pas de réutilisation à cette application. Les services ne contiennent pas de JSX ; les calculs sont séparés des composants visuels. Le projet applique Atomic Design et ne prétend pas appliquer Feature-Sliced Design.

## Performance, KISS et gestion d’état

### Performance

`getResource` mémorise les promesses HTTP dans une `Map` : deux appels pour une même ressource partagent la requête et la réponse. Une promesse rejetée est retirée du cache pour permettre une nouvelle tentative. Ce cache est limité à la session et au module chargé ; il n’expire pas automatiquement.

Les cartes réservent la place des images avec `width` et `height`. Les premières images sont chargées immédiatement et les suivantes utilisent `loading="lazy"`. La recherche récupère les noms du catalogue, puis charge uniquement les fiches de la page visible. Les pages et rubriques sont chargées à la demande.

### KISS et qualité

Le projet utilise les outils nécessaires à ses besoins : hooks React, React Router, Axios et fonctions JavaScript. Un store global supplémentaire n’est pas nécessaire pour trois écrans principaux. Les services centralisent les appels HTTP ; `maximumStat` et `calculateDefenses` sont testés indépendamment. Les composants réutilisables évitent de dupliquer les cartes et contrôles.

ESLint vérifie notamment les règles des hooks. Prettier vérifie le format des sources, tests, configurations et documents. Les vues affichent des chargements, des messages d’erreur en français et des actions de nouvelle tentative. Le formulaire désactive l’envoi pendant la sauvegarde.

### Gestion d’état moderne

`useSearchParams` conserve `page`, `q` et `type` dans l’URL. Exemple : `/?type=grass&q=bulb&page=2`. Les critères survivent au rechargement et à l’historique du navigateur. Les cartes transmettent une adresse de retour à la fiche avec l’état de navigation du routeur.

`useState` conserve les informations temporaires : brouillon de recherche, requête en cours, erreur et rubrique sélectionnée. `useEffect` effectue les chargements ; son nettoyage ignore les réponses obsolètes lors d’un changement de page. Les données partagées persistantes restent dans SQLite derrière l’API.

## Tests et vérifications

```bash
npm run lint
npm run format:check
npm test
npm run test:backend
npm run test:functional
npm run test:coverage
npm run build
```

| Niveau               | Commande                   | Vérifications                                                                                                            |
| -------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Unitaire             | `npm run test:unit`        | 4 tests Jest : statistiques maximales et combinaison des faiblesses/résistances/immunités.                               |
| Services             | `npm run test:integration` | 9 tests Jest : cache, nouvelle tentative, sauvegarde et import avec les appels Axios mockés.                             |
| Fonctionnel frontend | `npm run test:functional`  | 8 tests Jest et Testing Library : recherche, réinitialisation, sauvegarde, navigation et erreur du formulaire.           |
| Fonctionnel backend  | `npm run test:backend`     | 29 vérifications avec le noyau Symfony et une base SQLite temporaire : routes, validation, persistance, imports et CORS. |

Les tests suivent la méthode du cours : `describe`, `it`, `expect`, mocks, `beforeEach` et scénarios Given / When / Then. Testing Library simule les interactions dans jsdom ; aucun navigateur réel ni serveur externe n’est nécessaire. Les tests backend vérifient séparément le stockage réel. Voir [le guide des tests](docs/TESTS.md) pour les scénarios, les commandes et le rapport de couverture.

Les résultats de la vérification locale sont consignés dans [docs/VERIFICATION.md](docs/VERIFICATION.md).

## CI/CD et mise en ligne

Voir [la procédure de déploiement](docs/DEPLOIEMENT.md).

À chaque push et pull request, GitHub Actions exécute ESLint, Prettier, les tests Jest unitaires/de services/fonctionnels avec couverture, le build et les vérifications PHP. Une erreur bloque le job de déploiement.

Le déploiement automatique est prévu sur la branche de production, configurable avec `PRODUCTION_BRANCH` (valeur par défaut : `main`). Pour l’activer, configurer la variable `DEPLOY_ENABLED=true` et les secrets Vercel décrits dans le guide. Si la branche de remise est `Pokedex`, renseigner cette valeur explicitement.

La sortie Vite est `build`. `vercel.json` permet l’accès direct aux routes de la SPA. Le backend PHP doit être hébergé séparément avec un disque persistant et la racine Web `backend/public`. Définir `VITE_CUSTOM_API_URL` avant la compilation du frontend et `FRONTEND_ORIGINS` côté PHP. `npm run preview` sert le frontend compilé sans le proxy API de développement.

## Démonstration pour la soutenance

1. Ouvrir l’adresse publique, afficher la liste et changer de page.
2. Ouvrir une fiche et revenir à la même page du catalogue.
3. Utiliser le menu, rechercher un nom partiel et filtrer un type.
4. Créer un Pokémon, montrer le POST dans le panneau Réseau et retrouver la création après rechargement.
5. Présenter les tests, l’exécution GitHub Actions et le déploiement réussi.
6. Expliquer CSR, le découpage des pages, le cache, l’état dans l’URL et Atomic Design.

La recherche officielle utilise les identifiants PokéAPI, par exemple « pika », même si les noms affichés sont français. Les créations sont partagées entre les visiteurs du même backend. Cette version scolaire n’a pas d’authentification. Les anciennes créations du navigateur peuvent être importées explicitement sans effacer les originaux.

## Références

- [Documentation de PokéAPI](https://pokeapi.co/docs/v2).
- [Premiers pas avec Jest](https://jestjs.io/docs/getting-started).
- [React Testing Library](https://testing-library.com/docs/react-testing-library/setup/).
- [Vercel et GitHub Actions](https://vercel.com/kb/guide/how-can-i-use-github-actions-with-vercel).
