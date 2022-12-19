/*
 * Require all test files in uni-tests for webpack compilation.
 */
const karmaContextImmutable = (require as any).context(
  "./",
  true,
  /\.spec\.tsx?$/
);
karmaContextImmutable.keys().forEach(karmaContextImmutable);
