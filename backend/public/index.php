<?php

declare(strict_types=1);

use App\Application;
use Symfony\Component\HttpFoundation\Request;

require dirname(__DIR__).'/vendor/autoload.php';

$database = getenv('POKEDEX_DATABASE_PATH') ?: dirname(__DIR__).'/var/pokedex.sqlite';
$origins = explode(',', getenv('FRONTEND_ORIGINS') ?: 'http://localhost:5173,http://127.0.0.1:5173');
$app = new Application($database, array_map('trim', $origins));
$app->handle(Request::createFromGlobals())->send();
