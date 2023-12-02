// @ts-check

// Extend scopes for dependabot
const configLernaScopes = require("@commitlint/config-lerna-scopes");
const scopeEnum = async (context) => {
  const lernaScopes = await configLernaScopes.rules["scope-enum"](context);
  const [level, applicable, scopes] = lernaScopes;
  return [level, applicable, [...scopes, "deps", "deps-dev", "dev"]];
};

module.exports = {
  extends: [
    "@commitlint/config-conventional",
    "@commitlint/config-lerna-scopes",
  ],
  rules: {
    "scope-enum": scopeEnum,
  },
};
