import { Dexie } from "dexie";

describe("Dexie Class Addon", () => {
  afterAll(async () => {
    const allDatabases = await Dexie.getDatabaseNames();
    await Promise.all(allDatabases.map((dbName) => Dexie.delete(dbName)));
  });

  /*
   * Require all test files in uni-tests for webpack compilation.
   */
  const karmaContextImmutable = (require as any).context(
    "./",
    true,
    /\.spec\.tsx?$/
  );
  karmaContextImmutable.keys().forEach(karmaContextImmutable);
});
