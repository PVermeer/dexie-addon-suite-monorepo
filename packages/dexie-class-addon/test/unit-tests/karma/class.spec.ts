import * as classMap from '../../../src/class';
import { databasesPositive, Friend, mockFriends } from '../../mocks/mocks.spec';

describe('Immutable databases', () => {
    // Should work for each positive database
    databasesPositive.forEach(database => {
        describe(database.desc, () => {
            let db: ReturnType<typeof database.db>;
            let serializeSpy: jasmine.Spy;
            let deSerializeSpy: jasmine.Spy;
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
                        expect(deSerializeSpy).toHaveBeenCalled();
                        expect(getFriend).toEqual(friend);
                        expect(getFriend).toBeInstanceOf(Friend);
                        expect(getFriend?.someMethod).toBeDefined();
                        expect(getFriend?.date).toBeInstanceOf(Date);
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
                        expect(deSerializeSpy).toHaveBeenCalled();
                        expect(getFriend).toEqual(friend);
                        expect(getFriend).toBeInstanceOf(Friend);
                        expect(getFriend?.someMethod).toBeDefined();
                        expect(getFriend?.date).toBeInstanceOf(Date);
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
                        expect(deSerializeSpy).toHaveBeenCalled();
                        expect(getFriend).toEqual(friend);
                        expect(getFriend).toBeInstanceOf(Friend);
                        expect(getFriend?.someMethod).toBeDefined();
                        expect(getFriend?.date).toBeInstanceOf(Date);
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
                        expect(deSerializeSpy).toHaveBeenCalled();
                        expect(getFriend).toEqual(friendsRead[4]);
                        expect(getFriend).toBeInstanceOf(Friend);
                        expect(getFriend?.someMethod).toBeDefined();
                        expect(getFriend?.date).toBeInstanceOf(Date);
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
            });
        });
    });
});
