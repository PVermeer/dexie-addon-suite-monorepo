import type { Dexie as DexieImport } from "dexie";
import { immutable } from "../../../src";
import { databasesPositive, Friend, mockFriends } from "../../mocks/mocks.spec";

declare interface DexieImmutableAddon {
  immutable: typeof immutable;
}
declare const Dexie: typeof DexieImport;
declare const DexieImmutableAddon: DexieImmutableAddon;

describe("dexie-immutable-addon dexie.spec", () => {
  describe("Dexie", () => {
    describe("Import es", () => {
      databasesPositive.forEach((database) => {
        describe(database.desc, () => {
          let db: ReturnType<typeof database.db>;
          beforeEach(async () => {
            db = database.db();
            await db.open();
          });
          afterEach(async () => {
            await db.delete();
          });
          it("should create database", async () => {
            expect(db).toBeTruthy();
            expect(db.isOpen()).toBeTrue();
          });
        });
      });
    });
    describe("HTML script tag", () => {
      beforeAll(async () => {
        await new Promise<void>((resolve) => {
          const scriptDexie = document.createElement("script");
          scriptDexie.src = "https://unpkg.com/dexie@3/dist/dexie.js";
          scriptDexie.type = "text/javascript";
          scriptDexie.onload = () => resolve();
          document.head.append(scriptDexie);
        }),
          await new Promise<void>((resolve) => {
            const scriptAddon = document.createElement("script");
            scriptAddon.src = "/base/dist/dexie-immutable-addon.min.js";
            scriptAddon.type = "text/javascript";
            scriptAddon.onload = () => resolve();
            document.head.append(scriptAddon);
          });
      }, 10000);
      it("should load Dexie.js", () => {
        expect(Dexie).toBeTruthy();
      });
      it("should load DexieImmutableAddon", () => {
        expect(DexieImmutableAddon).toBeTruthy();
        expect(DexieImmutableAddon.immutable).toBeTruthy();
      });
      it("should be able to create a database", async () => {
        const [friend] = mockFriends(1);
        const db = new Dexie("TestDatabaseHTML", {
          addons: [DexieImmutableAddon.immutable],
        }) as DexieImport & { friends: DexieImport.Table<Friend, number> };
        db.version(1).stores({
          friends: "++id, firstName, lastName, shoeSize, age",
          buddies: "++id, buddyName, buddyAge",
          dudes: "++id, dudeName, dudeAge",
          empty: "",
        });

        await db.open();

        const id = await db.friends.add(friend);
        const getFriend = await db.friends.get(id);
        expect(getFriend).toEqual({ ...friend, id });
        await db.delete();
      });
    });
  });
});
