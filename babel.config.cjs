module.exports = {
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }],
    ["@babel/preset-react", { runtime: "automatic" }],
  ],
  plugins: [
    // Jest ne passe pas par Vite : lire les variables de test depuis process.env.
    function variablesVitePourJest({ types }) {
      return {
        visitor: {
          MemberExpression(path) {
            const { object, property } = path.node;
            if (
              types.isMetaProperty(object) &&
              object.meta.name === "import" &&
              object.property.name === "meta" &&
              types.isIdentifier(property, { name: "env" })
            ) {
              path.replaceWith(
                types.memberExpression(types.identifier("process"), types.identifier("env")),
              );
            }
          },
        },
      };
    },
  ],
};
