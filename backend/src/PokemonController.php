<?php

declare(strict_types=1);

namespace App;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class PokemonController
{
    public function __construct(private readonly PokemonRepository $repository) {}

    public function index(): JsonResponse
    {
        return new JsonResponse($this->repository->all());
    }

    public function show(string $id): JsonResponse
    {
        $pokemon = $this->repository->find($id);
        if (!$pokemon) {
            throw new NotFoundHttpException('Pokémon personnel introuvable.');
        }
        return new JsonResponse($pokemon);
    }

    public function create(Request $request): JsonResponse
    {
        $pokemon = PokemonValidator::validate($this->body($request));
        $this->repository->save($pokemon);
        return new JsonResponse($pokemon, 201, ['Location' => '/api/pokemons/'.$pokemon['id']]);
    }

    public function import(Request $request): JsonResponse
    {
        $body = $this->body($request);
        $entries = $body['pokemons'] ?? null;
        if (!is_array($entries) || !array_is_list($entries) || count($entries) > 100) {
            throw new BadRequestHttpException('Import attendu : {"pokemons": [...]} (100 créations maximum).');
        }
        $pokemons = [];
        foreach ($entries as $entry) {
            if (!is_array($entry)) {
                throw new BadRequestHttpException('Création invalide.');
            }
            $pokemons[] = PokemonValidator::validate($entry, true);
        }
        return new JsonResponse($this->repository->import($pokemons));
    }

    private function body(Request $request): array
    {
        if ($request->getContentTypeFormat() !== 'json') {
            throw new HttpException(415, 'Le contenu doit être envoyé en JSON.');
        }
        if (strlen($request->getContent()) > 1024 * 1024) {
            throw new HttpException(413, 'Le contenu est trop volumineux.');
        }
        try {
            $body = json_decode($request->getContent(), true, 32, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            throw new BadRequestHttpException('JSON invalide.');
        }
        if (!is_array($body) || array_is_list($body)) {
            throw new BadRequestHttpException('Un objet JSON est attendu.');
        }
        return $body;
    }
}
