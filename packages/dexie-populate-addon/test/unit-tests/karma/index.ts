/*
 * Require all test files in uni-tests for webpack compilation.
 */
const karmaContextPopulate = (require as any).context(
  "./",
  true,
  /\.spec\.tsx?$/
);
karmaContextPopulate.keys().forEach(karmaContextPopulate);
