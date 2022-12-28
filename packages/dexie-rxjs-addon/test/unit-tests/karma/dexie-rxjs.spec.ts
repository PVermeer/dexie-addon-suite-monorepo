import { Dexie, IndexableTypeArray } from "dexie";
import { IDatabaseChange } from "dexie-observable/api";
import faker from "faker/locale/nl";
import { firstValueFrom, Observable, Subscription } from "rxjs";
import { filter, take } from "rxjs/operators";
import {
  databasesPositive,
  Friend,
  methods,
  mockFriends,
} from "../../mocks/mocks.spec";

type FlatPromise<T = unknown> = {
  promise: Promise<T>;
  resolve: (value?: T | PromiseLike<T>) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reject: (reason?: any) => void;
};
function flatPromise<T = unknown>(): FlatPromise<T> {
  let resolve: ((value?: T | PromiseLike<T>) => void) | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let reject: ((reason?: any) => void) | undefined;
  const promise = new Promise<T>((res, rej) => {
    resolve = res as any;
    reject = rej;
  });
  if (!resolve || !reject) {
    throw new Error("What the hell...");
  }
  return { promise, resolve, reject };
}

describe("dexie-rxjs-addon dexie-rxjs.spec", () => {
  describe("Rxjs", () => {
    databasesPositive.forEach((database, _i) => {
      // if (_i !== 0) { return; }
      describe(database.desc, () => {
        let db: ReturnType<typeof database.db>;
        let subs: Subscription;
        let friend: Friend;
        let id: number;
        let customId: number;

        beforeEach(async () => {
          subs = new Subscription();
          db = database.db(Dexie);
          await db.open();
          expect(db.isOpen()).toBeTrue();

          [friend] = mockFriends(1);
          customId = friend.customId;

          const initFriendPromise = flatPromise(); // Change output might be delayed
          db.friends.$.get(database.customId ? customId : 1)
            .pipe(filter((x) => !!x))
            .subscribe(initFriendPromise.resolve);

          id = await db.friends.add(friend);

          await initFriendPromise.promise;
        });
        afterEach(async () => {
          subs.unsubscribe();
          await db.delete();
        });
        describe("db.changes$", () => {
          it("should be an observable", () => {
            expect(db.changes$ instanceof Observable).toBeTrue();
          });
          it("should be open", async () => {
            let sub = new Subscription();
            const emitPromise = new Promise<void>((resolve) => {
              sub = db.changes$.subscribe(() => resolve());
              subs.add(sub);
            });
            await db.friends.bulkAdd(mockFriends(1));
            await emitPromise;
            expect(sub.closed).toBe(false);
          });
          it(`should have same behavior as db.on('changes')`, async () => {
            const emitEventPromise = new Promise((resolve) => {
              db.on("changes").subscribe((data) => resolve(data));
            });
            const emitObsPromise = new Promise((resolve) => {
              subs.add(db.changes$.subscribe((data) => resolve(data)));
            });
            await db.friends.bulkAdd(mockFriends(1));
            const resolved = await Promise.all([
              emitObsPromise,
              emitEventPromise,
            ]);
            expect(resolved[0]).toEqual(resolved[1]);
          });
        });
        describe("Methods", () => {
          methods.forEach((method, _j) => {
            // if (_j !== 0) { return; }
            let method$: ReturnType<typeof method.method>;
            let obs$: Observable<Friend | Friend[] | undefined>;

            describe(method.desc, () => {
              beforeEach(async () => {
                method$ = method.method(db);
                obs$ = method$(id, customId);
              });
              it("should be an observable", async () => {
                expect(obs$ instanceof Observable).toBeTrue();
              });
              it("should be open", async () => {
                let sub = new Subscription();
                const emitPromise = new Promise<void>((resolve) => {
                  sub = obs$.subscribe(() => resolve());
                  subs.add(sub);
                });
                await emitPromise;
                expect(sub.closed).toBe(false);
              });
              it("should emit the correct value", async () => {
                const getFriend = await firstValueFrom(obs$.pipe(take(1)));
                expect(getFriend).toEqual(friend);

                const [newFriend] = mockFriends(1);
                const newId = await db.friends.add(newFriend);

                const obsNew$ = method$(newId, newFriend.customId);
                const getNewFriend = await firstValueFrom(
                  obsNew$.pipe(take(1))
                );
                if (method.first) expect(getNewFriend).toEqual(friend);
                else expect(getNewFriend).toEqual(newFriend);

                const obsOld$ = method$(id, customId);
                const getOldFriend = await firstValueFrom(
                  obsOld$.pipe(take(1))
                );
                if (method.last) expect(getOldFriend).toEqual(newFriend);
                else expect(getOldFriend).toEqual(friend);
              });
              it("should always emit on new subscribers", async () => {
                let obsFriend1: Friend | undefined;
                let obsFriend2: Friend | undefined;
                let obsFriend3: Friend | undefined;

                const obs$ = method$(id, customId, { emitUndefined: true });

                const waits = new Array(1).fill(null).map(() => flatPromise());
                subs.add(
                  obs$.subscribe((friendEmit) => {
                    obsFriend1 = friendEmit as Friend;
                    waits[0].resolve();
                  })
                );

                const waits2 = new Array(1).fill(null).map(() => flatPromise());
                subs.add(
                  obs$.subscribe((friendEmit) => {
                    obsFriend2 = friendEmit as Friend;
                    waits2[0].resolve();
                  })
                );

                // New instance
                const waits3 = new Array(1).fill(null).map(() => flatPromise());
                subs.add(
                  method$(id, customId, { emitUndefined: true }).subscribe(
                    (friendEmit) => {
                      obsFriend3 = friendEmit as Friend;
                      waits3[0].resolve();
                    }
                  )
                );

                await waits[0].promise;
                expect(obsFriend1).toEqual(friend);
                await waits2[0].promise;
                expect(obsFriend2).toEqual(friend);
                await waits3[0].promise;
                expect(obsFriend3).toEqual(friend);
              });
              it("should always emit on new subscribers after unsubscribe", async () => {
                let obsFriend1: Friend | undefined;
                let obsFriend2: Friend | undefined;
                let obsFriend3: Friend | undefined;

                const obs$ = method$(id, customId, { emitUndefined: true });

                const waits = new Array(1).fill(null).map(() => flatPromise());
                const sub1 = obs$.subscribe((friendEmit) => {
                  obsFriend1 = friendEmit as Friend;
                  waits[0].resolve();
                });

                await waits[0].promise;
                expect(obsFriend1).toEqual(friend);
                sub1.unsubscribe();

                const waits2 = new Array(1).fill(null).map(() => flatPromise());
                subs.add(
                  obs$.subscribe((friendEmit) => {
                    obsFriend2 = friendEmit as Friend;
                    waits2[0].resolve();
                  })
                );

                await waits2[0].promise;
                expect(obsFriend2).toEqual(friend);

                const waits3 = new Array(1).fill(null).map(() => flatPromise());
                subs.add(
                  obs$.subscribe((friendEmit) => {
                    obsFriend3 = friendEmit as Friend;
                    waits3[0].resolve();
                  })
                );

                await waits3[0].promise;
                expect(obsFriend3).toEqual(friend);
              });
              it("should emit on record update", async () => {
                let emitCount = 0;
                let obsFriend: Friend | undefined;
                const emitPromise = new Promise<void>((resolve) => {
                  subs.add(
                    method$(id, customId, { emitUndefined: true }).subscribe(
                      (friendEmit) => {
                        emitCount++;
                        obsFriend = friendEmit as Friend;
                        if (emitCount === 2) {
                          resolve();
                        }
                      }
                    )
                  );
                });
                await db.friends.update(id, { firstName: "TestieUpdate" });
                await emitPromise;
                expect(emitCount).toBe(2);
                expect(obsFriend).toEqual({
                  ...friend,
                  firstName: "TestieUpdate",
                });
              });
              it("should emit undefined on record delete", async () => {
                let emitCount = 0;
                let obsFriend: Friend | undefined;

                const waits = new Array(2).fill(null).map(() => flatPromise());
                subs.add(
                  method$(id, customId, { emitUndefined: true }).subscribe(
                    (friendEmit) => {
                      emitCount++;
                      obsFriend = friendEmit as Friend;
                      switch (emitCount) {
                        case 1:
                          waits[0].resolve();
                          break;
                        case 2:
                          waits[1].resolve();
                          break;
                      }
                    }
                  )
                );

                await waits[0].promise;
                expect(emitCount).toBe(1);
                expect(obsFriend).toEqual(friend);
                await db.friends.delete(id);
                await waits[1].promise;
                expect(emitCount).toBe(2);
                expect(obsFriend).toBe(undefined);
              });
              it("should emit undefined on record delete (slowed)", async () => {
                let emitCount = 0;
                let obsFriend: Friend | undefined;

                const waits = new Array(2).fill(null).map(() => flatPromise());
                subs.add(
                  method$(id, customId, { emitUndefined: true }).subscribe(
                    (friendEmit) => {
                      emitCount++;
                      obsFriend = friendEmit as Friend;
                      switch (emitCount) {
                        case 1:
                          waits[0].resolve();
                          break;
                        case 2:
                          waits[1].resolve();
                          break;
                      }
                    }
                  )
                );

                await waits[0].promise;
                expect(emitCount).toBe(1);
                expect(obsFriend).toEqual(friend);

                // Slow down to force two emits from db.changes$
                await new Promise<void>((resolve) =>
                  setTimeout(() => resolve(), 500)
                );

                await db.friends.delete(id);
                await waits[1].promise;
                expect(emitCount).toBe(2);
                expect(obsFriend).toBe(undefined);
              });
              it("should emit undefined when id is not found", async () => {
                await db.friends.clear();
                let emitCount = 0;
                let obsFriend: Friend | undefined;
                const emitPromise = new Promise<void>((resolve) => {
                  subs.add(
                    method$(99999999, 99999999, {
                      emitUndefined: true,
                    }).subscribe((friendEmit) => {
                      emitCount++;
                      obsFriend = friendEmit as Friend;
                      if (emitCount === 1) {
                        resolve();
                      }
                    })
                  );
                });
                await emitPromise;
                expect(obsFriend).toBe(undefined);
              });
              it("should emit when record is created after subscribe", async () => {
                await db.friends.clear();
                const friends = mockFriends(50);
                let emitCount = 0;
                let obsFriend: Friend | undefined;
                const randomIdx = faker.datatype.number(49);
                const emitPromise = new Promise<void>((resolve) => {
                  subs.add(
                    method$(id + randomIdx + 1, friends[randomIdx].customId, {
                      emitUndefined: true,
                    }).subscribe((friendEmit) => {
                      emitCount++;
                      obsFriend = friendEmit as Friend;
                      if (emitCount === 2) {
                        resolve();
                      }
                    })
                  );
                });
                await Promise.all(friends.map(async (x) => db.friends.add(x)));
                await emitPromise;

                if (method.first) expect(obsFriend).toEqual(friends[0]);
                else if (method.last)
                  expect(obsFriend).toEqual(
                    friends[(method.limit || friends.length) - 1]
                  );
                else expect(obsFriend).toEqual(friends[randomIdx]);
              });
              it("should not emit when no changes", async () => {
                await db.friends.clear();
                const friends = mockFriends(50);
                const updateFriends = [
                  ...friends.map((x) => {
                    const { customId: _customId, ...rest } = x;
                    return rest;
                  }),
                ];
                const ids = await Promise.all(
                  friends.map((x) => db.friends.add(x))
                );
                const lastId = id;
                const updateIds = friends.map((_, i) =>
                  database.desc !== "TestDatabaseCustomKey" && ids[i] > 1000000
                    ? lastId + i + 1
                    : ids[i]
                );

                const idx1 = faker.datatype.number({ min: 10, max: 19 });
                const id1 = ids[idx1];
                const updateId1 = updateIds[idx1];
                let emitCount = 0;

                const waits = new Array(4).fill(null).map(() => flatPromise());
                subs.add(
                  method$(id1, friends[idx1].customId).subscribe(() => {
                    emitCount++;
                    switch (emitCount) {
                      case 1:
                        waits[0].resolve();
                        break;
                      case 2:
                        waits[1].resolve();
                        waits[2].resolve();
                        waits[3].resolve();
                        break;
                    }
                  })
                );
                // First emit
                await waits[0].promise;
                expect(emitCount).toBe(1);

                // Update different record
                const idx2 = faker.datatype.number({ min: 20, max: 29 });
                const updateId2 = updateIds[idx2];
                await db.friends.update(updateId2, updateFriends[idx2]);
                setTimeout(() => waits[1].resolve(), 500);
                await waits[1].promise;
                expect(emitCount).toBe(1);

                // Update record with same data
                await db.friends.update(updateId1, updateFriends[idx1]);
                setTimeout(() => waits[2].resolve(), 500);
                await waits[2].promise;
                expect(emitCount).toBe(1);

                // Update record with different data
                if (method.first)
                  await db.friends.update(ids[0], updateFriends[45]);
                else if (method.last)
                  await db.friends.update(
                    ids[(method.limit || friends.length) - 1],
                    updateFriends[45]
                  );
                else await db.friends.update(updateId1, updateFriends[45]);

                await waits[3].promise;
                expect(emitCount).toBe(2);
              });

              if (method.array) {
                it("should be an array", async () => {
                  const getObs$ = method$(id, customId, { emitFull: true });
                  const collection = await firstValueFrom(
                    getObs$.pipe(take(1))
                  );
                  expect(Array.isArray(collection)).toBeTrue();
                });
                if (method.alwaysEmit) {
                  it("should emit on updating a record on the table", async () => {
                    const collection$ = method$(id, customId, {
                      emitFull: true,
                    });
                    let collection: Friend[];
                    let emitCount = 0;
                    const waits = new Array(2)
                      .fill(null)
                      .map(() => flatPromise());
                    subs.add(
                      collection$.subscribe((friendEmit) => {
                        collection = friendEmit as Friend[];
                        emitCount++;
                        switch (emitCount) {
                          case 1:
                            waits[0].resolve();
                            break;
                          case 2:
                            waits[1].resolve();
                            break;
                        }
                      })
                    );

                    await waits[0].promise;
                    expect(emitCount).toBe(1);
                    expect(collection!).toEqual([friend]);

                    await db.friends.update(id, { lastName: "TestieTest" });
                    await waits[1].promise;
                    expect(emitCount).toBe(2);
                    expect(collection!).toEqual([
                      { ...friend, lastName: "TestieTest" },
                    ]);
                  });
                  it("should not emit on updating a record on the table with same data", async () => {
                    const collection$ = method$(id, customId, {
                      emitFull: true,
                    });
                    let collection: Friend[];
                    let emitCount = 0;
                    const waits = new Array(2)
                      .fill(null)
                      .map(() => flatPromise());
                    subs.add(
                      collection$.subscribe((friendEmit) => {
                        collection = friendEmit as Friend[];
                        emitCount++;
                        switch (emitCount) {
                          case 1:
                            waits[0].resolve();
                            break;
                          case 2:
                            waits[1].resolve();
                            break;
                        }
                      })
                    );

                    await waits[0].promise;
                    expect(collection!).toEqual([friend]);

                    await db.friends.update(id, { lastName: friend.lastName });
                    setTimeout(() => waits[1].resolve(), 500);
                    await waits[1].promise;
                    expect(emitCount).toBe(1);
                    expect(collection!).toEqual([friend]);
                  });
                  it("should emit on adding/removing to the table", async () => {
                    const getObs$ = method$(id, customId, { emitFull: true });
                    let collection: Friend[];
                    let emitCount = 0;
                    const waits = new Array(3)
                      .fill(null)
                      .map(() => flatPromise());
                    subs.add(
                      getObs$.subscribe((friendEmit) => {
                        collection = friendEmit as Friend[];
                        emitCount++;
                        switch (emitCount) {
                          case 1:
                            waits[0].resolve();
                            break;
                          case 2:
                            waits[1].resolve();
                            break;
                          case 3:
                            waits[2].resolve();
                            break;
                        }
                      })
                    );

                    await waits[0].promise;
                    expect(emitCount).toBe(1);
                    expect(collection!).toEqual([friend]);

                    const friends = mockFriends(9);
                    await Promise.all(friends.map((x) => db.friends.add(x)));
                    await waits[1].promise;
                    expect(emitCount).toBe(2);
                    expect(collection!).toEqual(
                      jasmine.arrayContaining([
                        friend,
                        ...friends.map((x) => jasmine.objectContaining(x)),
                      ])
                    );
                    expect(collection!.length).toBe(10);

                    await db.friends.delete(id);
                    await waits[2].promise;
                    expect(emitCount).toBe(3);
                    expect(collection!).toEqual(
                      jasmine.arrayContaining(
                        friends.map((x) => jasmine.objectContaining(x))
                      )
                    );
                    expect(collection!.length).toBe(9);
                  });
                  if (method.orderedBy && !method.reversed) {
                    it("should emit ordered data", async () => {
                      const friends = mockFriends(20);
                      await db.friends.bulkAdd(friends);

                      const collection$ = method$(id, customId, {
                        emitFull: true,
                      });
                      const friendsOrdered = (await firstValueFrom(
                        collection$
                      )) as Friend[];
                      expect(
                        friendsOrdered.every((friend, i) =>
                          i > 0 ? friend.age >= friendsOrdered[i - 1].age : true
                        )
                      ).toBeTrue();
                    });
                  }
                  if (method.orderedBy && method.reversed) {
                    it("should emit reversed ordered data", async () => {
                      const friends = mockFriends(20);
                      await db.friends.bulkAdd(friends);

                      const collection$ = method$(id, customId, {
                        emitFull: true,
                      });
                      const friendsOrdered = (await firstValueFrom(
                        collection$
                      )) as Friend[];
                      const friendsOrderedReversed = friendsOrdered.reverse();
                      expect(
                        friendsOrderedReversed.every((friend, i) =>
                          i > 0 ? friend.age >= friendsOrdered[i - 1].age : true
                        )
                      ).toBeTrue();
                    });
                  }
                }
              }

              if (method.singelton) {
                it("should be the same Observable instance", () => {
                  const a = method$(id, customId, { singelton: true });
                  const b = method$(id, customId, { singelton: true });
                  expect(a && b).toBeTruthy();
                  expect(a).toBe(b);
                });
              }
              if (!method.singelton) {
                it("should be a new Observable instance", () => {
                  const a = method$(id, customId, { singelton: true });
                  const b = method$(id, customId, { singelton: true });
                  expect(a && b).toBeTruthy();
                  expect(a).not.toBe(b);
                });
              }

              describe("distinctUntilChangedIsEqual", () => {
                it("should not use the reference passed to the user to determine changes", async () => {
                  let friendObs: Friend;
                  const waits = new Array(2)
                    .fill(null)
                    .map(() => flatPromise());
                  let emitCount = 0;

                  subs.add(
                    method$(id, customId).subscribe((friend) => {
                      if (!friend) return;

                      emitCount++;
                      friendObs = friend as Friend;

                      switch (emitCount) {
                        case 1:
                          waits[0].resolve();
                          break;
                        case 2:
                          waits[1].resolve();
                      }
                    })
                  );

                  await waits[0].promise;
                  expect(emitCount).toBe(1);

                  friendObs!.firstName = "99999999";
                  await db.friends.update(id, { firstName: "99999999" });

                  setTimeout(() => waits[1].resolve(), 500);
                  await waits[1].promise;
                  expect(emitCount).toBe(2);
                }, 99999999);
              });
            });
          });

          describe("changes()", () => {
            let obs$: Observable<IDatabaseChange[]>;

            beforeEach(() => {
              obs$ = db.friends.$.changes();
            });

            it("should be an observable", async () => {
              expect(obs$ instanceof Observable).toBeTrue();
            });
            it("should be open", async () => {
              let sub: Subscription;
              const emitPromise = new Promise<void>((resolve) => {
                sub = obs$.subscribe(() => resolve());
                subs.add(sub);
              });
              const [newFriend] = mockFriends(1);
              await db.friends.add(newFriend);
              await emitPromise;
              expect(sub!.closed).toBe(false);
            });
            it("should emit the correct value", async () => {
              const changesPromise = flatPromise<IDatabaseChange[]>();
              obs$.pipe(take(1)).subscribe(changesPromise.resolve);

              const [newFriend] = mockFriends(1);
              await db.friends.add(newFriend);
              const changes = await changesPromise.promise;

              expect(changes.length > 0).toBeTrue();
              expect(
                changes.every((table) => table.table === "friends")
              ).toBeTrue();
            });
            it("should not emit other table changes", async () => {
              const changesPromise = flatPromise<IDatabaseChange[]>();
              obs$.pipe(take(1)).subscribe(changesPromise.resolve);

              const [newFriend] = mockFriends(1);
              await db.friends.add(newFriend);
              const [newEnemy] = mockFriends(1);
              await db.enemies.add(newEnemy);
              const changes = await changesPromise.promise;

              expect(changes.length > 0).toBeTrue();
              expect(
                changes.every((table) => table.table === "friends")
              ).toBeTrue();
            });
          });
        });
        describe("count()", () => {
          it("should emit the correct count on Table", async () => {
            const count$ = db.friends.$.count();
            let count: number | undefined;
            let emitCount = 0;
            const waits = new Array(2).fill(null).map(() => flatPromise());
            subs.add(
              count$.subscribe((_count) => {
                count = _count;
                emitCount++;
                switch (emitCount) {
                  case 1:
                    waits[0].resolve();
                    break;
                  case 2:
                    waits[1].resolve();
                    break;
                }
              })
            );

            await waits[0].promise;
            expect(emitCount).toBe(1);
            expect(count!).toBe(1);

            await db.friends.bulkAdd(mockFriends(5));
            await waits[1].promise;
            expect(emitCount).toBe(2);
            expect(count!).toBe(6);
          });
          it("should emit the correct count on Collection", async () => {
            const count$ = db.friends.$.where(":id").above(0).count();
            let count: number | undefined;
            let emitCount = 0;
            const waits = new Array(2).fill(null).map(() => flatPromise());
            subs.add(
              count$.subscribe((_count) => {
                count = _count;
                emitCount++;
                switch (emitCount) {
                  case 1:
                    waits[0].resolve();
                    break;
                  case 2:
                    waits[1].resolve();
                    break;
                }
              })
            );

            await waits[0].promise;
            expect(emitCount).toBe(1);
            expect(count!).toBe(1);

            await db.friends.bulkAdd(mockFriends(5));
            await waits[1].promise;
            expect(emitCount).toBe(2);
            expect(count!).toBe(6);
          });
        });
        describe("keys()", () => {
          it("should emit the correct value", async () => {
            const keys$ = db.friends.$.toCollection().keys();
            let keys: IndexableTypeArray | undefined;
            let emitCount = 0;
            const waits = new Array(1).fill(null).map(() => flatPromise());
            subs.add(
              keys$.subscribe((_keys) => {
                keys = _keys;
                emitCount++;
                waits[0].resolve();
              })
            );

            await waits[0].promise;
            expect(emitCount).toBe(1);
            if (database.desc === "TestDatabaseCustomKey")
              expect(keys![0] > 10000).toBeTrue();
            else expect(keys![0]).toBe(id);
          });
          it("should emit the correct value (uniqueKeys)", async () => {
            const keys$ = db.friends.$.toCollection().uniqueKeys();
            let keys: IndexableTypeArray | undefined;
            let emitCount = 0;
            const waits = new Array(1).fill(null).map(() => flatPromise());
            subs.add(
              keys$.subscribe((_keys) => {
                keys = _keys;
                emitCount++;
                waits[0].resolve();
              })
            );

            await waits[0].promise;
            expect(emitCount).toBe(1);
            if (database.desc === "TestDatabaseCustomKey")
              expect(keys![0] > 10000).toBeTrue();
            else expect(keys![0]).toBe(id);
          });
          it("should emit the correct value (primaryKeys)", async () => {
            const keys$ = db.friends.$.toCollection().primaryKeys();
            let keys: IndexableTypeArray | undefined;
            let emitCount = 0;
            const waits = new Array(1).fill(null).map(() => flatPromise());
            subs.add(
              keys$.subscribe((_keys) => {
                keys = _keys;
                emitCount++;
                waits[0].resolve();
              })
            );

            await waits[0].promise;
            expect(emitCount).toBe(1);
            if (database.desc === "TestDatabaseCustomKey")
              expect(keys![0] > 10000).toBeTrue();
            else expect(keys![0]).toBe(id);
          });
        });
      });
    });
  });
});
