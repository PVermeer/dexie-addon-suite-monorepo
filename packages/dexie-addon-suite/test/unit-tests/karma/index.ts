/*
 * Require all test files in uni-tests for webpack compilation.
 */
const karmaContextSuite = (require as any).context("./", true, /\.spec\.tsx?$/);
karmaContextSuite.keys().forEach(karmaContextSuite);
