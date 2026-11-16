# Vérification locale du projet

Date : 16 novembre 2026.

## Résultats observés

| Vérification                | Résultat                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------- |
| ESLint                      | Aucune erreur.                                                                                    |
| Tests unitaires             | 4 tests Jest réussis : statistiques maximales et multiplicateurs de défense.                      |
| Tests de services           | 9 tests Jest réussis avec appels Axios mockés.                                                    |
| Tests fonctionnels frontend | 6 tests Jest et Testing Library réussis : recherche et formulaire de création dans jsdom.         |
| Tests fonctionnels backend  | 29 vérifications réussies avec Symfony et une base SQLite temporaire.                             |
| Configuration Composer      | `composer validate --strict` valide la cohérence du manifeste et du verrouillage.                 |
| Build Vite                  | Réussi ; pages Home, AddPokemon, PokemonDetails et NotFound produites dans des modules distincts. |

Les 19 tests frontend sont exécutés avec `npm test`, via Jest. Les suites sont regroupées avec `describe` et `it`, les résultats sont vérifiés avec `expect` et les interactions utilisent Testing Library. `npm run test:coverage` produit le rapport HTML dans `coverage/index.html`.

Le rapport mesure 30,81 % des lignes du frontend : les calculs de statistiques et le service du catalogue sont couverts à 100 % des lignes, mais plusieurs écrans restent non couverts. Ce pourcentage décrit la portée actuelle des tests et ne garantit pas l’absence de bugs.

Sur ce poste, PHP ne charge pas SQLite par défaut. La commande utilisée pour les vérifications backend est :

```bash
php -d extension=pdo_sqlite -d xdebug.mode=off backend/tests/api.php
```

## Portée et limites

Les tests fonctionnels Jest utilisent jsdom et des services mockés pour vérifier le comportement du frontend, sans navigateur réel. Les tests backend utilisent une vraie base temporaire et vérifient la persistance. Ces deux suites ne prouvent pas que les serveurs de production communiquent correctement.

Le workflow de CI/CD est configuré dans le dépôt local. Son exécution sur GitHub et le déploiement Vercel ne sont pas attestés par ces vérifications locales. Le site public, le backend hébergé, les secrets Vercel et la branche de production doivent être renseignés et validés avant la remise.

Le README indique explicitement ces éléments restants, ainsi que le nom et le prénom de l’auteur à compléter. Il ne revendique pas une note ni une mise en ligne non vérifiée.
