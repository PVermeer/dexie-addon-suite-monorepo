import { Dexie as DexieType } from "dexie";
import cloneDeep from "lodash.clonedeep";
import { populate } from "../../../src/index";
import { Populated } from "../../../src/types";
import { databasesPositive, Friend, mockFriends } from "../../mocks/mocks.spec";

declare interface DexiePopulateAddon {
  populate: typeof populate;
}
declare const Dexie: typeof DexieType;
declare const DexiePopulateAddon: DexiePopulateAddon;

describe("dexie-populate-addon html.spec", () => {
  describe("HTML script tag", () => {
    beforeAll(async () => {
      await Promise.all([
        await new Promise<void>((resolve) => {
          const script = document.createElement("script");
          script.src = "https://unpkg.com/dexie@3/dist/dexie.js";
          script.type = "text/javascript";
          script.onload = () => resolve();
          document.head.append(script);
        }),
      ]);
      await new Promise<void>((resolve) => {
        const script = document.createElement("script");
        script.src = `/base/dist/dexie-populate-addon.min.js`;
        script.type = "text/javascript";
        script.onload = () => resolve();
        document.head.append(script);
      });
    }, 10000);
    it("should load Dexie.js", () => {
      expect(Dexie).toBeTruthy();
    });
    it("should load the addon", () => {
      expect(DexiePopulateAddon).toBeTruthy();
      expect(DexiePopulateAddon.populate).toBeTruthy();
    });
    databasesPositive.forEach((database) => {
      describe(database.desc, () => {
        let db: ReturnType<typeof database.db>;
        beforeEach(async () => {
          db = database.db(Dexie, DexiePopulateAddon.populate);
          await db.open();
          expect(db.isOpen()).toBeTrue();
        });
        afterEach(async () => {
          await db.delete();
        });
        it("should be able to use normally", async () => {
          const [friend] = mockFriends(1);
          const id = await db.friends.add(friend);
          const getFriend = await db.friends.get(id);
          expect({ ...getFriend }).toEqual({ ...friend });
        });
        describe("Methods", () => {
          // if (_j !== 0) { return; }
          let hasFriends: Friend[];
          let friend: Friend;
          let id: number;
          let hasFriendIds: number[];
          let friendPop: Populated<Friend, false, string>;

          describe("Populate", () => {
            beforeEach(async () => {
              const friends = mockFriends();
              [friend, ...hasFriends] = friends;
              id = await db.friends.add(friend);
              hasFriendIds = await Promise.all(
                hasFriends.map((x) => db.friends.add(x))
              );

              const result = await db.friends.update(id, {
                hasFriends: hasFriendIds,
              });
              if (result !== 1) throw new Error("Friend update failed");

              friend.hasFriends = hasFriendIds;
              friendPop = cloneDeep(friend) as Populated<Friend, false, string>;
              friendPop.hasFriends = cloneDeep(hasFriends) as Populated<
                Friend,
                false,
                string
              >[];
            });
            it("should be able to use populate()", async () => {
              const getFriend = await db.friends.populate().get(id);
              expect(getFriend).toEqual(friendPop);
            });
          });
        });
      });
    });
  });
});
