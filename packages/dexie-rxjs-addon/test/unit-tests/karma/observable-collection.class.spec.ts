import { Dexie } from "dexie";
import { ObservableCollection } from "../../../src";
import { databasesPositive } from "../../mocks/mocks.spec";

describe("dexie-rxjs-addon observable-collection.class.spec", () => {
  describe("ObservableCollection class", () => {
    it("should be mixed in with Collection", async () => {
      const db = databasesPositive[0].db(Dexie);
      await db.open();
      const collection = db.friends.where(":id").anyOf();
      expect(collection).toBeTruthy();
      await db.delete();
    });
    it(`should have the correct constructor`, async () => {
      const db = databasesPositive[0].db(Dexie);
      await db.open();
      const collection = db.friends.where(":id").anyOf();
      const collectionClass = new ObservableCollection(
        db,
        db.friends,
        collection
      );
      expect(collectionClass.constructor.name).toBe("ObservableCollection");

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      (collection as any).constructor = function Test() {};
      const whereClass2 = new ObservableCollection(db, db.friends, collection);
      expect(whereClass2.constructor.name).toBe("ObservableCollection");

      await db.delete();
    });
  });
});
