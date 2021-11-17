/*
 * Require all test files in uni-tests for webpack compilation.
 */
const karmaContext = (require as any).context('./', true, /\.spec\.tsx?$/);
karmaContext.keys().forEach(karmaContext);
