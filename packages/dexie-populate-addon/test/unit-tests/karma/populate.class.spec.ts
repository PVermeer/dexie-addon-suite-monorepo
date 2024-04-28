import { Dexie } from "dexie";
import cloneDeep from "lodash.clonedeep";
import { populate } from "../../../src";
import { Populate } from "../../../src/populate.class";
import { DexieExtended, Populated } from "../../../src/types";
import {
  Club,
  databasesPositive,
  Friend,
  mockClubs,
  mockFriends,
  mockGroups,
  mockHairColors,
  mockStyles,
  mockThemes,
  Style,
  Theme,
} from "../../mocks/mocks.spec";

describe("dexie-populate-addon populate.class.spec", () => {
  describe("Populate class", () => {
    let db: ReturnType<(typeof databasesPositive)[0]["db"]>;
    let friends: Friend[];
    let friend: Friend;
    let id: number;
    let hasFriends: Friend[];
    let hasFriendIds: number[];
    let friendPop: Populated<Friend, false, string>;
    let clubIds: number[];
    let themeIds: number[];
    let groupIds: number[];
    let styleIds: number[];
    let hairColorIds: number[];
    let populatedClass: Populate<Friend, number, Friend, false, string>;

    beforeEach(async () => {
      db = databasesPositive[0].db(Dexie, populate);
      friends = mockFriends();
      [friend, ...hasFriends] = friends;

      const clubs = mockClubs();
      const themes = mockThemes();
      const groups = mockGroups();
      const styles = mockStyles();
      const hairColors = mockHairColors();

      id = await db.friends.add(friend);

      [hasFriendIds, clubIds, themeIds, groupIds, styleIds, hairColorIds] =
        await Promise.all([
          db.friends.bulkAdd(hasFriends, { allKeys: true }),
          db.clubs.bulkAdd(clubs, { allKeys: true }),
          db.themes.bulkAdd(themes, { allKeys: true }),
          db.groups.bulkAdd(groups, { allKeys: true }),
          db.styles.bulkAdd(styles, { allKeys: true }),
          db.hairColors.bulkAdd(hairColors, { allKeys: true }),
        ]);

      await Promise.all([
        db.friends.update(id, {
          hasFriends: hasFriendIds,
          memberOf: clubIds,
          group: groupIds[1],
          hairColor: hairColorIds[1],
        }),
        db.friends.update(hasFriendIds[1], {
          hasFriends: [hasFriendIds[2]],
        }),
        db.clubs.update(clubIds[1], {
          theme: themeIds[1],
        }),
        db.themes.update(themeIds[1], {
          style: styleIds[1],
        }),
      ]);

      friend.hasFriends = hasFriendIds;
      friend.memberOf = clubIds;

      friendPop = cloneDeep(friend) as Populated<Friend, false, string>;
      friendPop.hasFriends = hasFriends as Populated<Friend, false, string>[];
      friendPop.memberOf = clubs as Populated<Club, false, string>[];
      friendPop.memberOf[0]!.theme = themes[0] as Populated<
        Theme,
        false,
        string
      >;

      populatedClass = new Populate<Friend, number, Friend, false, string>(
        [friend],
        undefined,
        { shallow: false },
        db as unknown as DexieExtended,
        db.friends,
        (db as unknown as DexieExtended)._relationalSchema
      );
    });
    afterEach(async () => {
      await db.delete();
    });

    it("should populate", async () => {
      const [getFriendPop] = await populatedClass.populated;
      expect(getFriendPop.hasFriends.length).toBeTruthy();
      expect(getFriendPop.hasFriends.every((x) => x instanceof Friend));
      expect(getFriendPop.memberOf.length).toBeTruthy();
      expect(getFriendPop.memberOf.every((x) => x instanceof Club));
      expect(getFriendPop.memberOf[1]!.theme instanceof Theme).toBeTrue();
      expect(
        getFriendPop.memberOf[1]!.theme!.style instanceof Style
      ).toBeTrue();
    });
    it("should memoize populated result", async () => {
      const [getFriendPop] = await populatedClass.populated;
      const [getFriendPop2] = await populatedClass.populated;
      expect(getFriendPop).toBe(getFriendPop2);
    });
    it("should memoize populatedWith result", async () => {
      const popWith = await populatedClass.populatedTree;
      const popWith2 = await populatedClass.populatedTree;
      expect(popWith).toBe(popWith2);
    });
    it("should have matching populatedWith result", async () => {
      const popWith = await populatedClass.populatedTree;
      const expected = {
        friends: {
          id: [2, 3, 4, 5],
        },
        clubs: {
          id: [1, 2, 3, 4, 5],
        },
        themes: {
          id: [2],
        },
        styles: {
          styleId: [2],
        },
      };
      expect(popWith).toEqual(expected);
    });
    it("should return [] when input === undefined || [] on populated getter", async () => {
      const populateC = new Populate<Friend, number, Friend, false, string>(
        undefined,
        undefined,
        { shallow: false },
        db as unknown as DexieExtended,
        db.friends,
        (db as unknown as DexieExtended)._relationalSchema
      );
      const populated = await populateC.populated;
      expect(populated).toEqual([]);
    });
    it("should return {} when input === undefined || [] on Tree getter", async () => {
      const populateC = new Populate<Friend, number, Friend, false, string>(
        undefined,
        undefined,
        { shallow: false },
        db as unknown as DexieExtended,
        db.friends,
        (db as unknown as DexieExtended)._relationalSchema
      );
      const populatedTree = await populateC.populatedTree;
      expect(populatedTree).toEqual({});
    });
  });
});
