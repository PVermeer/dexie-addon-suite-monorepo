// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

const path = require('path');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const isWsl = require('is-wsl');

/*
 * Using webpack for much better debug experience with tests.
 */

module.exports = function (config) {

    if (!config.context) { throw 'No context passed!'; }
    const context = config.context;
    const configLib = require('./scripts/build-package-config')(context);

    if (isWsl && !process.env['CHROME_BIN']) {
        process.env['CHROME_BIN'] = '/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe';
    }

    const baseConfig = {
        basePath: './',
        files: [
            path.join(context, 'test', 'unit-tests', 'karma', 'index.ts'),
            // Serve dist folder so files can be loaded when needed in tests
            { pattern: './dist/' + configLib.packagePathName + '/**/*.+(js|map)', included: false, watched: true }
        ],
        frameworks: ['jasmine', 'webpack'],
        plugins: [
            'karma-jasmine',
            'karma-webpack',
            'karma-chrome-launcher',
            'karma-mocha-reporter',
            'karma-jasmine-html-reporter'
        ],
        preprocessors: {
            "**/*.ts": ['webpack'],
        },
        webpack: {
            mode: 'development',
            performance: { hints: false },
            module: {
                rules: [
                    {
                        test: /\.tsx?$/,
                        loader: 'ts-loader',
                        exclude: /node_modules/,
                        options: {
                            transpileOnly: true,
                            compilerOptions: {
                                sourceMap: true,
                                declaration: false,
                                module: "CommonJS",
                                moduleResolution: "node",
                                removeComments: false,
                                esModuleInterop: true,
                                noUnusedLocals: false,
                                noUnusedParameters: false,
                                noImplicitAny: false,
                                composite: false
                            }
                        }
                    }
                ]
            },
            resolve: {
                extensions: ['.tsx', '.ts', '.js', '.json'],
                plugins: [new TsconfigPathsPlugin()]
            },
            devtool: 'inline-source-map',
            plugins: [
                new ForkTsCheckerWebpackPlugin()
            ]
        },
        webpackMiddleware: {
            stats: 'errors-only'
        },
        client: {
            clearContext: false // leave Jasmine Spec Runner output visible in browser
        },
        customLaunchers: {
            ChromeDebug: {
                base: 'Chrome',
                flags: [
                    '--remote-debugging-port=9333'
                ]
            }
        },
        browsers: ['ChromeDebug'],
        reporters: ['mocha', 'kjhtml'],
        mochaReporter: {
            ignoreSkipped: true
        },
        jasmineHtmlReporter: {
            suppressFailed: true
        },
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        browserConsoleLogOptions: {
            level: 'off',
            terminal: false
        },
        autoWatch: true,
        singleRun: false,
        restartOnFileChange: true
    }

    const configOptions = {
        ...baseConfig,

        autoWatch: false,
        singleRun: true,
        restartOnFileChange: false
    };

    const debugOptions = {
        ...baseConfig,

        autoWatch: true,
        singleRun: false,
        restartOnFileChange: true
    }

    config.set(config.debug ? debugOptions : configOptions);
}
