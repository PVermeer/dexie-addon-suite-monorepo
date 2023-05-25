import type { Dexie as DexieImport } from "dexie";
import { classMap } from "../../../src";
import { databasesPositive, Friend, mockFriends } from "../../mocks/mocks.spec";

declare interface DexieClassAddon {
  classMap: typeof classMap;
}
declare const Dexie: typeof DexieImport;
declare const DexieClassAddon: DexieClassAddon;

describe("dexie-class-addon dexie.spec", () => {
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
          scriptDexie.src = "https://unpkg.com/dexie@latest/dist/dexie.js";
          scriptDexie.type = "text/javascript";
          scriptDexie.onload = () => resolve();
          document.head.append(scriptDexie);
        }),
          await new Promise<void>((resolve) => {
            const scriptAddon = document.createElement("script");
            scriptAddon.src = "/base/dist/dexie-class-addon.min.js";
            scriptAddon.type = "text/javascript";
            scriptAddon.onload = () => resolve();
            document.head.append(scriptAddon);
          });
      }, 10000);
      it("should load Dexie.js", () => {
        expect(Dexie).toBeTruthy();
      });
      it("should load DexieClassAddon", () => {
        expect(DexieClassAddon).toBeTruthy();
        expect(DexieClassAddon.classMap).toBeTruthy();
      });
      it("should be able to create a database", async () => {
        const serializeSpy = spyOn(
          Friend.prototype,
          "serialize"
        ).and.callThrough();
        const deSerializeSpy = spyOn(
          Friend.prototype,
          "deserialize"
        ).and.callThrough();

        const [friend] = mockFriends(1);
        const db = new Dexie("TestDatabaseHTML", {
          addons: [DexieClassAddon.classMap],
        }) as DexieImport & { friends: DexieImport.Table<Friend, number> };
        db.version(1).stores({
          friends: "++id",
        });
        db["friends"].mapToClass(Friend);

        await db.open();

        const id = await db.friends.add(friend);
        expect(serializeSpy).toHaveBeenCalled();
        friend.id = id;

        const getFriend = await db.friends.get(id);
        expect(deSerializeSpy).toHaveBeenCalled();
        expect(getFriend).toEqual(friend);
        expect(getFriend).toBeInstanceOf(Friend);
        expect(getFriend?.someMethod).toBeDefined();
        expect(getFriend?.date).toBeInstanceOf(Date);
        await db.delete();
      });
    });
  });
});
