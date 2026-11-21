# Mon Pokédex — Développement frontend avancé

Application React en français pour explorer les Pokémon de PokéAPI et créer, modifier et supprimer ses propres fiches.

## Livrables

- Dépôt GitHub : [m1_d-veloppement_Front-end_avance](https://github.com/zhengxs3/m1_d-veloppement_Front-end_avance).
- Site en ligne (Vercel) : [m1-d-veloppement-front-end-avance-peach.vercel.app](https://m1-d-veloppement-front-end-avance-peach.vercel.app).
- Backend en ligne (Render) : [pokedex-api-dcpq.onrender.com](https://pokedex-api-dcpq.onrender.com), vérification sur [/api/health](https://pokedex-api-dcpq.onrender.com/api/health).
- Auteur : ZHENG Xinshen.

Le frontend est publié par Vercel à chaque push sur `main`. Le backend Node.js est hébergé sur l’offre gratuite de Render : il se met en veille après une période d’inactivité (le premier appel peut prendre 30 à 60 secondes) et sa base SQLite est réinitialisée à chaque redéploiement. Avant une démonstration, ouvrir `/api/health` pour le réveiller. Le formulaire de création, de modification et de suppression nécessite ce backend.

## Installation et démarrage

Prérequis : Node.js 20 ou supérieur et npm. Le backend est écrit en Node.js (Express) ; SQLite est fourni par `sql.js` (WebAssembly), sans compilation ni installation de PHP.

Depuis la racine du dépôt :

```bash
npm ci
```

Dans un premier terminal, lancer le backend :

```bash
npm run backend:start
```

Dans un second terminal, lancer le frontend :

```bash
npm run dev
```

Ouvrir `http://localhost:5173`. Vite transmet `/api` au serveur Node sur `127.0.0.1:8000`. La base `backend/var/pokedex.sqlite` est créée au premier accès et exclue de Git.

Les deux terminaux doivent rester ouverts.

### Dépannage : collection indisponible ou erreur 502

Si le catalogue officiel s’affiche mais que « Créations partagées » est indisponible, vérifier le backend avec `http://127.0.0.1:8000/api/health`. La réponse attendue est `{"status":"ok"}`. Une erreur 502 sur `/api/pokemons` indique que le proxy de développement n’arrive pas à joindre le serveur : lancer `npm run backend:start` dans un terminal distinct. Une réponse 503 de l’API demande de vérifier les droits d’écriture du dossier `server/var`. Consulter également les erreurs affichées dans le terminal du backend.

Les tests du backend s’exécutent avec `npm run test:backend` (ou `npm test` pour tout le projet).

## Extension : fonctionnalités

| Critère                                            | Réalisation ou condition restante                                                                                                                                                             |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Site en ligne                                      | Frontend publié sur Vercel (branche `main`) ; backend Node.js hébergé sur Render.                                                                                                             |
| Pipeline CI/CD                                     | `.github/workflows/ci.yml` vérifie le frontend et le backend ; le déploiement dépend du succès des deux jobs et de la configuration des secrets.                                              |
| 2 tests unitaires et 2 tests fonctionnels minimum  | Jest : 4 tests unitaires, 15 tests de services mockés et 24 tests fonctionnels (interface) avec Testing Library et jsdom. Le backend Node.js possède aussi 31 tests (API REST et validation). |
| Optimisation des performances                      | `React.lazy`, `Suspense`, cache des ressources et rubriques de détail chargées à la demande.                                                                                                  |
| KISS et qualité du code                            | Responsabilités séparées, fonctions pures, composants réutilisables, ESLint et Prettier.                                                                                                      |
| Gestion d’état moderne                             | État de navigation dans l’URL avec `useSearchParams` ; état local avec les hooks.                                                                                                             |
| Stratégie de rendu moderne expliquée               | SPA avec rendu côté client (CSR) et découpage du code par route, détaillés ci-dessous.                                                                                                        |
| Atomic Design et/ou Feature-Sliced Design expliqué | Organisation effective selon Atomic Design, détaillée ci-dessous.                                                                                                                             |

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

## Organisation du backend : MVC

Le backend Node.js (`backend/`) suit la même organisation que le cours :

```text
backend/
├── server.js             # Point d'entrée : lit les variables d'environnement et écoute le port
├── app.js                # Création de l'application Express (séparée pour les tests)
├── routes/               # pokemonRoutes : associe chaque URL et méthode HTTP à un contrôleur
├── controllers/          # pokemonController : getPokemons, createPokemon, updatePokemon, deletePokemon…
├── models/               # Pokemon (validation + find, findById, create…) et PokemonRepository (SQLite)
├── middlewares/          # corsMiddleware, jsonMiddleware, errorMiddleware
└── var/                  # Fichier de base SQLite (exclu de Git)
```

Chaque contrôleur est une fonction exportée (`getPokemons`, `createPokemon`…) qui appelle le modèle comme avec Mongoose (`Pokemon.find()`, `Pokemon.findById()`, `Pokemon.create()`, `Pokemon.findByIdAndUpdate()`, `Pokemon.findByIdAndDelete()`) et répond en JSON, avec un `try / catch` et un message d'erreur en français. Le modèle utilise SQLite au lieu de MongoDB. Il n'y a pas de vue côté serveur : la « vue » est l'application React, qui consomme l'API. Les tests sont placés à côté du code (`Pokemon.unit.test.js`) ; `app.integration.test.js` envoie de vraies requêtes HTTP à l'application complète.

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

| Niveau               | Commande                   | Vérifications                                                                                                                                                            |
| -------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Unitaire             | `npm run test:unit`        | 4 tests Jest : statistiques maximales et combinaison des faiblesses/résistances/immunités.                                                                               |
| Services             | `npm run test:integration` | 15 tests Jest : cache, nouvelle tentative, sauvegarde, modification, suppression et import avec les appels Axios mockés.                                                 |
| Fonctionnel frontend | `npm run test:functional`  | 24 tests Jest et Testing Library : recherche, pagination, menu (snapshot), étiquettes de type cliquables, ajout, modification, suppression avec confirmation et erreurs. |
| Fonctionnel backend  | `npm run test:backend`     | 31 tests Jest (Express et SQLite via sql.js, base temporaire) : routes, validation, ajout, modification, suppression, imports et CORS.                                   |

Comme dans les exemples du cours, chaque test est placé à côté du fichier qu’il vérifie (`stats.js` → `stats.unit.test.js`, `Pagination.jsx` → `Pagination.integration.test.jsx`) ; les fichiers DOM déclarent `@jest-environment jsdom`. Les tests suivent la méthode du cours : `describe`, `it`, `expect`, mocks, `beforeEach` et scénarios Given / When / Then. Testing Library simule les interactions dans jsdom ; aucun navigateur réel ni serveur externe n’est nécessaire. Les tests backend vérifient séparément le stockage réel. Voir [le guide des tests](docs/TESTS.md) pour les scénarios, les commandes et le rapport de couverture.

Les résultats de la vérification locale sont consignés dans [docs/VERIFICATION.md](docs/VERIFICATION.md).

## CI/CD et mise en ligne

Voir [la procédure de déploiement](docs/DEPLOIEMENT.md).

Le workflow `.github/workflows/ci.yml` suit la structure du cours : `test` → `build` → `deploy`, chaînés avec `needs`. Il se déclenche à chaque push et pull request sur `main`, `dev` et `feature/**`.

1. **test** : ESLint, Prettier et `npm run test:coverage` (Jest). Le même job exécute les tests de l’API Node.js (`backend/`).
2. **build** : `npm run build`, uniquement si les tests réussissent.
3. **deploy** : publication sur Vercel, uniquement sur `main` après le build. Il est activé par la variable `DEPLOY_ENABLED=true` et les secrets Vercel décrits dans le guide.

Une erreur dans un job bloque tous les jobs suivants. La branche `Pokedex` exécute les tests et le build ; le déploiement a lieu après fusion dans `main`.

La sortie Vite est `build`. `vercel.json` permet l’accès direct aux routes de la SPA. Le backend Node.js (`npm run backend:start`) doit être hébergé séparément avec un disque persistant. Définir `VITE_CUSTOM_API_URL` avant la compilation du frontend et `FRONTEND_ORIGINS` côté Node.js. `npm run preview` sert le frontend compilé sans le proxy API de développement.

## Démonstration pour la soutenance

1. Ouvrir l’adresse publique, afficher la liste et changer de page.
2. Ouvrir une fiche et revenir à la même page du catalogue.
3. Utiliser le menu, rechercher un nom partiel et filtrer un type.
4. Créer un Pokémon, montrer le POST dans le panneau Réseau et retrouver la création après rechargement.
5. Présenter les tests, l’exécution GitHub Actions et le déploiement réussi.
6. Expliquer CSR, le découpage des pages, le cache, l’état dans l’URL et Atomic Design.

Les Pokémon officiels s’affichent avec leur nom anglais de PokéAPI suivi du nom français entre parenthèses (par exemple « Koffing (Smogo) »). La recherche porte sur le nom anglais (« pika » trouve Pikachu) ; une aide sous le champ de recherche le rappelle. Le reste de l’interface reste en français. Les créations sont partagées entre les visiteurs du même backend. Cette version scolaire n’a pas d’authentification. Les anciennes créations du navigateur peuvent être importées explicitement sans effacer les originaux.

## Références

- [Documentation de PokéAPI](https://pokeapi.co/docs/v2).
- [Premiers pas avec Jest](https://jestjs.io/docs/getting-started).
- [React Testing Library](https://testing-library.com/docs/react-testing-library/setup/).
- [Vercel et GitHub Actions](https://vercel.com/kb/guide/how-can-i-use-github-actions-with-vercel).
