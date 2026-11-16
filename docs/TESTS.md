# Tests unitaires et fonctionnels avec Jest

## Configuration et exécution

Les tests suivent la méthode du cours « Qualité logicielle et tests » : Jest, `describe`, `it`, `expect`, données mockées et scénarios Given / When / Then.

```bash
npm ci
npm test
```

Pour lancer Jest directement comme dans les exercices :

```bash
npx jest --runInBand
```

Les autres commandes permettent de sélectionner les tests :

```bash
npm run test:unit
npm run test:integration
npm run test:functional
npm run test:coverage
npm run test:watch
```

`jest.config.cjs` configure Jest et l’environnement DOM simulé `jsdom`. `babel.config.cjs` transforme les imports et le JSX pour Jest. L’adaptation de `import.meta.env` sert uniquement à lire les variables de test sans le serveur Vite. `tests/setup.js` active les assertions DOM comme `toBeInTheDocument` et `toHaveValue`.

## Tests unitaires

Fichier : `tests/unit/domain.test.js`.

### Premier scénario : calcul des PV maximaux

- **Given** : un Pokémon possède une statistique de base de 45 PV.
- **When** : j’appelle `maximumStat(45, "hp")`.
- **Then** : la fonction retourne `294`.

```js
describe("maximumStat", () => {
  it("retourne 294 PV pour une base de 45", () => {
    const resultat = maximumStat(45, "hp");
    expect(resultat).toBe(294);
  });
});
```

Les autres cas couvrent la nature favorable pour l’attaque, le cas particulier d’un seul PV et la combinaison de deux types pour les dégâts. Il n’y a ni requête réseau ni rendu React dans ces tests.

## API et données mockées

Fichier : `tests/integration/services.test.js`.

### Scénario : récupérer les données françaises d’une fiche

- **Given** : l’API est simulée et contient les données de Bulbizarre.
- **When** : j’appelle `getPokemonDetails(1)`.
- **Then** : la fonction retourne le nom français mocké ; un second appel réutilise le cache.

`jest.spyOn(api, "get")` remplace les appels HTTP par des réponses contrôlées avec `mockResolvedValueOnce`. `mockRejectedValue` simule une erreur. `toHaveBeenCalledWith` vérifie l’adresse ou les données transmises.

Ce principe correspond à l’exercice du cours sur `retrieveSensorsData` : vérifier les données retournées à partir de mocks. Ici, les mocks sont définis dans les tests ; le code de production ne retourne pas automatiquement de fausses données lorsqu’il détecte un environnement de test.

## Tests fonctionnels et d’intégration du DOM

Fichiers : `tests/functional/SearchBar.test.jsx` et `tests/functional/AddPokemon.test.jsx`.

Comme pour le formulaire de connexion du cours, les tests imitent les actions d’un utilisateur et vérifient le résultat dans la page.

### Recherche

- **Given** : le formulaire de recherche est affiché.
- **When** : je saisis « pika » puis je clique sur « Rechercher ».
- **Then** : la fonction de recherche est appelée une seule fois avec « pika ».

### Création acceptée

- **Given** : le formulaire contient des valeurs valides et le service mocké accepte la sauvegarde.
- **When** : je clique sur « Ajouter à mon Pokédex ».
- **Then** : le service reçoit les données converties et le routeur navigue vers la nouvelle fiche.

### Création refusée

- **Given** : le service mocké refuse la sauvegarde.
- **When** : j’envoie le formulaire rempli.
- **Then** : le message d’erreur est affiché, les saisies sont conservées et la route reste `/add`.

`beforeEach` prépare un composant pour chaque test. React Testing Library utilise `render` pour le monter et le démonte automatiquement après le test. `screen.getByRole` et `screen.getByLabelText` retrouvent les éléments comme les fonctions `getByRole(document.body, ...)` et `getByLabelText(document.body, ...)` du cours.

La version actuelle de `user-event` utilise `userEvent.setup()` puis `await utilisateur.type(...)` et `await utilisateur.click(...)`. Le `await` attend la fin de l’interaction et des mises à jour React. Les exemples du cours utilisent une version plus ancienne, avec des appels directs à `userEvent.type` et `userEvent.click`.

## Couverture de code

```bash
npm run test:coverage
```

Jest affiche un tableau dans le terminal et génère le rapport HTML `coverage/index.html`. Le dossier `coverage` est exclu de Git et conservé comme artefact par la CI.

Comme dans le cours, le pourcentage indique les lignes et branches exécutées, sans prouver que tous les comportements sont vérifiés. Le but est de couvrir la logique sensible et les interactions utiles, sans imposer artificiellement 100 %.

## Limites et complément backend

jsdom simule le DOM : il n’ouvre pas de navigateur réel et ne vérifie pas la mise en page. Les mocks isolent le frontend des serveurs externes. Les tests de formulaire contrôlent l’appel au service et le changement de route ; ils ne prouvent pas qu’un serveur de production a enregistré les données.

`npm run test:backend` exécute séparément 29 vérifications PHP avec Symfony et une vraie base SQLite temporaire : validation, routes, sauvegarde, import et persistance. Une vérification manuelle du site publié reste nécessaire pour confirmer la communication entre le frontend et le backend hébergés.

Références : [Jest](https://jestjs.io/docs/getting-started), [React Testing Library](https://testing-library.com/docs/react-testing-library/setup/) et [user-event](https://testing-library.com/docs/user-event/setup/).
