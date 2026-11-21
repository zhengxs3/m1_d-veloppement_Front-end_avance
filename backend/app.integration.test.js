import { randomBytes } from "node:crypto";
import { existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp } from "./app.js";

const ORIGIN = "http://localhost:5173";
const STATS = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"];
const pokemon = {
  nom: "Floréa",
  height: 7,
  weight: 69,
  types: [{ type: { name: "grass" } }],
  stats: STATS.map((name) => ({ stat: { name }, base_stat: 50 })),
};

/**
 * @function createApp
 */
describe("app Integration Test Suites (API REST /api/pokemons, base SQLite temporaire)", () => {
  const path = join(tmpdir(), `pokedex-test-${randomBytes(8).toString("hex")}.sqlite`);
  let app;
  let server;
  let url;

  async function demarrer() {
    app = createApp({ databasePath: path, allowedOrigins: [ORIGIN] });
    server = await new Promise((resolve) => {
      const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
    });
    url = `http://127.0.0.1:${server.address().port}`;
  }
  async function arreter() {
    await new Promise((resolve) => server.close(resolve));
    await app.close();
  }
  // Envoie une requête HTTP réelle à l'application et retourne le statut et le JSON.
  async function requete(method, chemin, body, headers = {}) {
    const response = await fetch(url + chemin, {
      method,
      headers: { "Content-Type": "application/json", ...headers },
      body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
    });
    const texte = await response.text();
    return {
      status: response.status,
      headers: response.headers,
      data: texte ? JSON.parse(texte) : null,
    };
  }

  beforeAll(demarrer);
  afterAll(async () => {
    await arreter();
    for (const fichier of [path, `${path}.tmp`]) if (existsSync(fichier)) rmSync(fichier);
  });

  it("répond à la route de santé", async () => {
    // When : la route /api/health est appelée.
    const { status, data } = await requete("GET", "/api/health");
    // Then : le serveur répond ok.
    expect(status).toBe(200);
    expect(data).toEqual({ status: "ok" });
  });

  it("ajoute, lit, modifie et supprime une création", async () => {
    // Given : une collection vide.
    expect((await requete("GET", "/api/pokemons")).data).toEqual([]);

    // When : une création est ajoutée (POST).
    const ajout = await requete("POST", "/api/pokemons", pokemon);
    const creation = ajout.data;
    // Then : le serveur répond 201, génère l'identifiant et conserve les accents.
    expect(ajout.status).toBe(201);
    expect(creation.id).toMatch(/^perso-/);
    expect(creation.nom).toBe("Floréa");
    expect(creation.sprites.front_default).toBe("/pokemon-placeholder.svg");
    expect(ajout.headers.get("location")).toBe(`/api/pokemons/${creation.id}`);

    // When : la création est modifiée (PUT).
    const modification = await requete("PUT", `/api/pokemons/${creation.id}`, {
      ...pokemon,
      nom: "Floréa 2",
      weight: 80,
    });
    // Then : l'identifiant est conservé, la valeur est enregistrée et rien n'est dupliqué.
    expect(modification.status).toBe(200);
    expect(modification.data.id).toBe(creation.id);
    expect((await requete("GET", `/api/pokemons/${creation.id}`)).data.nom).toBe("Floréa 2");
    expect((await requete("GET", "/api/pokemons")).data).toHaveLength(1);

    // When : une modification invalide est envoyée.
    const refus = await requete("PUT", `/api/pokemons/${creation.id}`, { ...pokemon, nom: "" });
    // Then : elle est refusée et la création reste inchangée.
    expect(refus.status).toBe(422);
    expect((await requete("GET", `/api/pokemons/${creation.id}`)).data.nom).toBe("Floréa 2");

    // When : une autre création est ajoutée puis supprimée (DELETE).
    const autre = (await requete("POST", "/api/pokemons", { ...pokemon, nom: "Autre" })).data;
    // Then : 204 la première fois, 404 ensuite, et les autres créations sont conservées.
    expect((await requete("DELETE", `/api/pokemons/${autre.id}`)).status).toBe(204);
    expect((await requete("GET", `/api/pokemons/${autre.id}`)).status).toBe(404);
    expect((await requete("DELETE", `/api/pokemons/${autre.id}`)).status).toBe(404);
    expect((await requete("GET", "/api/pokemons")).data).toHaveLength(1);
  });

  it("conserve les données quand le serveur redémarre", async () => {
    // Given : une création enregistrée dans le fichier SQLite.
    const { data: liste } = await requete("GET", "/api/pokemons");
    const id = liste[0].id;
    // When : l'application est arrêtée puis redémarrée sur le même fichier.
    await arreter();
    await demarrer();
    // Then : la création est retrouvée.
    expect((await requete("GET", `/api/pokemons/${id}`)).data.nom).toBe("Floréa 2");
  });

  it("répond 404 ou 405 pour une création, une route ou une méthode inconnue", async () => {
    expect((await requete("GET", "/api/pokemons/perso-missing")).status).toBe(404);
    expect((await requete("PUT", "/api/pokemons/perso-missing", pokemon)).status).toBe(404);
    expect((await requete("GET", "/unknown")).status).toBe(404);
    expect((await requete("DELETE", "/api/pokemons")).status).toBe(405);
  });

  it("refuse un contenu mal formé ou d'un mauvais type", async () => {
    expect((await requete("POST", "/api/pokemons", "{bad json")).status).toBe(400);
    expect((await requete("POST", "/api/pokemons", "[]")).status).toBe(400);
    const texte = await requete("POST", "/api/pokemons", pokemon, { "Content-Type": "text/plain" });
    expect(texte.status).toBe(415);
  });

  it("refuse les données invalides avec un code 422", async () => {
    const invalides = [
      { nom: "   " },
      { height: -1 },
      { weight: 1000001 },
      { types: [{ type: { name: "invalid" } }] },
      { stats: [] },
      { sprites: { front_default: "javascript:alert(1)" } },
      { types: "grass" },
    ];
    for (const changement of invalides) {
      const { status } = await requete("POST", "/api/pokemons", { ...pokemon, ...changement });
      expect(status).toBe(422);
    }
  });

  it("importe d'anciennes créations sans doublon et refuse un lot invalide en entier", async () => {
    // Given : une ancienne création avec son identifiant.
    const ancienne = { ...pokemon, id: "perso-legacy-123", isCustom: true };
    const avant = (await requete("GET", "/api/pokemons")).data.length;
    // When : elle est importée deux fois.
    expect((await requete("POST", "/api/pokemons/import", { pokemons: [ancienne] })).status).toBe(
      200,
    );
    await requete("POST", "/api/pokemons/import", { pokemons: [ancienne] });
    // Then : elle n'existe qu'une fois.
    expect((await requete("GET", "/api/pokemons")).data).toHaveLength(avant + 1);

    // When : un lot contient une création invalide.
    const lot = await requete("POST", "/api/pokemons/import", {
      pokemons: [
        { ...ancienne, id: "perso-new" },
        { ...ancienne, nom: "" },
      ],
    });
    // Then : tout le lot est refusé et rien n'est enregistré.
    expect(lot.status).toBe(422);
    expect((await requete("GET", "/api/pokemons/perso-new")).status).toBe(404);
  });

  it("applique les règles CORS du frontend", async () => {
    // When : une requête de pré-vérification vient du frontend autorisé.
    const preflight = await requete("OPTIONS", "/api/pokemons", undefined, { Origin: ORIGIN });
    // Then : elle est acceptée et l'origine est renvoyée.
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get("access-control-allow-origin")).toBe(ORIGIN);
    expect(preflight.headers.get("access-control-allow-methods")).toContain("DELETE");

    // When : une origine inconnue tente d'écrire.
    const avant = (await requete("GET", "/api/pokemons")).data.length;
    const refus = await requete("POST", "/api/pokemons", pokemon, {
      Origin: "https://untrusted.example",
    });
    // Then : elle est refusée et rien n'est écrit.
    expect(refus.status).toBe(403);
    expect((await requete("GET", "/api/pokemons")).data).toHaveLength(avant);
  });
});

describe("app Integration Test Suites (stockage indisponible)", () => {
  it("répond 503 quand la base ne peut pas être ouverte", async () => {
    // Given : un chemin de base impossible à créer (un fichier sert de dossier parent).
    const fichier = join(tmpdir(), `pokedex-fichier-${randomBytes(4).toString("hex")}`);
    const { writeFileSync } = await import("node:fs");
    writeFileSync(fichier, "x");
    const app = createApp({ databasePath: join(fichier, "base.sqlite"), allowedOrigins: [] });
    const server = await new Promise((resolve) => {
      const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
    });
    // When : la liste est demandée.
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/pokemons`);
    // Then : le serveur répond 503 avec un message en français.
    expect(response.status).toBe(503);
    expect((await response.json()).error).toMatch(/indisponible/);
    await new Promise((resolve) => server.close(resolve));
    rmSync(fichier);
  });
});
