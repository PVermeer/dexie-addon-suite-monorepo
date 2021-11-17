const path = require('path');
const packagePath = process.env['packagePath'];
console.log(packagePath);
const configLib = require('./build-package-config')(packagePath);


/** @type import('dts-bundle-generator/config-schema').BundlerConfig */
const config = {

    compilationOptions: {
        preferredConfigPath: '../tsconfig.json'
    },

    entries: [
        {
            filePath: path.join(packagePath, 'src', 'index.ts'),
            outFile: path.join('..', 'dist', configLib.packagePathName, 'index.d.ts'),
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
