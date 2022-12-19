import { Dexie } from "dexie";
import faker from "faker";
import { encrypted } from "../../../src";
import { Encryption } from "../../../src/encryption.class";
import * as hooks from "../../../src/hooks";
import {
  databasesNegative,
  databasesPositive,
  Friend,
  mockFriends,
  TestDatabase,
} from "../../mocks/mocks.spec";

describe("dexie-encrypted-addon dexie-encrypt.spec", () => {
  describe("Encrypted databases", () => {
    // Should work for each positive database
    databasesPositive.forEach((database) => {
      describe(database.desc, () => {
        let db: ReturnType<typeof database.db>;
        beforeEach(async () => {
          db = database.db();
          await db.open();
          expect(db.isOpen()).toBeTrue();
        });
        afterEach(async () => {
          await db.delete();
        });
        it("should override create / mutate methods", async () => {
          const overrideMethods = [
            "add",
            "bulkAdd",
            "put",
            "bulkPut",
            "update",
          ];
          const [friend] = mockFriends(1);
          await db.friends.add(friend);

          overrideMethods.forEach((method) => {
            expect(db.Table.prototype[method].toString()).toEqual(
              jasmine.stringMatching("clonedeep")
            );
          });
        });
        describe("Hooks", () => {
          let friends: Friend[];
          let id: string;
          let ids: string[];
          beforeEach(async () => {
            friends = mockFriends();
            id = await db.friends.bulkAdd(friends);
            ids = friends.map((friend) => Encryption.hash(friend));
            const hooksSpy = spyOnAllFunctions(hooks);
            Object.keys(hooksSpy).forEach((key) =>
              hooksSpy[key].and.callThrough()
            );
          });
          describe("Creation", () => {
            let newFriends: Friend[];
            beforeEach(async () => {
              newFriends = mockFriends();
            });
            afterEach(() => {
              expect(hooks.encryptOnCreation).toHaveBeenCalled();
              expect(hooks.encryptOnUpdating).not.toHaveBeenCalled();
              expect(hooks.decryptOnReading).not.toHaveBeenCalled();
            });
            it("should be called on add()", async () => {
              await db.friends.add(newFriends[0]);
            });
            it("should be called on bulkAdd()", async () => {
              await db.friends.bulkAdd(newFriends);
            });
            it("should be called on put()", async () => {
              await db.friends.put(newFriends[0]);
            });
            it("should be called on bulkPut()", async () => {
              await db.friends.bulkPut(newFriends);
            });
          });
          describe("Updating", () => {
            afterEach(() => {
              expect(hooks.encryptOnUpdating).toHaveBeenCalled();
              expect(hooks.encryptOnCreation).not.toHaveBeenCalled();
              expect(hooks.decryptOnReading).not.toHaveBeenCalled();
            });
            it("should be called on update()", async () => {
              await db.friends.update(id, friends[1]);
            });
            it("should be called on put()", async () => {
              await db.friends.put({ ...friends[1], id });
            });
            it("should be called on bulkPut()", async () => {
              /*
               * For v3 of Dexie
               */
              // const getFriends = await db.friends.bulkGet(hashedIds);
              const friends2 = mockFriends();
              const hashedDocuments = friends2.map((friend, i) => ({
                ...friend,
                id: ids[i],
              }));
              await db.friends.bulkPut(hashedDocuments);
            });
          });
          describe("Reading", () => {
            afterEach(() => {
              expect(hooks.decryptOnReading).toHaveBeenCalled();
              expect(hooks.encryptOnUpdating).not.toHaveBeenCalled();
              expect(hooks.encryptOnCreation).not.toHaveBeenCalled();
            });
            it("should be called on get()", async () => {
              await db.friends.get(id);
            });
            it("should be called on where()", async () => {
              await db.friends.where("age").between(1, 80, true, true).first();
            });
          });
        });
        describe("Id generation", () => {
          describe("Add()", () => {
            it("should generate hashed id if not provided", async () => {
              const [friend] = mockFriends(1);
              const id = await db.friends.add(friend);

              const expectedId = Encryption.hash(friend);
              expect(id).toBe(expectedId);
            });
            it("should keep provided id when an id is provided", async () => {
              const [friend] = mockFriends(1);
              const fakeId = "mock-id: " + faker.random.alphaNumeric(40);
              const id = await db.friends.add({ ...friend, id: fakeId });

              expect(id).toBe(fakeId);
            });
          });
          describe("Put()", () => {
            it("should generate hashed id if not provided", async () => {
              const [friend] = mockFriends(1);
              const id = await db.friends.put(friend);

              const expectedId = Encryption.hash(friend);
              expect(id).toBe(expectedId);
            });
            it("should keep provided id when provided", async () => {
              const [friend] = mockFriends(1);
              const fakeId = "mock-id: " + faker.random.alphaNumeric(40);
              const id = await db.friends.put({ ...friend, id: fakeId });

              expect(id).toBe(fakeId);
            });
            it("should not overwrite id on update", async () => {
              const [friend] = mockFriends(1);
              const id = await db.friends.put(friend);

              const getFriend = await db.friends.get(id);
              expect(getFriend).toEqual({ ...friend, id });

              const [friend2] = mockFriends(1);
              const id2 = await db.friends.put({ ...friend2, id });

              const getFriend2 = await db.friends.get(id);
              expect(id).toBe(id2);
              expect(getFriend2).toEqual({ ...friend2, id });
            });
          });
          describe("Update()", () => {
            it("should not overwrite id on update", async () => {
              const [friend] = mockFriends(1);
              const id = await db.friends.add(friend);

              const getFriend = (await db.friends.get(id)) as Friend;
              const updatedDoc: Friend = {
                ...getFriend,
                firstName: "mock name",
              };
              await db.friends.update(id, updatedDoc);

              const getFriend2 = (await db.friends.get(id)) as Friend;
              expect(getFriend2.id).toBe(id);
            });
          });
        });
        describe("Add()", () => {
          it("should be able to add() and get() friend", async () => {
            const [friend] = mockFriends(1);
            const id = await db.friends.add(friend);

            const getFriend = await db.friends.get(id);
            expect(getFriend).toEqual({ ...friend, id });
          });
          it("should be able to bulkAdd() and get() friends", async () => {
            const friends = mockFriends();
            await db.friends.bulkAdd(friends);
            const hashedIds = friends.map((friend) => Encryption.hash(friend));
            const hashedDocuments = friends.map((friend, i) => ({
              ...friend,
              id: hashedIds[i],
            }));

            /* For v3 of Dexie */
            // const getFriends = await db.friends.bulkGet(hashedIds);
            const getFriends = await Promise.all(
              hashedIds.map((id) => db.friends.get(id))
            );
            expect(getFriends).toEqual(hashedDocuments);
          });
          it("should be able to add() partial friend and get() partial friend", async () => {
            const [friend] = mockFriends(1);
            const { shoeSize, ...partialFriend } = friend;
            const id = await db.friends.add(partialFriend as Friend);

            const getFriend = await db.friends.get(id);
            expect(getFriend).toEqual({ ...partialFriend, id } as Friend);
          });
        });
        describe("Put()", () => {
          describe("Create", () => {
            it("should be able to put() and get() friend", async () => {
              const [friend] = mockFriends(1);
              const id = await db.friends.put(friend);

              const getFriend = await db.friends.get(id);
              expect(getFriend).toEqual({ ...friend, id });
            });
            it("should be able to bulkPut() and get() friends", async () => {
              const friends = mockFriends();
              await db.friends.bulkPut(friends);
              const hashedIds = friends.map((friend) =>
                Encryption.hash(friend)
              );
              const hashedDocuments = friends.map((friend, i) => ({
                ...friend,
                id: hashedIds[i],
              }));

              /*
               * For v3 of Dexie
               */
              // const getFriends = await db.friends.bulkGet(hashedIds);
              const getFriends = await Promise.all(
                hashedIds.map((id) => db.friends.get(id))
              );
              expect(getFriends).toEqual(hashedDocuments);
            });
          });
          describe("Overwrite", () => {
            it("should be able to overwrite document when id exists", async () => {
              const [friend] = mockFriends(1);
              const id = await db.friends.put(friend);

              const getFriend = await db.friends.get(id);
              expect(getFriend).toEqual({ ...friend, id });

              const [friend2] = mockFriends(1);
              await db.friends.put({ ...friend2, id });

              const getFriend2 = await db.friends.get(id);
              expect(getFriend2).toEqual({ ...friend2, id });
            });
            it("should be able to bulkPut() and get() friends", async () => {
              const friends = mockFriends();
              await db.friends.bulkPut(friends);
              const hashedIds = friends.map((friend) =>
                Encryption.hash(friend)
              );
              const hashedDocuments = friends.map((friend, i) => ({
                ...friend,
                id: hashedIds[i],
              }));

              /*
               * For v3 of Dexie
               */
              // const getFriends = await db.friends.bulkGet(hashedIds);
              const getFriends = await Promise.all(
                hashedIds.map((id) => db.friends.get(id))
              );
              expect(getFriends).toEqual(hashedDocuments);

              const friends2 = mockFriends();
              const hashedDocuments2 = friends2.map((friend, i) => ({
                ...friend,
                id: hashedIds[i],
              }));
              await db.friends.bulkPut(hashedDocuments2);

              /*
               * For v3 of Dexie
               */
              // const getFriends = await db.friends.bulkGet(hashedIds);
              const getFriends2 = await Promise.all(
                hashedIds.map((id) => db.friends.get(id))
              );
              expect(getFriends2).toEqual(hashedDocuments2);
            });
          });
        });
        describe("Update()", () => {
          let id: string;
          beforeEach(async () => {
            const [friend] = mockFriends(1);
            id = await db.friends.add(friend);
          });
          it("should be able to update document", async () => {
            const getFriend = (await db.friends.get(id)) as Friend;

            const updatedDoc: Friend = { ...getFriend, firstName: "mock name" };
            await db.friends.update(id, updatedDoc);

            const getFriend2 = await db.friends.get(id);
            expect(getFriend2).toEqual(updatedDoc);
          });
          it("should be able to add to the document", async () => {
            const getFriend = (await db.friends.get(id)) as Friend;

            const updatedDoc: Friend = { ...getFriend, testProp: "testie" };
            await db.friends.update(id, updatedDoc);

            const getFriend2 = await db.friends.get(id);
            expect(getFriend2).toEqual(updatedDoc);
          });
          it("should be able to remove from the document", async () => {
            const getFriend = (await db.friends.get(id)) as Friend;

            const updatedDoc: Friend = {
              ...getFriend,
              shoeSize: undefined,
            } as any;
            const test = await db.friends.update(id, updatedDoc);

            const getFriend2 = await db.friends.get(id);

            const { shoeSize, ...expectedDoc } = updatedDoc;
            expect(test).toBe(1);
            expect(getFriend2).toEqual(expectedDoc as any);
          });
        });
        describe("Get()", () => {
          let friendsRead: Friend[];
          let id: string;
          beforeEach(async () => {
            friendsRead = mockFriends();
            id = await db.friends.bulkAdd(friendsRead);
          });
          it("should be able to get the decrypted document", async () => {
            const friend = await db.friends.get(id);
            expect(friend).toEqual({ ...friendsRead[4], id });
          });
          it("should be undefined when no id matches", async () => {
            const friend = await db.friends.get("svsdv");
            expect(friend).toBeUndefined();
          });
        });
        describe("Where()", () => {
          let friendsRead: Friend[];
          let friendsWithIds: Friend[];
          beforeEach(async () => {
            friendsRead = mockFriends();
            await db.friends.bulkAdd(friendsRead);
            friendsWithIds = friendsRead.map((friend) => ({
              ...friend,
              id: Encryption.hash(friend),
            }));
          });
          it("should be able to get decrypted documents", async () => {
            const friends = await db.friends
              .where("age")
              .between(1, 80, true, true)
              .toArray();
            expect(friends).toEqual(jasmine.arrayContaining(friendsWithIds));
          });
        });
        describe("Transaction", () => {
          let friendsRead: Friend[];
          let id: string;
          beforeEach(async () => {
            friendsRead = mockFriends();
            id = await db.friends.bulkAdd(friendsRead);
          });
          it("should be able to get decrypted documents", async () => {
            let friendTransaction: Friend | undefined;

            await db.transaction("readonly", db.friends, async () => {
              friendTransaction = await db.friends.get(id);
            });
            expect(friendTransaction).toEqual({ ...friendsRead[4], id });
          });
          it("should be able to get raw documents", async () => {
            const iDb = db.backendDB();
            const request = iDb
              .transaction("friends", "readonly")
              .objectStore("friends")
              .get(id);
            await new Promise((resolve) => (request.onsuccess = resolve));
            const friendRaw = request.result as Friend;
            let friendTransaction: Friend | undefined;

            await db.transaction(
              "readonly",
              db.friends,
              async (transaction) => {
                transaction.raw = true;
                friendTransaction = await db.friends.get(id);
              }
            );

            expect(friendTransaction).toEqual(friendRaw);
          });
          it("should be able to set a raw document in transaction", async () => {
            const iDb = db.backendDB();
            const request = iDb
              .transaction("friends", "readonly")
              .objectStore("friends")
              .get(id);
            await new Promise((resolve) => (request.onsuccess = resolve));
            const friendRaw = request.result as Friend;
            let transactionFriend: Friend | undefined;
            let transactionFriend2: Friend | undefined;

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
                transactionFriend2 = (await db.friends.get(id)) as Friend;
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
    });
    it("should encrypt lastName", async () => {
      const db = new TestDatabase("TestEncryptLastName");
      await db.open();
      expect(db.isOpen()).toBeTrue();
      const iDb = db.backendDB();
      const [friend] = mockFriends(1);
      const id = await db.friends.add(friend);
      const request = iDb
        .transaction("friends", "readonly")
        .objectStore("friends")
        .get(id);
      await new Promise((resolve) => (request.onsuccess = resolve));
      const friendRaw = request.result as Friend;
      expect(Object.keys(friendRaw)).toEqual(
        jasmine.arrayContaining(Object.keys(friend))
      );
      expect(friendRaw.lastName).not.toBe(friend.lastName);
    });
    describe("Negative", () => {
      describe("Faulty databases", () => {
        // Faulty databases should throw
        databasesNegative.forEach((database) => {
          let db: ReturnType<typeof database.db>;
          beforeEach(async () => {
            db = database.db();
          });
          afterEach(async () => {
            await db.delete();
          });
          describe(database.desc, () => {
            it("should warn when no encryption keys are set", async () => {
              spyOn(console, "warn").and.callFake(() => void 0);
              await db.open();
              expect(console.warn).toHaveBeenCalledWith(
                "DEXIE ENCRYPT ADDON: No encryption keys are set"
              );
            });
          });
        });
      });
    });
    describe("Falsy values", () => {
      it("should encrypt falsy values on creation", async () => {
        class Friend6577dfg {
          id?: string;
          age = 0;
          isCool = false;
          encryptedString = "should be encrypted";
          notEncrypted = 0;
        }

        const db = new (class TestDatabase extends Dexie {
          public friends: Dexie.Table<Friend6577dfg, string>;
          constructor(_name: string) {
            super(_name);
            encrypted(this, {
              secretKey: Encryption.createRandomEncryptionKey(),
            });
            this.on("blocked", () => false);
            this.version(1).stores({
              friends: "#id, $age, $isCool, $encryptedString, notEncrypted",
            });
            this.friends.mapToClass(Friend6577dfg);
          }
        })("testie");
        await db.open();
        const iDb = db.backendDB();

        const friend = new Friend6577dfg();

        const id = await db.friends.add(friend);
        const request = iDb
          .transaction("friends", "readonly")
          .objectStore("friends")
          .get(id);
        await new Promise((resolve) => (request.onsuccess = resolve));
        const friendRaw = request.result;

        expect(friendRaw).toBeDefined();
        expect(typeof friendRaw.age === "string").toBeTrue();
        expect(friendRaw.age.length > 0).toBeTrue();

        expect(friendRaw.notEncrypted).toBe(friend.notEncrypted);
        expect(friendRaw.encryptedString).not.toBe(friend.encryptedString);

        const getFriend = await db.friends.get(id);
        expect(getFriend).toEqual(jasmine.objectContaining(friend));

        await db.delete();
      });
      it("should encrypt falsy values on updating", async () => {
        class Friend6577dfg {
          id?: string;
          age = 2;
          isCool = true;
          encryptedString = "should be encrypted";
          notEncrypted = 3;
        }

        const db = new (class TestDatabase extends Dexie {
          public friends: Dexie.Table<Friend6577dfg, string>;
          constructor(_name: string) {
            super(_name);
            encrypted(this, {
              secretKey: Encryption.createRandomEncryptionKey(),
            });
            this.on("blocked", () => false);
            this.version(1).stores({
              friends: "#id, $age, $isCool, $encryptedString, notEncrypted",
            });
          }
        })("testie");
        await db.open();
        const iDb = db.backendDB();

        const friend = new Friend6577dfg();

        const id = await db.friends.add(friend);
        const request = iDb
          .transaction("friends", "readonly")
          .objectStore("friends")
          .get(id);
        await new Promise((resolve) => (request.onsuccess = resolve));
        const friendRaw = request.result;

        expect(friendRaw).toBeDefined();
        expect(typeof friendRaw.age === "string").toBeTrue();
        expect(friendRaw.age.length > 0).toBeTrue();

        expect(friendRaw.notEncrypted).toBe(friend.notEncrypted);
        expect(friendRaw.encryptedString).not.toBe(friend.encryptedString);

        const getFriend = await db.friends.get(id);
        expect(getFriend).toEqual(jasmine.objectContaining(friend));

        // Updating
        const updatedFriend = {
          age: 0,
          isCool: false,
          encryptedString: "should be encrypted again",
          notEncrypted: 0,
        };
        await db.friends.update(id, updatedFriend);

        const request2 = iDb
          .transaction("friends", "readonly")
          .objectStore("friends")
          .get(id);
        await new Promise((resolve) => (request2.onsuccess = resolve));
        const friendRaw2 = request2.result;

        expect(friendRaw2).toBeDefined();
        expect(typeof friendRaw2.age === "string").toBeTrue();
        expect(friendRaw2.age.length > 0).toBeTrue();

        expect(friendRaw2.notEncrypted).toBe(updatedFriend.notEncrypted);
        expect(friendRaw2.encryptedString).not.toBe(
          updatedFriend.encryptedString
        );

        const getFriend2 = await db.friends.get(id);
        expect(getFriend2).toEqual(jasmine.objectContaining(updatedFriend));

        await db.delete();
      });
    });
  });
});
