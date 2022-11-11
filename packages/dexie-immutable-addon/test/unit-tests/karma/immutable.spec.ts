import * as immutable from '../../../src/immutable';
import { databasesPositive, Friend, mockFriends, TestDatabaseNotImmutable, TestDatabaseWithHooks } from '../../mocks/mocks.spec';

describe('dexie-immutable-addon immutable.spec', () => {

    describe('Immutable databases', () => {
        // Should work for each positive database
        databasesPositive.forEach(database => {
            describe(database.desc, () => {
                let db: ReturnType<typeof database.db>;
                beforeEach(async () => {
                    spyOn(immutable, 'immutable').and.callThrough();
                    db = database.db();
                    await db.open();
                    expect(db.isOpen()).toBeTrue();
                });
                afterEach(async () => {
                    await db.delete();
                });
                it('should override create methods', async () => {
                    const [friend] = mockFriends(1);
                    await db.friends.add(friend);
                    expect(immutable.immutable).toHaveBeenCalled();
                });
                describe('Methods', () => {
                    describe('Add()', () => {
                        it('should not change input object', async () => {
                            const [friend] = mockFriends(1);
                            const id = await db.friends.add(friend);
                            const getFriend = await db.friends.get(id) as Friend;

                            expect(friend.id).toBeUndefined();
                            expect(getFriend.id).toBeTruthy();
                        });
                        it('should be able to add() and get() friend', async () => {
                            const [friend] = mockFriends(1);
                            const id = await db.friends.add(friend);

                            const getFriend = await db.friends.get(id) as Friend;
                            expect(getFriend).toEqual({ ...friend, id });
                        });
                        it('should be able to bulkAdd() and get() friends', async () => {
                            const friends = mockFriends();
                            const lastId = await db.friends.bulkAdd(friends);
                            const expectedFriends = friends.map((friend, i) => ({
                                ...friend, id: lastId - (friends.length - 1 - i)
                            }));

                            /* For v3 of Dexie */
                            // const getFriends = await db.friends.bulkGet(hashedIds);
                            const getFriends = await Promise.all(expectedFriends.map(friend => db.friends.get(friend.id)));
                            expect(getFriends).toEqual(jasmine.arrayContaining(expectedFriends));
                        });
                        it('should be able to add() partial friend and get() partial friend', async () => {
                            const [friend] = mockFriends(1);
                            const { shoeSize, ...partialFriend } = friend;
                            const id = await db.friends.add(partialFriend as Friend);

                            const getFriend = await db.friends.get(id);
                            expect(getFriend).toEqual({ ...partialFriend, id } as Friend);
                        });
                    });
                    describe('Put()', () => {
                        it('should not change input object', async () => {
                            const [friend] = mockFriends(1);
                            const id = await db.friends.put(friend);
                            const getFriend = await db.friends.get(id) as Friend;

                            expect(friend.id).toBeUndefined();
                            expect(getFriend.id).toBeTruthy();
                        });
                        describe('Create', () => {
                            it('should be able to put() and get() friend', async () => {
                                const [friend] = mockFriends(1);
                                const id = await db.friends.put(friend);

                                const getFriend = await db.friends.get(id);
                                expect(getFriend).toEqual({ ...friend, id });
                            });
                            it('should be able to bulkPut() and get() friends', async () => {
                                const friends = mockFriends();
                                const lastId = await db.friends.bulkPut(friends);
                                const expectedFriends = friends.map((friend, i) => ({
                                    ...friend, id: lastId - (friends.length - 1 - i)
                                }));

                                const getFriends = await Promise.all(expectedFriends.map(friend => db.friends.get(friend.id)));
                                expect(getFriends).toEqual(jasmine.arrayContaining(expectedFriends));
                            });
                        });
                        describe('Overwrite', () => {
                            it('should be able to overwrite document when id exists', async () => {
                                const [friend] = mockFriends(1);
                                const id = await db.friends.put(friend);

                                const getFriend = await db.friends.get(id);
                                expect(getFriend).toEqual({ ...friend, id });

                                const [friend2] = mockFriends(1);
                                await db.friends.put({ ...friend2, id });

                                const getFriend2 = await db.friends.get(id);
                                expect(getFriend2).toEqual({ ...friend2, id });
                            });
                            it('should be able to bulkPut() and get() friends', async () => {
                                const friends = mockFriends();
                                const lastId = await db.friends.bulkPut(friends);
                                const expectedFriends = friends.map((friend, i) => ({
                                    ...friend, id: lastId - (friends.length - 1 - i)
                                }));

                                const getFriends = await Promise.all(expectedFriends.map(friend => db.friends.get(friend.id)));
                                expect(getFriends).toEqual(jasmine.arrayContaining(expectedFriends));

                                const friends2 = mockFriends();
                                const lastId2 = await db.friends.bulkPut(friends2);
                                const expectedFriends2 = friends2.map((friend, i) => ({
                                    ...friend, id: lastId2 - (friends2.length - 1 - i)
                                }));

                                const getFriends2 = await Promise.all(expectedFriends2.map(friend => db.friends.get(friend.id)));
                                expect(getFriends2).toEqual(jasmine.arrayContaining(expectedFriends2));
                            });
                        });
                    });
                    describe('Update()', () => {
                        let id: number;
                        beforeEach(async () => {
                            const [friend] = mockFriends(1);
                            id = await db.friends.add(friend);
                        });
                        it('should not change input object', async () => {
                            const [friend] = mockFriends(1);
                            await db.friends.update(id, friend);
                            const getFriend = await db.friends.get(id) as Friend;

                            expect(friend.id).toBeUndefined();
                            expect(getFriend.id).toBe(id);
                        });
                        it('should be able to update document', async () => {
                            const getFriend = await db.friends.get(id) as Friend;

                            const updatedDoc: Friend = { ...getFriend, firstName: 'mock name' };
                            await db.friends.update(id, updatedDoc);

                            const getFriend2 = await db.friends.get(id);
                            expect(getFriend2).toEqual(updatedDoc);
                        });
                        it('should be able to add to the document', async () => {
                            const getFriend = await db.friends.get(id) as Friend;

                            const updatedDoc: Friend = { ...getFriend, testProp: 'testie' };
                            await db.friends.update(id, updatedDoc);

                            const getFriend2 = await db.friends.get(id);
                            expect(getFriend2).toEqual(updatedDoc);
                        });
                        it('should be able to remove from the document', async () => {
                            const getFriend = await db.friends.get(id) as Friend;

                            const updatedDoc: Friend = { ...getFriend, shoeSize: undefined } as any;
                            const test = await db.friends.update(id, updatedDoc);

                            const getFriend2 = await db.friends.get(id);

                            const { shoeSize, ...expectedDoc } = updatedDoc;
                            expect(test).toBe(1);
                            expect(getFriend2).toEqual(expectedDoc as any);
                        });
                    });
                    describe('Get()', () => {
                        let friendsRead: Friend[];
                        let id: number;
                        beforeEach(async () => {
                            friendsRead = mockFriends();
                            id = await db.friends.bulkAdd(friendsRead);
                        });
                        it('should be able to get the document', async () => {
                            const friend = await db.friends.get(id);
                            expect(friend).toEqual({ ...friendsRead[4], id });
                        });
                    });
                    describe('Where()', () => {
                        let friendsRead: Friend[];
                        let friendsWithIds: Friend[];
                        beforeEach(async () => {
                            friendsRead = mockFriends();
                            const lastId = await db.friends.bulkAdd(friendsRead);
                            friendsWithIds = friendsRead.map((friend, i) => ({
                                ...friend, id: lastId - (friendsRead.length - 1 - i)
                            }));
                        });
                        it('should not change input object on modify()', async () => {
                            const [friend] = mockFriends(1);
                            const id = await db.friends.add(friend);

                            const [friend2] = mockFriends(1);
                            await db.friends.where('id')
                                .equals(id)
                                .modify(() => friend2);

                            const getFriend = await db.friends.get(id) as Friend;

                            expect(friend.id).toBeUndefined();
                            expect(friend2.id).toBeUndefined();
                            expect(getFriend.id).toBe(id);
                        });
                        it('should be able to use where()', async () => {
                            const friends = await db.friends.where('age')
                                .between(1, 80, true, true).toArray();
                            expect(friends).toEqual(jasmine.arrayContaining(friendsWithIds));
                        });
                    });
                });
            });
        });
        describe('With custom hooks', () => {
            let db: TestDatabaseWithHooks;
            beforeEach(async () => {
                db = new TestDatabaseWithHooks('TestDatabaseWithHooks');
                await db.open();
                expect(db.isOpen()).toBeTrue();
            });
            afterEach(async () => {
                await db.delete();
            });
            describe('Hooks', () => {
                it(`should not change input object on 'creating'`, async () => {
                    const [friend] = mockFriends(1);
                    const id = await db.friends.add(friend);
                    const getFriend = await db.friends.get(id) as Friend;

                    expect(friend.id).toBeUndefined();
                    expect(getFriend.id).toBeTruthy();
                    expect(getFriend.firstName).not.toBe(friend.firstName);
                });
                it(`should not change input object on 'updating'`, async () => {
                    const [friend] = mockFriends(1);
                    const id = await db.friends.add(friend);

                    await db.friends.update(id, { shoeSize: 50 });

                    const getFriend = await db.friends.get(id) as Friend;

                    expect(friend.id).toBeUndefined();
                    expect(getFriend.id).toBeTruthy();
                    expect(getFriend.firstName).not.toBe(friend.firstName);
                    expect(getFriend.lastName).not.toBe(friend.lastName);
                    expect(getFriend.shoeSize).toBe(50);
                });
            });
        });
        describe('Negative', () => {
            describe('Mutable database', () => {
                let db: TestDatabaseNotImmutable;
                beforeEach(() => {
                    spyOn(immutable, 'immutable').and.callThrough();
                    db = new TestDatabaseNotImmutable('TestDatabaseNotImmutable');
                });
                it('should not override create methods when immutable is not set', async () => {
                    const [friend] = mockFriends(1);
                    await db.open();
                    await db.friends.add(friend);
                    expect(immutable.immutable).not.toHaveBeenCalled();
                    await db.delete();
                });
                it('should change input object', async () => {
                    const [friend] = mockFriends(1);
                    const id = await db.friends.add(friend);
                    const getFriend = await db.friends.get(id) as Friend;

                    expect(friend.id).toBeTruthy();
                    expect(getFriend.id).toBeTruthy();
                });
            });
        });
    });

});
