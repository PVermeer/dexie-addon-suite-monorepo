import { Dexie } from 'dexie';
import faker from 'faker/locale/nl';
import { Observable, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { databasesNegative, databasesPositive, Friend, methods, mockFriends } from '../../mocks/mocks.spec';
import { flatPromise } from '../../../../common/src/promise';

describe('Rxjs', () => {
    databasesPositive.forEach((database, _i) => {
        // if (_i !== 0) { return; }
        describe(database.desc, () => {
            let db: ReturnType<typeof database.db>;
            let subs: Subscription;
            beforeEach(async () => {
                subs = new Subscription();
                db = database.db(Dexie);
                await db.open();
                expect(db.isOpen()).toBeTrue();
            });
            afterEach(async () => {
                subs.unsubscribe();
                await db.delete();
            });
            describe('db.changes$', () => {
                it('should be an observable', () => {
                    expect(db.changes$ instanceof Observable).toBeTrue();
                });
                it('should be open', async () => {
                    let sub = new Subscription();
                    const emitPromise = new Promise<void>(resolve => {
                        sub = db.changes$.subscribe(
                            () => resolve()
                        );
                        subs.add(sub);
                    });
                    await db.friends.bulkAdd(mockFriends(1));
                    await emitPromise;
                    expect(sub.closed).toBe(false);
                });
                it(`should have same behavior as db.on('changes')`, async () => {
                    const emitEventPromise = new Promise(resolve => {
                        db.on('changes').subscribe(
                            data => resolve(data)
                        );
                    });
                    const emitObsPromise = new Promise(resolve => {
                        subs.add(db.changes$.subscribe(
                            data => resolve(data)
                        ));
                    });
                    await db.friends.bulkAdd(mockFriends(1));
                    const resolved = await Promise.all([emitObsPromise, emitEventPromise]);
                    expect(resolved[0]).toEqual(resolved[1]);
                });
            });
            describe('Methods', () => {
                methods.forEach((method, _j) => {
                    // if (_j !== 0) { return; }
                    let friend: Friend;
                    let id: number;
                    let customId: number;
                    let method$: ReturnType<typeof method.method>;
                    let obs$: ReturnType<ReturnType<typeof method.method>>;

                    describe(method.desc, () => {
                        beforeEach(async () => {
                            [friend] = mockFriends(1);
                            id = await db.friends.add(friend);
                            customId = friend.customId;
                            method$ = method.method(db);
                            obs$ = method$(id, customId);
                        });
                        it('should be an observable', async () => {
                            expect(obs$ instanceof Observable).toBeTrue();
                        });
                        it('should be open', async () => {
                            let sub = new Subscription();
                            const emitPromise = new Promise<void>(resolve => {
                                sub = obs$.subscribe(
                                    () => resolve()
                                );
                                subs.add(sub);
                            });
                            await emitPromise;
                            expect(sub.closed).toBe(false);
                        });
                        it('should emit the correct value', async () => {
                            const getFriend = await obs$.pipe(take(1)).toPromise();
                            expect(getFriend).toEqual(friend);

                            const [newFriend] = mockFriends(1);
                            const newId = await db.friends.add(newFriend);
                            const obsNew$ = method$(newId, newFriend.customId);
                            const getNewFriend = await obsNew$.pipe(take(1)).toPromise();
                            expect(getNewFriend).toEqual(newFriend);

                            const obsOld$ = method$(id, customId);
                            const getOldFriend = await obsOld$.pipe(take(1)).toPromise();
                            expect(getOldFriend).toEqual(friend);
                        });
                        it('should emit on record update', async () => {
                            let emitCount = 0;
                            let obsFriend: Friend | undefined;
                            const emitPromise = new Promise<void>(resolve => {
                                subs.add(method$(id, customId, { emitUndefined: true }).subscribe(
                                    friendEmit => {
                                        emitCount++;
                                        obsFriend = friendEmit as Friend;
                                        if (emitCount === 2) { resolve(); }
                                    }
                                ));
                            });
                            await db.friends.update(id, { firstName: 'TestieUpdate' });
                            await emitPromise;
                            expect(emitCount).toBe(2);
                            expect(obsFriend).toEqual({ ...friend, firstName: 'TestieUpdate' });
                        });
                        it('should emit undefined on record delete', async () => {
                            let emitCount = 0;
                            let obsFriend: Friend | undefined;

                            const waits = new Array(2).fill(null).map(() => flatPromise());
                            subs.add(method$(id, customId, { emitUndefined: true }).subscribe(
                                friendEmit => {
                                    emitCount++;
                                    obsFriend = friendEmit as Friend;
                                    switch (emitCount) {
                                        case 1: waits[0].resolve(); break;
                                        case 2: waits[1].resolve(); break;
                                    }
                                }));

                            await waits[0].promise;
                            expect(emitCount).toBe(1);
                            expect(obsFriend).toEqual(friend);
                            await db.friends.delete(id);
                            await waits[1].promise;
                            expect(emitCount).toBe(2);
                            expect(obsFriend).toBe(undefined);
                        });
                        it('should emit undefined on record delete (slowed)', async () => {
                            let emitCount = 0;
                            let obsFriend: Friend | undefined;

                            const waits = new Array(2).fill(null).map(() => flatPromise());
                            subs.add(method$(id, customId, { emitUndefined: true }).subscribe(
                                friendEmit => {
                                    emitCount++;
                                    obsFriend = friendEmit as Friend;
                                    switch (emitCount) {
                                        case 1: waits[0].resolve(); break;
                                        case 2: waits[1].resolve(); break;
                                    }
                                }));

                            await waits[0].promise;
                            expect(emitCount).toBe(1);
                            expect(obsFriend).toEqual(friend);

                            // Slow down to force two emits from db.changes$
                            await new Promise<void>(resolve => setTimeout(() => resolve(), 500));

                            await db.friends.delete(id);
                            await waits[1].promise;
                            expect(emitCount).toBe(2);
                            expect(obsFriend).toBe(undefined);
                        });
                        it('should emit undefined when id is not found', async () => {
                            let emitCount = 0;
                            let obsFriend: Friend | undefined;
                            const emitPromise = new Promise<void>(resolve => {
                                subs.add(method$(99999999, 99999999, { emitUndefined: true }).subscribe(
                                    friendEmit => {
                                        emitCount++;
                                        obsFriend = friendEmit as Friend;
                                        if (emitCount === 1) { resolve(); }
                                    }
                                ));
                            });
                            await emitPromise;
                            expect(obsFriend).toBe(undefined);
                        });
                        it('should emit when record is created after subscribe', async () => {
                            const friends = mockFriends(50);
                            let emitCount = 0;
                            let obsFriend: Friend | undefined;
                            const randomIdx = faker.datatype.number(49);
                            const emitPromise = new Promise<void>(resolve => {
                                subs.add(method$(id + randomIdx + 1, friends[randomIdx].customId, { emitUndefined: true }
                                ).subscribe(
                                    friendEmit => {
                                        emitCount++;
                                        obsFriend = friendEmit as Friend;
                                        if (emitCount === 2) { resolve(); }
                                    }
                                ));
                            });
                            await Promise.all(friends.map(async x => db.friends.add(x)));
                            await emitPromise;
                            expect(obsFriend).toEqual(friends[randomIdx]);
                        });
                        it('should not emit when no changes', async () => {
                            const friends = mockFriends(50);
                            const updateFriends = [...friends.map(x => {
                                const { customId: _customId, ...rest } = x;
                                return rest;
                            })];
                            const ids = await Promise.all(friends.map(x => db.friends.add(x)));
                            const lastId = id;
                            const updateIds = friends.map((_, i) =>
                                database.desc !== 'TestDatabaseCustomKey' && ids[i] > 1000000 ?
                                    lastId + i + 1 :
                                    ids[i]
                            );

                            const idx1 = faker.datatype.number({ min: 0, max: 9 });
                            const id1 = ids[idx1];
                            const updateId1 = updateIds[idx1];
                            let emitCount = 0;

                            const waits = new Array(4).fill(null).map(() => flatPromise());
                            subs.add(method$(id1, friends[idx1].customId).subscribe(
                                () => {
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
                                }
                            ));
                            // First emit
                            await waits[0].promise;
                            expect(emitCount).toBe(1);

                            // Update different record
                            const idx2 = faker.datatype.number({ min: 10, max: 19 });
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
                            await db.friends.update(updateId1, updateFriends[49]);
                            await waits[3].promise;
                            expect(emitCount).toBe(2);
                        });

                        if (method.array) {
                            it('should be an array', async () => {
                                const getObs$ = method$(id, customId, { emitFull: true });
                                const collection = await getObs$.pipe(take(1)).toPromise();
                                expect(Array.isArray(collection)).toBeTrue();
                            });
                            if (method.alwaysEmit) {
                                it('should emit on updating a record on the table', async () => {
                                    const collection$ = method$(id, customId, { emitFull: true });
                                    let collection: Friend[];
                                    let emitCount = 0;
                                    const waits = new Array(2).fill(null).map(() => flatPromise());
                                    subs.add(collection$.subscribe(friendEmit => {
                                        collection = friendEmit as Friend[];
                                        emitCount++;
                                        switch (emitCount) {
                                            case 1: waits[0].resolve(); break;
                                            case 2: waits[1].resolve(); break;
                                        }
                                    }));

                                    await waits[0].promise;
                                    expect(emitCount).toBe(1);
                                    expect(collection!).toEqual([friend]);

                                    await db.friends.update(id, { lastName: 'TestieTest' });
                                    await waits[1].promise;
                                    expect(emitCount).toBe(2);
                                    expect(collection!).toEqual([{ ...friend, lastName: 'TestieTest' }]);
                                });
                                it('should not emit on updating a record on the table with same data', async () => {
                                    const collection$ = method$(id, customId, { emitFull: true });
                                    let collection: Friend[];
                                    let emitCount = 0;
                                    const waits = new Array(2).fill(null).map(() => flatPromise());
                                    subs.add(collection$.subscribe(friendEmit => {
                                        collection = friendEmit as Friend[];
                                        emitCount++;
                                        switch (emitCount) {
                                            case 1: waits[0].resolve(); break;
                                            case 2: waits[1].resolve(); break;
                                        }
                                    }));

                                    await waits[0].promise;
                                    expect(collection!).toEqual([friend]);

                                    await db.friends.update(id, { lastName: friend.lastName });
                                    setTimeout(() => waits[1].resolve(), 500);
                                    await waits[1].promise;
                                    expect(emitCount).toBe(1);
                                    expect(collection!).toEqual([friend]);
                                });
                                it('should emit on adding/removing to the table', async () => {
                                    const getObs$ = method$(id, customId, { emitFull: true });
                                    let collection: Friend[];
                                    let emitCount = 0;
                                    const waits = new Array(3).fill(null).map(() => flatPromise());
                                    subs.add(getObs$.subscribe(friendEmit => {
                                        collection = friendEmit as Friend[];
                                        emitCount++;
                                        switch (emitCount) {
                                            case 1: waits[0].resolve(); break;
                                            case 2: waits[1].resolve(); break;
                                            case 3: waits[2].resolve(); break;
                                        }
                                    }));

                                    await waits[0].promise;
                                    expect(emitCount).toBe(1);
                                    expect(collection!).toEqual([friend]);

                                    const friends = mockFriends(9);
                                    await Promise.all(friends.map(x => db.friends.add(x)));
                                    await waits[1].promise;
                                    expect(emitCount).toBe(2);
                                    expect(collection!).toEqual(jasmine.arrayContaining([
                                        friend,
                                        ...friends.map(x => jasmine.objectContaining(x))
                                    ]));
                                    expect(collection!.length).toBe(10);

                                    await db.friends.delete(id);
                                    await waits[2].promise;
                                    expect(emitCount).toBe(3);
                                    expect(collection!).toEqual(jasmine.arrayContaining(
                                        friends.map(x => jasmine.objectContaining(x))
                                    ));
                                    expect(collection!.length).toBe(9);
                                });
                            }
                        }

                        if (method.singelton) {
                            it('should be the same Observable instance', () => {
                                const a = method$(id, customId, { singelton: true });
                                const b = method$(id, customId, { singelton: true });
                                expect(a && b).toBeTruthy();
                                expect(a).toBe(b);
                            });
                        }
                    });
                });
            });
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            describe('Fixes', () => {
            });
        });
    });
    databasesNegative.forEach(database => {
        describe(database.desc, () => {
            let db: ReturnType<typeof database.db>;
            beforeEach(async () => {
                db = database.db(Dexie);
            });
            afterEach(async () => {
                await db.delete();
            });
        });
    });
});
