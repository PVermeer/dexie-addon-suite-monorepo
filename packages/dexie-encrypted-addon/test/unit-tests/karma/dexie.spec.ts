import { Dexie as DexieImport } from "dexie";
import { encrypted, Encryption } from "../../../src";
import { databasesPositive, Friend, mockFriends } from "../../mocks/mocks.spec";

declare interface DexieEncryptedAddon {
  encrypted: typeof encrypted;
  Encryption: Encryption;
}
declare const Dexie: typeof DexieImport;
declare const DexieEncryptedAddon: DexieEncryptedAddon;

describe("dexie-encrypted-addon dexie.spec", () => {
  describe("Dexie", () => {
    describe("Import es", () => {
      databasesPositive.forEach((database) => {
        describe(database.desc, () => {
          let db: ReturnType<typeof database.db>;
          beforeEach(async () => {
            db = database.db();
            await expectAsync(db.open()).toBeResolved();
            expect(db.isOpen()).toBeTrue();
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
        });
        await new Promise<void>((resolve) => {
          const scriptAddon = document.createElement("script");
          scriptAddon.src = "base/dist/dexie-encrypted-addon.min.js";
          scriptAddon.type = "text/javascript";
          scriptAddon.onload = () => resolve();
          document.head.append(scriptAddon);
        });
      }, 10000);
      it("should load Dexie.js", () => {
        expect(Dexie).toBeTruthy();
      });
      it("should load DexieEncryptionAddon", () => {
        expect(DexieEncryptedAddon).toBeTruthy();
        expect(DexieEncryptedAddon.encrypted).toBeTruthy();
        expect(DexieEncryptedAddon.Encryption).toBeTruthy();
      });
      it("should be able to create a database with encryption", async () => {
        const [friend] = mockFriends(1);
        const db = new Dexie("TestDatabaseHTML", {
          addons: [
            DexieEncryptedAddon.encrypted.setOptions({
              secretKey: Encryption.createRandomEncryptionKey(),
            }),
          ],
        }) as DexieImport & { friends: DexieImport.Table<Friend, string> };
        db.version(1).stores({
          friends: "++#id, firstName, $lastName, $shoeSize, age",
          buddies: "++id, buddyName, buddyAge",
          dudes: "++id, $dudeName, $dudeAge",
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
