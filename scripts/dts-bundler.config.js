const path = require('path');
const packagePath = process.env['packagePath'];
const configLib = require('./build-package-config')(packagePath);


/** @type import('dts-bundle-generator/config-schema').BundlerConfig */
const config = {

    compilationOptions: {
        preferredConfigPath: path.join('..', 'tsconfig.json')
    },

    entries: [
        {
            filePath: path.join(packagePath, 'src', 'index.ts'),
            outFile: path.join(packagePath, 'dist', 'index.d.ts'),
            monorepo: {
                packagesPath: path.join(packagePath, '..'),
                packageJsonPath: packagePath + '/package.json'
            },
            output: {
                umdModuleName: configLib.umdName,
                inlineDeclareExternals: true,
                exportReferencedTypes: false
            },
            libraries: {
                inlinedLibraries: []
            }
        }
    ]
};

module.exports = config;
