import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import initSqlJs from "sql.js";

// Stockage SQLite avec sql.js (SQLite compilé en WebAssembly : aucune compilation native).
// La base est chargée en mémoire puis réécrite sur le disque après chaque modification.
// Le format du fichier reste celui de SQLite : table pokemons (id, payload JSON, created_at).
export default class PokemonRepository {
  constructor(database, path) {
    this.database = database;
    this.path = path;
  }

  static async open(path) {
    const SQL = await initSqlJs();
    const persistent = path !== ":memory:";
    if (persistent) mkdirSync(dirname(path), { recursive: true });
    const database =
      persistent && existsSync(path) ? new SQL.Database(readFileSync(path)) : new SQL.Database();
    database.run(`CREATE TABLE IF NOT EXISTS pokemons (
      id TEXT PRIMARY KEY, payload TEXT NOT NULL, created_at TEXT NOT NULL
    )`);
    const repository = new PokemonRepository(database, persistent ? path : null);
    repository.#persist();
    return repository;
  }

  // Écriture atomique : fichier temporaire puis renommage.
  #persist() {
    if (!this.path) return;
    const temporary = `${this.path}.tmp`;
    writeFileSync(temporary, Buffer.from(this.database.export()));
    renameSync(temporary, this.path);
  }

  #rows(sql, params = []) {
    const statement = this.database.prepare(sql);
    try {
      statement.bind(params);
      const rows = [];
      while (statement.step()) rows.push(statement.getAsObject());
      return rows;
    } finally {
      statement.free();
    }
  }

  all() {
    return this.#rows("SELECT payload FROM pokemons ORDER BY created_at DESC, rowid DESC").map(
      ({ payload }) => JSON.parse(payload),
    );
  }

  find(id) {
    const [row] = this.#rows("SELECT payload FROM pokemons WHERE id = ?", [id]);
    return row ? JSON.parse(row.payload) : null;
  }

  #insert(pokemon) {
    this.database.run("INSERT INTO pokemons (id, payload, created_at) VALUES (?, ?, ?)", [
      pokemon.id,
      JSON.stringify(pokemon),
      new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    ]);
  }

  save(pokemon) {
    this.#insert(pokemon);
    this.#persist();
    return pokemon;
  }

  // Remplace le contenu d'une création en conservant son identifiant et sa date de création.
  update(pokemon) {
    this.database.run("UPDATE pokemons SET payload = ? WHERE id = ?", [
      JSON.stringify(pokemon),
      pokemon.id,
    ]);
    const changed = this.database.getRowsModified() > 0;
    if (changed) this.#persist();
    return changed;
  }

  delete(id) {
    this.database.run("DELETE FROM pokemons WHERE id = ?", [id]);
    const changed = this.database.getRowsModified() > 0;
    if (changed) this.#persist();
    return changed;
  }

  // Les identifiants existants sont conservés : importer deux fois ne crée pas de doublons.
  import(pokemons) {
    this.database.run("BEGIN");
    try {
      for (const pokemon of pokemons) {
        if (!this.find(pokemon.id)) this.#insert(pokemon);
      }
      this.database.run("COMMIT");
    } catch (error) {
      this.database.run("ROLLBACK");
      throw error;
    }
    this.#persist();
    return this.all();
  }

  close() {
    this.database.close();
  }
}
