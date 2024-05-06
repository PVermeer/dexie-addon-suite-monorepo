import { Dexie } from "dexie";

describe("Dexie Addon Suite", () => {
  afterAll(async () => {
    const allDatabases = await Dexie.getDatabaseNames();
    await Promise.all(allDatabases.map((dbName) => Dexie.delete(dbName)));
  });

  /*
   * Require all test files in uni-tests for webpack compilation.
   */
  const karmaContextSuite = (require as any).context(
    "./",
    true,
    /\.spec\.tsx?$/
  );
  karmaContextSuite.keys().forEach(karmaContextSuite);
});
