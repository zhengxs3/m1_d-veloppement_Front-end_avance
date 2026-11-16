<?php

declare(strict_types=1);

namespace App;

use PDO;

final class PokemonRepository
{
    private PDO $database;

    public function __construct(string $path)
    {
        if ($path !== ':memory:' && !is_dir(dirname($path))) {
            mkdir(dirname($path), 0775, true);
        }
        $this->database = new PDO('sqlite:'.$path, null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
        $this->database->exec('PRAGMA busy_timeout = 5000');
        $this->database->exec('CREATE TABLE IF NOT EXISTS pokemons (
            id TEXT PRIMARY KEY, payload TEXT NOT NULL, created_at TEXT NOT NULL
        )');
    }

    public function all(): array
    {
        $rows = $this->database->query('SELECT payload FROM pokemons ORDER BY created_at DESC, rowid DESC');
        return array_map(fn (string $json) => json_decode($json, true, 512, JSON_THROW_ON_ERROR), $rows->fetchAll(PDO::FETCH_COLUMN));
    }

    public function find(string $id): ?array
    {
        $query = $this->database->prepare('SELECT payload FROM pokemons WHERE id = :id');
        $query->execute(['id' => $id]);
        $json = $query->fetchColumn();
        return $json === false ? null : json_decode($json, true, 512, JSON_THROW_ON_ERROR);
    }

    public function save(array $pokemon): array
    {
        $query = $this->database->prepare('INSERT INTO pokemons (id, payload, created_at) VALUES (:id, :payload, :created)');
        $query->execute([
            'id' => $pokemon['id'],
            'payload' => json_encode($pokemon, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
            'created' => gmdate('Y-m-d\TH:i:s\Z'),
        ]);
        return $pokemon;
    }

    // Les identifiants existants sont conservés : importer deux fois ne crée pas de doublons.
    public function import(array $pokemons): array
    {
        $this->database->beginTransaction();
        try {
            foreach ($pokemons as $pokemon) {
                if (!$this->find($pokemon['id'])) {
                    $this->save($pokemon);
                }
            }
            $this->database->commit();
        } catch (\Throwable $error) {
            $this->database->rollBack();
            throw $error;
        }
        return $this->all();
    }
}
