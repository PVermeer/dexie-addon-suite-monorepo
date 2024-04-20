// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

const path = require("path");
const fs = require("fs");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const isCI = process.env["CI"];
const isDocker = fs.existsSync("/.dockerenv");
const puppeteer = require("puppeteer");

/*
 * Using webpack for much better debug experience with tests.
 */

module.exports = function (config) {
  if (!config.context) {
    throw "No context passed!";
  }
  const context = config.context;
  const hasBuild = fs.existsSync(path.join(context, "dist"));

  if (!hasBuild) {
    throw "Please build before running tests";
  }

  const configLib = require("./scripts/build-package-config")(context);
  process.env.CHROME_BIN = puppeteer.executablePath();

  const baseConfig = {
    basePath: context,
    files: [
      path.join(context, "test", "unit-tests", "karma", "index.ts"),
      // Serve dist folder so files can be loaded when needed in tests
      { pattern: "dist/**/*.+(js|map)", included: false, watched: true },
    ],
    frameworks: ["jasmine", "webpack"],
    plugins: [
      "karma-jasmine",
      "karma-webpack",
      "karma-chrome-launcher",
      "karma-firefox-launcher",
      "karma-mocha-reporter",
      "karma-jasmine-html-reporter",
      "karma-jasmine-seed-reporter",
    ],
    preprocessors: {
      "**/*.ts": ["webpack"],
    },
    webpack: {
      mode: "development",
      performance: { hints: false },
      module: {
        rules: [
          {
            test: /\.tsx?$/,
            loader: "ts-loader",
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
                composite: false,
              },
            },
          },
        ],
      },
      resolve: {
        extensions: [".tsx", ".ts", ".js", ".json"],
        plugins: [new TsconfigPathsPlugin()],
      },
      devtool: "inline-source-map",
      plugins: [new ForkTsCheckerWebpackPlugin()],
    },
    webpackMiddleware: {
      stats: "errors-only",
    },
    client: {
      clearContext: false, // leave Jasmine Spec Runner output visible in browser
      jasmine: {
        random: true,
        seed: process.env["JASMINE_SEED"],
        // seed: "28209",
      },
    },
    customLaunchers: {
      ChromeDebug: {
        base: "Chrome",
        flags: ["--remote-debugging-port=9222"],
      },
      ChromeHeadless_no_sandbox: {
        base: "ChromeHeadless",
        flags: ["--no-sandbox", "--remote-debugging-port=9333"],
      },
    },
    browsers: ["ChromeDebug"],
    reporters: ["mocha", "kjhtml", "jasmine-seed"],
    mochaReporter: {
      ignoreSkipped: true,
    },
    jasmineHtmlReporter: {
      suppressFailed: true,
    },
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    browserConsoleLogOptions: {
      level: "off",
      terminal: false,
    },
    parallelOptions: {
      // Lerna lready runs tests in parallel
      executors: 2, // Defaults to cpu-count - 1
    },
    retryLimit: 0,
    autoWatch: false,
    singleRun: true,
    restartOnFileChange: false,
  };

  const parallelOptions = {
    ...baseConfig,

    frameworks: ["parallel", ...baseConfig.frameworks],
    plugins: ["karma-parallel", ...baseConfig.plugins],
  };

  const ciOptions = {
    ...parallelOptions,

    retryLimit: 2,
    browsers: ["ChromeHeadless_no_sandbox"],
  };

  const debugOptions = {
    ...baseConfig,

    autoWatch: true,
    singleRun: false,
    restartOnFileChange: true,
  };

  const dockerOptions = {
    ...parallelOptions,

    retryLimit: 2,
    browsers: ["ChromeHeadless_no_sandbox"],
  };

  const debugDockerOptions = {
    ...debugOptions,
    browsers: ["ChromeHeadless_no_sandbox"],
  };

  if (isCI) config.set(ciOptions);
  else if (config.debug && isDocker) config.set(debugDockerOptions);
  else if (config.debug) config.set(debugOptions);
  else if (isDocker) config.set(dockerOptions);
  else config.set(parallelOptions);
};
