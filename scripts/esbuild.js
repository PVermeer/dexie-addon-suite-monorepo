const { build } = require("esbuild");
const { join } = require("path");
const packagePath = process.env["packagePath"];
const configLib = require("./build-package-config")(packagePath);

const esmBuild = {
  entryPoints: [join(packagePath, "src", "index.ts")],
  outfile: join(packagePath, "dist", "index.mjs"),
  format: "esm",
  minify: false,
  bundle: true,
  sourcemap: true,
  target: "es2017",
  external: [...configLib.dependencies, ...configLib.peerDependencies],
};

const esmMiniBuild = {
  ...esmBuild,
  outfile: join(packagePath, "dist", `${configLib.packageName}.min.mjs`),
  minify: true,
  external: configLib.peerDependencies,
};

build(esmBuild)
  .then(() => build(esmMiniBuild))
  .catch(() => process.exit(1));
