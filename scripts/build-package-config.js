// @ts-check
const path = require('path');

var os = require("os").type();

const packageName = (packageName) => {
    const onlyName = packageName.includes('@') ?
        packageName.split('/')[1] :
        packageName;

    return onlyName;
}
const umdName = (packageName) => {
    const onlyName = packageName.includes('@') ?
        packageName.split('/')[1] :
        packageName;

    const pascalCaseName = onlyName.split('-')
        .map(x => x.charAt(0).toUpperCase() + x.slice(1)).join('');
    return pascalCaseName;
}
function mapDependenciesRE(dependencies) {
    return Object.keys(dependencies || {}).reduce((acc, key) => {
        // e.g. match 'lodash' and 'lodash/clone/something' but not 'lodash-es'
        acc.push(new RegExp(`^${key}(\/.*)?$`));
        return acc;
    }, []);
}
function mapPeerDependenciesUmd(dependencies) {
    return Object.keys(dependencies || {}).reduce((acc, key) => {
        switch (key) {

            case 'dexie': acc.push({ 'dexie': 'Dexie' }); break;
            case 'rxjs': acc.push({ 'rxjs': 'rxjs' }); acc.push({ 'rxjs/operators': ['rxjs', 'operators'] }); break;

            default: acc.push(mapDependenciesRE({ [key]: null })[0]);
        }
        return acc;
    }, []);
}


const configLib = (packagePath) => {

    /** @type import('type-fest').PackageJson */
    // @ts-ignore
    const packageJson = require(path.join(packagePath, 'package.json'));

    const config = {

        packageName: packageName(packageJson.name),

        packageScopeAndName: packageJson.name,

        packagePath: packagePath,

        packagePathName: packagePath.split('packages/')[1],

        umdName: umdName(packageJson.name),

        version: packageJson.version,

        dependencies: Object.keys(packageJson.dependencies || {}),

        // If used somehow they must be inlined.
        inlinedLibraries: Object.keys(packageJson.devDependencies || {})
            .filter(x => !Object.keys(packageJson.peerDependencies || {}).includes(x)),

        peerDependencies: Object.keys(packageJson.peerDependencies || {}),

        // Externals for webpack builds
        dependenciesMapped: mapDependenciesRE(packageJson.dependencies),
        peerDependenciesMapped: mapDependenciesRE(packageJson.peerDependencies),
        peerDependenciesMappedUmdImports: mapPeerDependenciesUmd(packageJson.peerDependencies),

        runningOnOs: os

    };

    return config;

};


module.exports = configLib;
