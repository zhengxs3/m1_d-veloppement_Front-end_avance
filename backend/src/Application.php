<?php

declare(strict_types=1);

namespace App;

use Symfony\Component\EventDispatcher\EventDispatcher;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Controller\ArgumentResolver;
use Symfony\Component\HttpKernel\Controller\ControllerResolver;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\EventListener\RouterListener;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\HttpKernel;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\Routing\Matcher\UrlMatcher;
use Symfony\Component\Routing\RequestContext;
use Symfony\Component\Routing\Route;
use Symfony\Component\Routing\RouteCollection;

// Une petite application Symfony par composants : Request → route → contrôleur → Response.
final class Application
{
    public function __construct(private readonly string $databasePath, private readonly array $allowedOrigins) {}

    public function handle(Request $request): Response
    {
        $origin = $request->headers->get('Origin');
        if ($origin && !in_array($origin, $this->allowedOrigins, true)) {
            return new JsonResponse(['error' => 'Origine non autorisée.'], 403);
        }
        if ($request->isMethod('OPTIONS')) {
            $response = new Response('', 204);
        } else {
            try {
                $controller = new PokemonController(new PokemonRepository($this->databasePath));
                $routes = new RouteCollection();
                $routes->add('health', new Route('/api/health', ['_controller' => fn () => new JsonResponse(['status' => 'ok'])], methods: ['GET']));
                $routes->add('list', new Route('/api/pokemons', ['_controller' => [$controller, 'index']], methods: ['GET']));
                $routes->add('create', new Route('/api/pokemons', ['_controller' => [$controller, 'create']], methods: ['POST']));
                $routes->add('import', new Route('/api/pokemons/import', ['_controller' => [$controller, 'import']], methods: ['POST']));
                $routes->add('show', new Route('/api/pokemons/{id}', ['_controller' => [$controller, 'show']], requirements: ['id' => 'perso-[a-zA-Z0-9-]{1,80}'], methods: ['GET']));
                $dispatcher = new EventDispatcher();
                $stack = new RequestStack();
                $dispatcher->addSubscriber(new RouterListener(new UrlMatcher($routes, new RequestContext()), $stack));
                $dispatcher->addListener(KernelEvents::EXCEPTION, function (ExceptionEvent $event): void {
                    $error = $event->getThrowable();
                    $status = $error instanceof HttpExceptionInterface ? $error->getStatusCode() : 500;
                    $headers = $error instanceof HttpExceptionInterface ? $error->getHeaders() : [];
                    $event->setResponse(new JsonResponse(['error' => $status < 500 ? $error->getMessage() : 'Erreur interne du serveur.'], $status, $headers));
                });
                $kernel = new HttpKernel($dispatcher, new ControllerResolver(), $stack, new ArgumentResolver());
                $response = $kernel->handle($request);
                $kernel->terminate($request, $response);
            } catch (\Throwable) {
                $response = new JsonResponse(['error' => 'Le stockage des créations est indisponible.'], 503);
            }
        }
        $response->headers->set('Cache-Control', 'no-store');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->setVary('Origin');
        if ($origin) {
            $response->headers->set('Access-Control-Allow-Origin', $origin);
            $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            $response->headers->set('Access-Control-Allow-Headers', 'Content-Type');
        }
        return $response;
    }
}
