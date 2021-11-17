/*
 * Require all test files in uni-tests for webpack compilation.
 */
const karmaContextRxjs = (require as any).context('./', true, /\.spec\.tsx?$/);
karmaContextRxjs.keys().forEach(karmaContextRxjs);
