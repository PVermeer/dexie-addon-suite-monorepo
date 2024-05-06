import { Dexie } from "dexie";

describe("Dexie Populate Addon", () => {
  afterAll(async () => {
    const allDatabases = await Dexie.getDatabaseNames();
    await Promise.all(allDatabases.map((dbName) => Dexie.delete(dbName)));
  });

  /*
   * Require all test files in uni-tests for webpack compilation.
   */
  const karmaContextPopulate = (require as any).context(
    "./",
    true,
    /\.spec\.tsx?$/
  );
  karmaContextPopulate.keys().forEach(karmaContextPopulate);
});
