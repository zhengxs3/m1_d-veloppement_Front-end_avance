<?php

declare(strict_types=1);

namespace App;

use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

final class PokemonValidator
{
    private const TYPES = ['normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'];
    private const STATS = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'];

    public static function validate(array $input, bool $import = false): array
    {
        $text = function (mixed $value, int $max, string $label): string {
            if (!is_string($value) || mb_strlen(trim($value)) > $max) {
                throw new UnprocessableEntityHttpException("Champ invalide : $label.");
            }
            return trim($value);
        };
        $nom = $text($input['nom'] ?? '', 60, 'nom');
        if ($nom === '') {
            throw new UnprocessableEntityHttpException('Le nom est obligatoire.');
        }
        foreach (['height' => 10000, 'weight' => 1000000] as $field => $max) {
            $value = $input[$field] ?? null;
            if (!is_numeric($value) || !is_finite((float) $value) || (float) $value < 1 || (float) $value > $max) {
                throw new UnprocessableEntityHttpException("Valeur invalide : $field.");
            }
        }
        $types = $input['types'] ?? null;
        if (!is_array($types) || !array_is_list($types) || count($types) < 1 || count($types) > 2) {
            throw new UnprocessableEntityHttpException('Choisissez un ou deux types.');
        }
        $typeNames = [];
        foreach ($types as $entry) {
            $name = is_array($entry) && is_array($entry['type'] ?? null) ? ($entry['type']['name'] ?? null) : null;
            if (!in_array($name, self::TYPES, true) || in_array($name, $typeNames, true)) {
                throw new UnprocessableEntityHttpException('Type invalide ou répété.');
            }
            $typeNames[] = $name;
        }
        $stats = $input['stats'] ?? null;
        if (!is_array($stats) || !array_is_list($stats) || count($stats) !== 6) {
            throw new UnprocessableEntityHttpException('Les six statistiques sont obligatoires.');
        }
        $statValues = [];
        foreach ($stats as $entry) {
            $name = is_array($entry) && is_array($entry['stat'] ?? null) ? ($entry['stat']['name'] ?? null) : null;
            $value = is_array($entry) ? ($entry['base_stat'] ?? null) : null;
            if (!in_array($name, self::STATS, true) || isset($statValues[$name]) || !is_numeric($value)
                || !is_finite((float) $value) || (float) $value != (int) $value || $value < 1 || $value > 255) {
                throw new UnprocessableEntityHttpException('Statistique invalide : valeur entière de 1 à 255 attendue.');
            }
            $statValues[$name] = (int) $value;
        }
        $sprites = $input['sprites'] ?? [];
        if (!is_array($sprites)) {
            throw new UnprocessableEntityHttpException('Illustration invalide.');
        }
        $image = $text($sprites['front_default'] ?? '', 2000, 'illustration');
        if ($image !== '' && $image !== '/pokemon-placeholder.svg'
            && (!filter_var($image, FILTER_VALIDATE_URL) || !in_array(strtolower(parse_url($image, PHP_URL_SCHEME) ?: ''), ['http', 'https'], true))) {
            throw new UnprocessableEntityHttpException('L’illustration doit utiliser une URL http ou https.');
        }
        $id = 'perso-'.bin2hex(random_bytes(16));
        if ($import) {
            $id = $input['id'] ?? null;
            if (!is_string($id) || !preg_match('/^perso-[a-zA-Z0-9-]{1,80}$/D', $id)) {
                throw new UnprocessableEntityHttpException('Identifiant de création invalide.');
            }
        }
        return [
            'id' => $id, 'isCustom' => true, 'nom' => $nom, 'name' => mb_strtolower($nom),
            'description' => $text($input['description'] ?? '', 1500, 'description'),
            'category' => $text($input['category'] ?? '', 80, 'catégorie'),
            'customAbility' => $text($input['customAbility'] ?? '', 120, 'talent'),
            'height' => (float) $input['height'], 'weight' => (float) $input['weight'],
            'types' => array_map(fn (string $name) => ['type' => ['name' => $name]], $typeNames),
            'sprites' => ['front_default' => $image ?: '/pokemon-placeholder.svg'],
            'stats' => array_map(fn (string $name) => ['stat' => ['name' => $name], 'base_stat' => $statValues[$name]], self::STATS),
        ];
    }
}
