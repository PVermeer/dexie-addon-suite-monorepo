/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Dexie } from "dexie";
import cloneDeep from "lodash.clonedeep";
import { populate } from "../../../src";
import { DexieExtended, Populated } from "../../../src/types";
import {
  Club,
  databasesPositive,
  Friend,
  Group,
  HairColor,
  methodsNegative,
  methodsPositive,
  mockClubs,
  mockFriends,
  mockGroups,
  mockHairColors,
  mockStyles,
  mockThemes,
  Style,
  testDatabaseNoRelationalKeys,
  testDatabaseNoTableForRelationalKeys,
  Theme,
} from "../../mocks/mocks.spec";

describe("dexie-populate-addon populate.spec", () => {
  describe("Populate", () => {
    databasesPositive.forEach((database, _i) => {
      // if (_i !== 0) { return; }
      describe(database.desc, () => {
        let db: ReturnType<typeof database.db>;

        let friend: Friend;
        let id: number;
        let updateId: number;
        let friendPop: Populated<Friend, false, string>;

        let hasFriends: Friend[];
        let hasFriendIds: number[];

        let clubs: Club[];
        let clubIds: number[];

        let themes: Theme[];
        let themeIds: number[];

        let groups: Group[];
        let groupIds: number[];

        let styles: Style[];
        let styleIds: number[];

        let hairColors: HairColor[];
        let hairColorIds: number[];

        beforeEach(async () => {
          db = database.db(Dexie, populate);
          await db.open();
          expect(db.isOpen()).toBeTrue();

          [friend, ...hasFriends] = mockFriends();
          clubs = mockClubs();
          themes = mockThemes();
          groups = mockGroups();
          styles = mockStyles();
          hairColors = mockHairColors();

          id = await db.friends.add(friend);
          updateId =
            database.desc !== "TestDatabaseCustomKey" && id > 1000000 ? 1 : id;

          hasFriendIds = await Promise.all(
            hasFriends.map((x) => db.friends.add(x))
          );
          clubIds = await Promise.all(clubs.map((x) => db.clubs.add(x)));
          themeIds = await Promise.all(themes.map((x) => db.themes.add(x)));
          groupIds = await Promise.all(groups.map((x) => db.groups.add(x)));
          styleIds = await Promise.all(styles.map((x) => db.styles.add(x)));
          hairColorIds = await Promise.all(
            hairColors.map((x) => db.hairColors.add(x))
          );

          await db.friends.update(updateId, {
            hasFriends: hasFriendIds,
            memberOf: clubIds,
            group: groupIds[1],
            hairColor: hairColorIds[1],
          });
          await db.friends.update(hasFriendIds[1], {
            hasFriends: [hasFriendIds[2]],
          });
          await db.clubs.update(clubIds[1], {
            theme: themeIds[1],
          });
          await db.themes.update(themeIds[1], {
            style: styleIds[1],
          });

          friend.hasFriends = hasFriendIds;
          friend.memberOf = clubIds;
          friend.group = groupIds[1];
          friend.hairColor = hairColorIds[1];

          const hasFriendsPop = cloneDeep(hasFriends) as Populated<
            Friend,
            false,
            string
          >[];
          hasFriendsPop[1].hasFriends[0] = hasFriends[2] as Populated<
            Friend,
            false,
            string
          >;

          friendPop = cloneDeep(friend) as Populated<Friend, false, string>;
          friendPop.hasFriends = hasFriendsPop;
          friendPop.memberOf = clubs as Populated<Club, false, string>[];
          friendPop.memberOf[1]!.theme = themes[1] as Populated<
            Theme,
            false,
            string
          >;
          friendPop.memberOf[1]!.theme.style = styles[1];
          friendPop.group = groups[1];
          friendPop.hairColor = hairColors[1];
        });
        afterEach(async () => {
          await db.delete();
        });
        it("should have addon registered", () => {
          const dbExt = db as unknown as DexieExtended;
          expect(dbExt.pVermeerAddonsRegistered.populate).toBeTrue();
        });
        it("should have extra properties", () => {
          expect(Object.keys(db)).toEqual(
            jasmine.arrayContaining(["_relationalSchema", "_storesSpec"])
          );
        });
        describe("Methods", () => {
          methodsPositive.forEach((_method, _j) => {
            // if (_j !== 0) { return; }
            let method: ReturnType<typeof _method.method>;

            describe(_method.desc, () => {
              beforeEach(async () => {
                method = _method.method(db);
              });
              if (_method.populated) {
                describe("Populated", () => {
                  if (_method.index) {
                    describe("Indices", () => {
                      it("should index memberOf", async () => {
                        const getFriend = await method(groupIds[1]);
                        expect(getFriend).toEqual(friendPop);
                      });
                      if (_method.multiIndex) {
                        it("should multiIndex memberOf", async () => {
                          const getFriend = await method(clubIds[1]);
                          expect(getFriend).toEqual(friendPop);
                        });
                      }
                    });
                  } else {
                    it("should be populated with friends", async () => {
                      const getFriend = await method(id);
                      // @ts-ignore
                      expect(
                        getFriend!.hasFriends!.every(
                          (x: any) => x instanceof Friend
                        )
                      ).toBeTrue();
                    });
                    it("should be populated with friends deep", async () => {
                      const getFriend = await method(id);
                      expect(
                        (
                          getFriend!.hasFriends! as Populated<
                            Friend,
                            false,
                            string
                          >[]
                        )[1].hasFriends![0] instanceof Friend
                      ).toBeTrue();
                    });
                    it("should be populated with clubs", async () => {
                      const getFriend = await method(id);
                      // @ts-ignore
                      expect(
                        getFriend!.memberOf!.every(
                          (x: any) => x instanceof Club
                        )
                      ).toBeTrue();
                    });
                    it("should be null if not found", async () => {
                      await db.friends.update(updateId, {
                        hasFriends: [9999],
                        hairColor: 8888,
                      });
                      const getFriend = await method(id);
                      expect(getFriend!.hasFriends![0]).toBe(null);
                      expect(getFriend!.hairColor).toBe(null);
                    });
                    it("should be null if not found deep", async () => {
                      await db.friends.update(hasFriendIds[0], {
                        hasFriends: [9999],
                        hairColor: 8888,
                      });
                      const getFriend = await method(id);
                      expect(
                        (
                          getFriend!.hasFriends! as Populated<
                            Friend,
                            false,
                            string
                          >[]
                        )[0].hasFriends![0]
                      ).toBe(null);
                      expect(
                        (
                          getFriend!.hasFriends! as Populated<
                            Friend,
                            false,
                            string
                          >[]
                        )[0].group
                      ).toBe(null);
                    });
                    if (!_method.desc.endsWith("each()")) {
                      it("should throw when circulair references are found", async () => {
                        await db.friends.update(updateId, { hasFriends: [id] });
                        await expectAsync(
                          method(id) as Promise<any>
                        ).toBeRejectedWithError(
                          "DEXIE POPULATE ADDON: Circular reference detected on 'hasFriends'. 'hasFriends' Probably contains a reference to itself."
                        );
                      });
                    }
                    if (_method.populatedPartial) {
                      it("should be populated with theme", async () => {
                        const getFriend = (await method(
                          id
                        )) as Populated<Friend>;
                        expect(
                          getFriend.memberOf[1]?.theme instanceof Theme
                        ).toBeTrue();
                      });
                      it("should be populated with style", async () => {
                        const getFriend = (await method(
                          id
                        )) as Populated<Friend>;
                        expect(
                          getFriend!.memberOf[1]?.theme?.style instanceof Style
                        ).toBeTrue();
                      });
                      it("should not be populated with group", async () => {
                        const getFriend = await method(id);
                        expect(
                          typeof getFriend!.group! === "number"
                        ).toBeTrue();
                      });
                    } else {
                      it("should be populated with a group", async () => {
                        const getFriend = await method(id);
                        expect(getFriend!.group! instanceof Group).toBeTrue();
                      });
                      it("should be populated with club => theme deep", async () => {
                        const getFriend = await method(id);
                        expect(
                          (
                            getFriend!.memberOf! as Populated<
                              Club,
                              false,
                              string
                            >[]
                          )[1].theme instanceof Theme
                        ).toBeTrue();
                      });
                    }
                    describe("Shallow", () => {
                      it("should not be populated with friends deep", async () => {
                        const getFriend = await method(id, true);
                        expect(
                          (getFriend?.hasFriends as Friend[]).every((x) =>
                            x.hasFriends
                              // @ts-ignore
                              .every((y: any) => typeof y === "number")
                          )
                        ).toBeTrue();
                      });
                      it("should not be populated with clubs deep", async () => {
                        const getFriend = await method(id, true);
                        expect(
                          (getFriend?.memberOf as Club[]).every(
                            (x: any) => !(x.theme instanceof Theme)
                          )
                        ).toBeTrue();
                      });
                      if (_method.populatedPartial) {
                        it("should not be populated with group", async () => {
                          const getFriend = await method(id, true);
                          expect(
                            typeof getFriend!.group! === "number"
                          ).toBeTrue();
                        });
                      }
                    });
                  }
                });
              }
              if (!_method.populated) {
                describe("Normal", () => {
                  if (_method.index) {
                    describe("Indices", () => {
                      it("should index memberOf", async () => {
                        const getFriend = await method(groupIds[1]);
                        expect(getFriend).toEqual(friend);
                      });
                      if (_method.multiIndex) {
                        it("should multiIndex memberOf", async () => {
                          const getFriend = await method(clubIds[1]);
                          expect(getFriend).toEqual(friend);
                        });
                      }
                    });
                  } else {
                    it("should not be populated with friends", async () => {
                      const getFriend = await method(id);
                      // @ts-ignore
                      expect(
                        getFriend!.hasFriends!.every(
                          (x: any) => typeof x === "number"
                        )
                      ).toBeTrue();
                    });
                    it("should not be populated with clubs", async () => {
                      const getFriend = await method(id);
                      // @ts-ignore
                      expect(
                        getFriend!.hasFriends!.every(
                          (x: any) => typeof x === "number"
                        )
                      ).toBeTrue();
                    });
                  }
                });
              }
            });
          });
        });
        describe("Methods negative", () => {
          methodsNegative.forEach((_method, _j) => {
            if (_j !== 7) {
              return;
            }
            let method: ReturnType<typeof _method.method>;
            describe(_method.desc, () => {
              beforeEach(async () => {
                method = _method.method(db);
              });
              describe("Provided populate key does not match with schema", () => {
                it("should be rejected", async () => {
                  await expectAsync(method(id)).toBeRejectedWithError(
                    `DEXIE POPULATE ADDON: Provided key 'sdfsdf' doesn't match with schema`
                  );
                });
              });
            });
          });
          it("should be ok to provide any options object", async () => {
            const testFriend = await db.friends
              .populate({ cxvbbngf: false } as any)
              .get(id);
            expect(testFriend instanceof Friend).toBeTrue();
          });
        });
        describe("Ordering", () => {
          it("should order by age", async () => {
            await db.friends.bulkAdd(mockFriends(20));
            const orderedFriends = await db.friends
              .populate()
              .orderBy("age")
              .toArray();
            expect(
              orderedFriends.every((friend, i) =>
                i > 0 ? friend.age >= orderedFriends[i - 1].age : true
              )
            );
          });
          it("should reverse order by age", async () => {
            await db.friends.bulkAdd(mockFriends(20));
            const orderedFriends = await db.friends
              .populate()
              .orderBy("age")
              .reverse()
              .toArray();
            const reversedOrderedFriends = orderedFriends.reverse();
            expect(
              reversedOrderedFriends.every((friend, i) =>
                i > 0 ? friend.age >= reversedOrderedFriends[i - 1].age : true
              )
            );
          });
        });
      });
    });
    describe("No relational keys provided", () => {
      it("should call console.warn()", async () => {
        spyOn(console, "warn").and.callFake(() => void 0);
        const db = testDatabaseNoRelationalKeys(Dexie);
        await db.open();
        expect(console.warn).toHaveBeenCalledWith(
          "DEXIE POPULATE ADDON: No relational keys are set"
        );
      });
    });
    describe("No matching tables for relational keys provided", () => {
      it("should throw", async () => {
        const db = testDatabaseNoTableForRelationalKeys(Dexie);
        await expectAsync(db.open()).toBeRejectedWithError(
          "DEXIE POPULATE ADDON: Relation schema does not match the db tables, now closing database"
        );
        expect(db.isOpen()).toBeFalse();
      });
    });
  });
});
