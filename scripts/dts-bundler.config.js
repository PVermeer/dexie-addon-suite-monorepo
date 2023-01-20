// @ts-check
const packagePath = process.env["packagePath"];
if (!packagePath) throw new Error("package path is undefined");
const path = require("path");
const configLib = require("./build-package-config")(packagePath);

/** @type import('dts-bundle-generator/config-schema').BundlerConfig */
const config = {
  compilationOptions: {
    preferredConfigPath: path.join("..", "tsconfig.json"),
  },

  entries: [
    {
      filePath: path.join(packagePath, "src", "index.ts"),
      outFile: path.join(packagePath, "dist", "index.d.ts"),
      output: {
        umdModuleName: configLib.umdName,
        inlineDeclareExternals: true,
        exportReferencedTypes: false,
      },
      libraries: {
        inlinedLibraries: [],
      },
    },
  ],
};

module.exports = config;
