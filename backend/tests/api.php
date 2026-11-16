<?php

declare(strict_types=1);

require dirname(__DIR__).'/vendor/autoload.php';

use App\Application;
use Symfony\Component\HttpFoundation\Request;

$path = sys_get_temp_dir().'/pokedex-test-'.bin2hex(random_bytes(8)).'.sqlite';
$app = new Application($path, ['http://localhost:5173']);
$checks = 0;
function check(bool $condition, string $message): void
{
    global $checks;
    if (!$condition) {
        throw new RuntimeException($message);
    }
    ++$checks;
}
function request(string $method, string $url, mixed $body = null, array $headers = []): \Symfony\Component\HttpFoundation\Response
{
    global $app;
    $server = ['CONTENT_TYPE' => 'application/json', ...$headers];
    return $app->handle(Request::create($url, $method, server: $server, content: is_string($body) ? $body : ($body === null ? null : json_encode($body))));
}
function data(\Symfony\Component\HttpFoundation\Response $response): array
{
    return json_decode($response->getContent(), true, 512, JSON_THROW_ON_ERROR);
}
$pokemon = [
    'nom' => 'Floréa', 'height' => 7, 'weight' => 69,
    'types' => [['type' => ['name' => 'grass']]],
    'stats' => array_map(fn ($name) => ['stat' => ['name' => $name], 'base_stat' => 50], ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed']),
];
try {
    check(request('GET', '/api/health')->getStatusCode() === 200, 'Health endpoint');
    check(data(request('GET', '/api/pokemons')) === [], 'Empty collection');
    $response = request('POST', '/api/pokemons', $pokemon);
    check($response->getStatusCode() === 201, 'POST returns 201');
    $created = data($response);
    check(str_starts_with($created['id'], 'perso-'), 'Server-generated identifier');
    check($created['nom'] === 'Floréa', 'Unicode is preserved');
    check($created['sprites']['front_default'] === '/pokemon-placeholder.svg', 'Default image');
    $app = new Application($path, ['http://localhost:5173']);
    check(data(request('GET', '/api/pokemons/'.$created['id']))['nom'] === 'Floréa', 'Persistence across application instances');
    check(count(data(request('GET', '/api/pokemons'))) === 1, 'List contains saved creation');
    check(request('GET', '/api/pokemons/perso-missing')->getStatusCode() === 404, 'Missing creation');
    check(request('GET', '/unknown')->getStatusCode() === 404, 'Unknown route');
    check(request('DELETE', '/api/pokemons')->getStatusCode() === 405, 'Unsupported method');
    check(request('POST', '/api/pokemons', '{bad json')->getStatusCode() === 400, 'Malformed JSON');
    check(request('POST', '/api/pokemons', '[]')->getStatusCode() === 400, 'List is not an object');
    check(request('POST', '/api/pokemons', $pokemon, ['CONTENT_TYPE' => 'text/plain'])->getStatusCode() === 415, 'Content type');
    foreach ([
        ['nom' => '   '], ['height' => -1], ['weight' => 1000001],
        ['types' => [['type' => ['name' => 'invalid']]]], ['stats' => []],
        ['sprites' => ['front_default' => 'javascript:alert(1)']], ['types' => 'grass'],
    ] as $invalid) {
        check(request('POST', '/api/pokemons', array_replace($pokemon, $invalid))->getStatusCode() === 422, 'Invalid input rejected');
    }
    $legacy = [...$pokemon, 'id' => 'perso-legacy-123', 'isCustom' => true];
    check(request('POST', '/api/pokemons/import', ['pokemons' => [$legacy]])->getStatusCode() === 200, 'Legacy import');
    request('POST', '/api/pokemons/import', ['pokemons' => [$legacy]]);
    check(count(data(request('GET', '/api/pokemons'))) === 2, 'Repeated import has no duplicates');
    check(request('POST', '/api/pokemons/import', ['pokemons' => [[...$legacy, 'id' => 'perso-new'], [...$legacy, 'nom' => '']]])->getStatusCode() === 422, 'Invalid import rejected');
    check(request('GET', '/api/pokemons/perso-new')->getStatusCode() === 404, 'Invalid batch saves nothing');
    $response = request('OPTIONS', '/api/pokemons', headers: ['HTTP_ORIGIN' => 'http://localhost:5173']);
    check($response->getStatusCode() === 204, 'CORS preflight');
    check($response->headers->get('Access-Control-Allow-Origin') === 'http://localhost:5173', 'Allowed frontend origin');
    check(request('POST', '/api/pokemons', $pokemon, ['HTTP_ORIGIN' => 'https://untrusted.example'])->getStatusCode() === 403, 'Unknown origin rejected');
    check(count(data(request('GET', '/api/pokemons'))) === 2, 'Rejected request does not write');
    echo "OK: $checks API checks passed (temporary SQLite database).\n";
} finally {
    unset($app, $response);
    gc_collect_cycles();
    if (file_exists($path)) {
        unlink($path);
    }
}
