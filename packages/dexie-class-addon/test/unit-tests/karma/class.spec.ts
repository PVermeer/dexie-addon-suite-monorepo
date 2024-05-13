import * as classMapModule from "../../../src/class";
import {
  Club,
  Color,
  databasesPositive,
  Friend,
  mockFriends,
  Tag,
} from "../../mocks/mocks.spec";

describe("dexie-class-addon class.spec", () => {
  // Should work for each positive database
  databasesPositive.forEach((database, _i) => {
    // if (_i > 0) return;
    describe(database.desc, () => {
      let db: ReturnType<typeof database.db>;
      let serializeSpy: jasmine.Spy;
      let deSerializeSpy: jasmine.Spy;
      let serializeSpyClub: jasmine.Spy;
      let deSerializeSpyClub: jasmine.Spy;
      let serializeSpyTag: jasmine.Spy;
      let deSerializeSpyTag: jasmine.Spy;
      let serializeSpyColor: jasmine.Spy;
      let deSerializeSpyColor: jasmine.Spy;

      let friends: Friend[];
      let ids: number[];
      let friend: Friend;
      let id: number;

      const friendExpectations = (friendUpdated: Friend) => {
        expect(serializeSpy).withContext("Friend class").toHaveBeenCalled();
        expect(deSerializeSpy).withContext("Friend class").toHaveBeenCalled();
        expect(serializeSpyClub).withContext("Club class").toHaveBeenCalled();
        expect(deSerializeSpyClub).withContext("Club class").toHaveBeenCalled();
        expect(serializeSpyTag).withContext("Tag class").toHaveBeenCalled();
        expect(deSerializeSpyTag).withContext("Tag class").toHaveBeenCalled();
        expect(serializeSpyColor).withContext("Color class").toHaveBeenCalled();
        expect(deSerializeSpyColor)
          .withContext("Color class")
          .toHaveBeenCalled();

        expect(friendUpdated).toEqual(friend);
        expect(friendUpdated).toBeInstanceOf(Friend);
        expect(friendUpdated?.someMethod).toBeDefined();
        expect(friendUpdated?.date).toBeInstanceOf(Date);

        expect(friendUpdated.tags.length).toBeTruthy();
        expect(friendUpdated?.tags.every((tag) => tag instanceof Tag))
          .withContext("Tag class expectation")
          .toBeTrue();
        expect(
          friendUpdated?.tags.every((tag) =>
            friend.tags.some((tag2) => tag !== tag2)
          )
        )
          .withContext("should create new Tags")
          .toBeTrue();

        friendUpdated.tags.forEach((tag) => {
          expect(tag.color).toBeInstanceOf(Color);
          expect(friend.tags.some((tag2) => tag.color !== tag2.color))
            .withContext("should create new Colors")
            .toBeTrue();
        });

        friendUpdated.colors.forEach((item) => {
          item.forEach((color) => {
            expect(color).toBeInstanceOf(Color);
          });
        });
      };

      beforeEach(async () => {
        spyOn(classMapModule, "classMap").and.callThrough();

        serializeSpy = spyOn(Friend.prototype, "serialize").and.callThrough();
        deSerializeSpy = spyOn(
          Friend.prototype,
          "deserialize"
        ).and.callThrough();

        serializeSpyTag = spyOn(Tag.prototype, "serialize").and.callThrough();
        deSerializeSpyTag = spyOn(
          Tag.prototype,
          "deserialize"
        ).and.callThrough();

        serializeSpyClub = spyOn(Club.prototype, "serialize").and.callThrough();
        deSerializeSpyClub = spyOn(
          Club.prototype,
          "deserialize"
        ).and.callThrough();

        serializeSpyColor = spyOn(
          Color.prototype,
          "serialize"
        ).and.callThrough();
        deSerializeSpyColor = spyOn(
          Color.prototype,
          "deserialize"
        ).and.callThrough();

        db = database.db();
        await db.open();
        expect(db.isOpen()).toBeTrue();

        friends = mockFriends();
        ids = await db.friends.bulkAdd(friends, { allKeys: true });
        friends.forEach((friend, i) => (friend.id = ids[i]));

        friend = friends[0];
        id = ids[0];
      });
      afterEach(async () => {
        await db.delete();
      });
      it("should override create methods", async () => {
        const [friend] = mockFriends(1);
        await db.friends.add(friend);
        expect(classMapModule.classMap).toHaveBeenCalled();
      });
      describe("Methods", () => {
        describe("Add()", () => {
          it("should be able to add() and get() friend", async () => {
            expect(serializeSpy).toHaveBeenCalled();
            friend.id = id;

            const getFriend = (await db.friends.get(id)) as Friend;
            friendExpectations(getFriend);
          });
          it("should be able to bulkAdd() and get() friends", async () => {
            const friends = mockFriends();
            const friendIds = await db.friends.bulkAdd(friends, {
              allKeys: true,
            });
            const expectedFriends = friends.map((friend, i) => {
              friend.id = friendIds[i];
              return friend;
            });

            const getFriends = await db.friends.bulkGet(friendIds);
            expect(getFriends).toEqual(
              jasmine.arrayContaining(expectedFriends)
            );
          });
        });
        describe("Put()", () => {
          it("should be able to put() and get() friend", async () => {
            expect(serializeSpy).toHaveBeenCalled();
            friend.id = id;

            const getFriend = (await db.friends.get(id)) as Friend;
            friendExpectations(getFriend);
          });
          it("should be able to bulkPut() and get() friends", async () => {
            const friends = mockFriends();
            const friendIds = await db.friends.bulkPut(friends, {
              allKeys: true,
            });
            const expectedFriends = friends.map((friend, i) => {
              friend.id = friendIds[i];
              return friend;
            });

            const getFriends = await db.friends.bulkGet(friendIds);
            expect(getFriends).toEqual(
              jasmine.arrayContaining(expectedFriends)
            );
          });
        });
        describe("Update()", () => {
          it("should be able to update document", async () => {
            const updatedDoc: Partial<Friend> = { firstName: "mock name" };
            // @ts-expect-error BAD dexie type!
            await db.friends.update(id, updatedDoc);
            friend.firstName = "mock name";

            const getFriend = await db.friends.get(id);
            friendExpectations(getFriend!);
          });
          it("should be able to bulkUpdate() and get() friends", async () => {
            expect(serializeSpy).toHaveBeenCalledTimes(friends.length);

            const updateDocs = friends.map((friend: Partial<Friend>) => {
              friend.firstName = "mock name";
              return {
                key: friend.id!,
                changes: friend,
              };
            });
            // @ts-expect-error BAD dexie type!
            await db.friends.bulkUpdate(updateDocs);
            expect(serializeSpy).toHaveBeenCalledTimes(friends.length * 2);

            const expectedFriends = friends.map((friend, i) => {
              friend.id = ids[i];
              friend.firstName = "mock name";
              return friend;
            });

            const getFriends = await db.friends.bulkGet(ids);
            expect(getFriends).toEqual(
              jasmine.arrayContaining(expectedFriends)
            );
            expect(deSerializeSpy).toHaveBeenCalledTimes(friends.length * 2);
          });
          it("should be able to update document with key paths", async () => {
            const newFriend = mockFriends(1)[0];
            const updateClub = newFriend.memberOf;
            const updateTag = newFriend.tags[0];
            const updateColor = newFriend.colors[0][0];

            serializeSpyClub.calls.reset();
            serializeSpyTag.calls.reset();
            serializeSpyColor.calls.reset();

            const updatedDoc = {
              "address.zipCode": "someZipCode",
              "address.street": "someStreetName",
              "tags.0.name": "someTagName",
              "tags.1": updateTag,
              "colors.0.0": updateColor,
              memberOf: updateClub,
            };
            // @ts-expect-error BAD dexie type!
            await db.friends.update(id, updatedDoc);
            friend.address = {
              zipCode: "someZipCode",
              street: "someStreetName",
            };
            friend.memberOf = updateClub;
            friend.tags[0].name = "someTagName";
            friend.tags[1] = updateTag;
            friend.colors[0][0] = updateColor;

            expect(serializeSpyClub)
              .withContext("Club class")
              .toHaveBeenCalled();

            expect(serializeSpyTag).withContext("Tag class").toHaveBeenCalled();

            expect(serializeSpyColor)
              .withContext("Color class")
              .toHaveBeenCalled();

            const getFriend = await db.friends.get(id);
            friendExpectations(getFriend!);
          });
          it("should run serializer", async () => {
            const date = new Date();
            const updatedDoc: Partial<Friend> = { date };
            // @ts-expect-error BAD dexie type!
            await db.friends.update(id, updatedDoc);
            friend.date = date;

            const getFriend = await db.friends.get(id);
            friendExpectations(getFriend!);

            const iDb = db.backendDB();
            const request = iDb
              .transaction("friends", "readonly")
              .objectStore("friends")
              .get(id);
            await new Promise((resolve) => (request.onsuccess = resolve));
            const friendRaw = request.result as Friend;

            expect(typeof friendRaw.date === "number").toBeTrue;
          });
        });
        describe("Get()", () => {
          it("should be able to get the document", async () => {
            const getFriend = await db.friends.get(id);
            friendExpectations(getFriend!);
          });
        });
        describe("Where()", () => {
          it("should be able to use where()", async () => {
            const findFriends = await db.friends
              .where("age")
              .between(1, 80, true, true)
              .toArray();

            expect(deSerializeSpy).toHaveBeenCalled();
            expect(findFriends).toEqual(jasmine.arrayContaining(friends));
            expect(findFriends.length > 0).toBeTrue();
            findFriends.forEach((friend) => {
              expect(friend).toBeInstanceOf(Friend);
              expect(friend?.someMethod).toBeDefined();
              expect(friend?.date).toBeInstanceOf(Date);
            });
          });
        });
        describe("Transaction()", () => {
          it("should be able to get a raw document", async () => {
            const [friend] = mockFriends(1);
            const id = await db.friends.add(friend);

            const iDb = db.backendDB();
            const request = iDb
              .transaction("friends", "readonly")
              .objectStore("friends")
              .get(id);
            await new Promise((resolve) => (request.onsuccess = resolve));
            const friendRaw = request.result as Friend;
            let transactionFriend: Friend | undefined;

            await db.transaction(
              "readonly",
              db.friends,
              async (transaction) => {
                transaction.raw = true;
                transactionFriend = (await db.friends.get(id)) as Friend;
              }
            );
            expect(transactionFriend).toEqual(friendRaw);
          });
          it("should be able to set a raw document in transaction", async () => {
            const [friend] = mockFriends(1);
            const id = await db.friends.add(friend);

            const iDb = db.backendDB();
            const request = iDb
              .transaction("friends", "readonly")
              .objectStore("friends")
              .get(id);
            await new Promise((resolve) => (request.onsuccess = resolve));
            const friendRaw = request.result as Friend;
            let transactionFriend: Friend | undefined;

            await db.transaction(
              "readonly",
              db.friends,
              async (transaction) => {
                transaction.raw = true;
                transactionFriend = (await db.friends.get(id)) as Friend;
              }
            );

            expect(transactionFriend).toEqual(friendRaw);

            await db.transaction(
              "readwrite",
              db.friends,
              async (transaction) => {
                transaction.raw = true;
                transactionFriend = (await db.friends.get(id)) as Friend;

                transactionFriend.firstName = "firstName";
                await db.friends.put(transactionFriend, id);
              }
            );

            const request2 = iDb
              .transaction("friends", "readonly")
              .objectStore("friends")
              .get(id);
            await new Promise((resolve) => (request2.onsuccess = resolve));
            const friendRaw2 = request2.result as Friend;

            expect(friendRaw2).toEqual({
              ...friendRaw,
              firstName: "firstName",
            } as Friend);
          });
        });
      });
      describe("Fixes", () => {
        it("should remove an undefined primary index", async () => {
          // @ts-expect-error BAD dexie type!
          await db.friends.update(id, friend as Partial<Friend>);

          const getFriend = (await db.friends.get(id)) as Friend;
          friendExpectations(getFriend!);
        });
      });
    });
  });
});
