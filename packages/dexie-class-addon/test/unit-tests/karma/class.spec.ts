import * as classMap from '../../../src/class';
import { databasesPositive, Friend, mockFriends } from '../../mocks/mocks.spec';

describe('dexie-class-addon class.spec', () => {

    describe('Immutable databases', () => {
        // Should work for each positive database
        databasesPositive.forEach(database => {
            describe(database.desc, () => {
                let db: ReturnType<typeof database.db>;
                let serializeSpy: jasmine.Spy;
                let deSerializeSpy: jasmine.Spy;
                const friendExpectations = (friend: Friend) => {
                    expect(deSerializeSpy).toHaveBeenCalled();
                    expect(friend).toEqual(friend);
                    expect(friend).toBeInstanceOf(Friend);
                    expect(friend?.someMethod).toBeDefined();
                    expect(friend?.date).toBeInstanceOf(Date);
                };

                beforeEach(async () => {
                    spyOn(classMap, 'classMap').and.callThrough();
                    serializeSpy = spyOn(Friend.prototype, 'serialize').and.callThrough();
                    deSerializeSpy = spyOn(Friend.prototype, 'deserialize').and.callThrough();
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
                    expect(classMap.classMap).toHaveBeenCalled();
                });
                describe('Methods', () => {
                    describe('Add()', () => {
                        it('should be able to add() and get() friend', async () => {
                            const [friend] = mockFriends(1);
                            const id = await db.friends.add(friend);
                            expect(serializeSpy).toHaveBeenCalled();
                            friend.id = id;

                            const getFriend = await db.friends.get(id) as Friend;
                            friendExpectations(getFriend);
                        });
                        it('should be able to bulkAdd() and get() friends', async () => {
                            const friends = mockFriends();
                            const friendIds = await db.friends.bulkAdd(friends, { allKeys: true });
                            const expectedFriends = friends.map((friend, i) => {
                                friend.id = friendIds[i];
                                return friend;
                            });

                            const getFriends = await db.friends.bulkGet(friendIds);
                            expect(getFriends).toEqual(jasmine.arrayContaining(expectedFriends));
                        });
                    });
                    describe('Put()', () => {
                        it('should be able to put() and get() friend', async () => {
                            const [friend] = mockFriends(1);
                            const id = await db.friends.put(friend);
                            expect(serializeSpy).toHaveBeenCalled();
                            friend.id = id;

                            const getFriend = await db.friends.get(id) as Friend;
                            friendExpectations(getFriend);
                        });
                        it('should be able to bulkPut() and get() friends', async () => {
                            const friends = mockFriends();
                            const friendIds = await db.friends.bulkPut(friends, { allKeys: true });
                            const expectedFriends = friends.map((friend, i) => {
                                friend.id = friendIds[i];
                                return friend;
                            });

                            const getFriends = await db.friends.bulkGet(friendIds);
                            expect(getFriends).toEqual(jasmine.arrayContaining(expectedFriends));
                        });
                    });
                    describe('Update()', () => {
                        let friend: Friend;
                        let id: number;
                        beforeEach(async () => {
                            [friend] = mockFriends(1);
                            id = await db.friends.add(friend);
                            friend.id = id;
                        });
                        it('should be able to update document', async () => {
                            const updatedDoc: Partial<Friend> = { firstName: 'mock name' };
                            await db.friends.update(id, updatedDoc);
                            friend.firstName = 'mock name';

                            const getFriend = await db.friends.get(id);
                            friendExpectations(getFriend!);
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
                            friendsRead[4].id = id;
                            const getFriend = await db.friends.get(id);
                            friendExpectations(getFriend!);
                        });
                    });
                    describe('Where()', () => {
                        let friendsRead: Friend[];
                        beforeEach(async () => {
                            friendsRead = mockFriends();
                            const friendIds = await db.friends.bulkAdd(friendsRead, { allKeys: true });
                            friendsRead.forEach((friend, i) => {
                                friend.id = friendIds[i];
                                return friend;
                            });
                        });
                        it('should be able to use where()', async () => {
                            const friends = await db.friends.where('age')
                                .between(1, 80, true, true).toArray();

                            expect(deSerializeSpy).toHaveBeenCalled();
                            expect(friends).toEqual(jasmine.arrayContaining(friendsRead));
                            expect(friends.length > 0).toBeTrue();
                            friends.forEach(friend => {
                                expect(friend).toBeInstanceOf(Friend);
                                expect(friend?.someMethod).toBeDefined();
                                expect(friend?.date).toBeInstanceOf(Date);
                            });
                        });
                    });
                    describe('Transaction()', () => {
                        it('should be able to get a raw document', async () => {
                            const [friend] = mockFriends(1);
                            const id = await db.friends.add(friend);

                            const iDb = db.backendDB();
                            const request = iDb.transaction('friends', 'readonly').objectStore('friends').get(id);
                            await new Promise(resolve => request.onsuccess = resolve);
                            const friendRaw = request.result as Friend;
                            let transactionFriend: Friend | undefined;

                            await db.transaction('readonly', db.friends, async transaction => {
                                transaction.raw = true;
                                transactionFriend = await db.friends.get(id) as Friend;
                            });
                            expect(transactionFriend).toEqual(friendRaw);
                        });
                        it('should be able to set a raw document in transaction', async () => {
                            const [friend] = mockFriends(1);
                            const id = await db.friends.add(friend);

                            const iDb = db.backendDB();
                            const request = iDb.transaction('friends', 'readonly').objectStore('friends').get(id);
                            await new Promise(resolve => request.onsuccess = resolve);
                            const friendRaw = request.result as Friend;
                            let transactionFriend: Friend | undefined;
                            let transactionFriend2: Friend | undefined;

                            await db.transaction('readonly', db.friends, async transaction => {
                                transaction.raw = true;
                                transactionFriend = await db.friends.get(id) as Friend;
                            });

                            expect(transactionFriend).toEqual(friendRaw);

                            await db.transaction('readwrite', db.friends, async transaction => {
                                transaction.raw = true;
                                transactionFriend = await db.friends.get(id) as Friend;

                                transactionFriend.firstName = 'firstName';
                                await db.friends.put(transactionFriend, id);
                                transactionFriend2 = await db.friends.get(id) as Friend;
                            });

                            const request2 = iDb.transaction('friends', 'readonly').objectStore('friends').get(id);
                            await new Promise(resolve => request2.onsuccess = resolve);
                            const friendRaw2 = request2.result as Friend;

                            expect(friendRaw2).toEqual({ ...friendRaw, firstName: 'firstName' } as Friend);
                        });
                    });
                });
                describe('Fixes', () => {
                    it('should remove an undefined primary index', async () => {
                        const [friend] = mockFriends(1);
                        const id = await db.friends.add(friend);
                        await db.friends.update(id, friend);

                        const getFriend = await db.friends.get(id) as Friend;
                        friendExpectations(getFriend!);
                    });
                });
            });
        });
    });

});
