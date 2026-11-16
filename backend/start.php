<?php

declare(strict_types=1);

// Lance le serveur de développement avec SQLite, même si le php.ini local ne le charge pas.
if (!is_file(__DIR__.'/vendor/autoload.php')) {
    fwrite(STDERR, "Dépendances absentes. Exécutez composer --working-dir=backend install.\n");
    exit(1);
}

$command = escapeshellarg(PHP_BINARY);
if (!extension_loaded('pdo_sqlite')) {
    $command .= ' -d extension=pdo_sqlite';
}
$command .= ' -S 127.0.0.1:8000 -t '.escapeshellarg(__DIR__.'/public');
$command .= ' '.escapeshellarg(__DIR__.'/public/index.php');

echo "API de développement : http://127.0.0.1:8000/api/health\n";
passthru($command, $status);
exit($status);
