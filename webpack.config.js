const path = require('path');
const LicenseWebpackPlugin = require('license-webpack-plugin').LicenseWebpackPlugin;
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

const bundles = env => {

    const packagePath = env.packagePath;
    const configLib = require('./scripts/build-package-config')(packagePath);
    logConfig(configLib);

    const package = configLib.packagePathName;
    console.log('Building bundles for', package, '\n');

    const base = {
        entry: path.join(packagePath, 'src', 'index.ts'),
        context: packagePath,
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    loader: 'ts-loader',
                    exclude: /node_modules/,
                    options: {
                        configFile: path.join(packagePath, 'tsconfig.json'),
                        compilerOptions: {
                            rootDir: "/",
                            declaration: false,
                            composite: false,
                            tsBuildInfoFile: undefined
                        }
                    }
                }
            ]
        },
        resolve: {
            extensions: ['.tsx', '.ts', '.js', '.json'],
            plugins: [new TsconfigPathsPlugin()]
        },
        devtool: 'source-map'
    }

    const umd = {
        ...base,
        output: {
            filename: 'index.js',
            path: path.resolve(packagePath, 'dist'),
            library: {
                name: configLib.umdName,
                type: 'umd',
                umdNamedDefine: true
            },
            globalObject: 'this'
        },
        mode: 'production',
        optimization: {
            minimize: false
        },
        target: 'web',
        externals: [...configLib.dependenciesMapped, ...configLib.peerDependenciesMapped],
        plugins: [
            new BundleAnalyzerPlugin({
                analyzerMode: 'static',
                openAnalyzer: false,
                reportFilename: path.resolve(packagePath, 'reports', 'umd-webpack-report.html'),
                generateStatsFile: true,
                statsFilename: path.resolve(packagePath, 'reports', 'umd-webpack-stats.json'),
                statsOptions: {
                    source: false,
                    usedExports: true,
                    chunkModules: false
                }
            })
        ]
    }

    const umdMini = {
        ...base,
        output: {
            filename: `${configLib.packageName}.min.js`,
            path: path.resolve(packagePath, 'dist'),
            library: {
                name: configLib.umdName,
                type: 'window',
                umdNamedDefine: true
            },
            globalObject: 'this'
        },
        mode: 'production',
        optimization: {
            minimize: true
        },
        target: 'web',
        externals: [
            ...configLib.peerDependenciesMappedUmdImports
        ],
        plugins: [
            new BundleAnalyzerPlugin({
                analyzerMode: 'static',
                openAnalyzer: false,
                reportFilename: path.resolve(packagePath, 'reports', 'mini-umd-webpack-report.html'),
                generateStatsFile: true,
                statsFilename: path.resolve(packagePath, 'reports', 'mini-umd-webpack-stats.json'),
                statsOptions: {
                    source: false,
                    usedExports: true,
                    chunkModules: false
                }
            })
        ]
    }

    // Add some plugins not relevant to build
    umdMini.plugins = [
        ...(umd.plugins || []),

        new LicenseWebpackPlugin({
            perChunkOutput: false,
            outputFilename: 'third-party-licenses'
        })
    ]

    return [
        umd,
        umdMini
    ];
};


function logConfig(configLib) {
    const depMax = 10;
    const log = Object.entries(configLib).reduce((acc, [key, value]) => {
        if (Array.isArray(value)) {
            value = value.length > depMax ?
                [...value.slice(0, depMax), `...${value.length - depMax} more`] :
                value;
        }
        return { ...acc, [key]: value };
    }, {});

    console.log('\nUsing config: \n\n', log, '\n');
}

module.exports = bundles;
