// Comme dans le cours : Jest trouve les fichiers *.test.js placés à côté du code testé.
// L'environnement DOM est demandé dans chaque fichier par /** @jest-environment jsdom */.
module.exports = {
  roots: ["<rootDir>/src", "<rootDir>/backend"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  clearMocks: true,
  restoreMocks: true,
  transform: { "^.+\\.[jt]sx?$": "babel-jest" },
  collectCoverageFrom: [
    "src/**/*.{js,jsx}",
    "backend/**/*.js",
    "!src/main.jsx",
    "!backend/server.js",
    "!**/*.test.{js,jsx}",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "html", "lcov"],
};
