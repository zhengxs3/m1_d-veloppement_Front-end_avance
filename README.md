# Mon Pokédex

Application React en français pour consulter les Pokémon, filtrer leur liste par type et afficher leurs statistiques. Les données proviennent de PokéAPI et les noms affichés sont en français.

## Démarrage

Exécuter `npm install`, puis `npm run dev` pour démarrer le serveur de développement.

## Vérification

Exécuter `npm run lint` pour analyser le code et `npm run build` pour compiler l’application. La commande `npm run preview` permet de prévisualiser la version compilée.

## Fonctionnalités

Liste paginée, filtrage par type et recherche par nom partiel. La recherche du catalogue officiel utilise les identifiants de l’API, par exemple « pika ».

La fiche détaillée propose une description, les talents, les statistiques de base et leurs maxima théoriques, les faiblesses et résistances, la famille d’évolution, un aperçu des capacités et les informations de reproduction. Les ressources sont mises en cache pendant la session. Une rubrique indisponible ne bloque pas les autres.

Le bouton « Ajouter un Pokémon » ouvre un formulaire de création : nom, illustration facultative, types, taille, poids, description, talent et six statistiques. Après l’enregistrement, la fiche s’ouvre et le Pokémon apparaît dans « Mes créations » sur l’accueil. Les filtres et la recherche s’appliquent aussi aux créations.

Les créations sont enregistrées dans le stockage local du navigateur. Elles ne sont pas synchronisées entre appareils et sont supprimées si les données du site sont effacées. Elles ne modifient pas le catalogue officiel. Les données officielles nécessitent une connexion à Internet.

## Tests fonctionnels

Exécuter `node --test tests/pokemon.test.js` pour vérifier la sauvegarde des créations, les noms français, le cache, les défenses à deux types et les maxima des statistiques.

Structure des données : [documentation officielle de PokéAPI](https://pokeapi.co/docs/v2).
