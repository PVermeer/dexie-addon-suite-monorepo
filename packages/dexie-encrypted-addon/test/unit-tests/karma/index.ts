/*
 * Require all test files in uni-tests for webpack compilation.
 */
const karmaContextEncrypted = (require as any).context(
  "./",
  true,
  /\.spec\.tsx?$/
);
karmaContextEncrypted.keys().forEach(karmaContextEncrypted);
