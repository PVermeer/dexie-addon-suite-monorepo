import faker from 'faker/locale/en';
import { IndexableTypeExtended } from '../../../src';
import * as hooks from '../../../src/hooks';
import { arrayBuffersAreEqual, FALSE_BINARY, FALSE_STRING, NULL_BINARY, NULL_STRING, TRUE_BINARY, TRUE_STRING } from '../../../src/utils';
import { databasesPositive, Friend, mockFriends, TestDatabaseWithHooks } from '../../mocks/mocks.spec';

describe('dexie-boolean-null-index-addon null-index.spec', () => {

    describe('boolean-null-index databases', () => {
        // Should work for each positive database
        databasesPositive.forEach(database => {
            describe(database.desc, () => {

                let db: ReturnType<typeof database.db>;

                beforeEach(async () => {
                    db = database.db();
                    await db.delete();
                    await db.open();
                    expect(db.isOpen()).toBeTrue();
                });
                afterAll(async () => {
                    await db.delete();
                });
                describe('Hooks', () => {
                    let friends: Friend[];
                    let id: number;
                    let ids: number[];
                    let newFriends: Friend[];
                    beforeEach(async () => {
                        friends = mockFriends();
                        newFriends = mockFriends();
                        ids = await db.friends.bulkAdd(friends, { allKeys: true });
                        id = ids[0];
                        const hooksSpy = spyOnAllFunctions(hooks);
                        Object.keys(hooksSpy).forEach(key => hooksSpy[key].and.callThrough());
                    });
                    describe('Creation', () => {
                        afterEach(() => {
                            expect(hooks.mapToBinaryOnCreation).toHaveBeenCalled();
                            expect(hooks.mapToBinaryOnUpdating).not.toHaveBeenCalled();
                            expect(hooks.mapBinaryToValueOnReading).not.toHaveBeenCalled();
                        });
                        it('should be called on add()', async () => {
                            await db.friends.add(newFriends[0]);
                        });
                        it('should be called on bulkAdd()', async () => {
                            await db.friends.bulkAdd(newFriends);
                        });
                        it('should be called on put()', async () => {
                            await db.friends.put(newFriends[0]);
                        });
                        it('should be called on bulkPut()', async () => {
                            await db.friends.bulkPut(newFriends);
                        });
                    });
                    describe('Updating', () => {
                        afterEach(() => {
                            expect(hooks.mapToBinaryOnUpdating).toHaveBeenCalled();
                            expect(hooks.mapToBinaryOnCreation).not.toHaveBeenCalled();
                            expect(hooks.mapBinaryToValueOnReading).not.toHaveBeenCalled();
                        });
                        it('should be called on update()', async () => {
                            await db.friends.update(id, newFriends[0]);
                        });
                        it('should be called on put()', async () => {
                            await db.friends.put({ ...newFriends[1], id });
                        });
                        it('should be called on bulkPut()', async () => {
                            const friends2 = mockFriends();
                            const hashedDocuments = friends2.map((friend, i) => ({ ...friend, id: ids[i] }));
                            await db.friends.bulkPut(hashedDocuments);
                        });
                    });
                    describe('Reading', () => {
                        afterEach(() => {
                            expect(hooks.mapBinaryToValueOnReading).toHaveBeenCalled();
                            expect(hooks.mapToBinaryOnUpdating).not.toHaveBeenCalled();
                            expect(hooks.mapToBinaryOnCreation).not.toHaveBeenCalled();
                        });
                        it('should be called on get()', async () => {
                            await db.friends.get(id);
                        });
                        it('should be called on where()', async () => {
                            await db.friends.where('age')
                                .between(1, 80, true, true)
                                .first();
                        });
                    });
                });
                describe('Methods', () => {

                    const valueTypes = [
                        { type: 'null', dbStringValue: NULL_STRING, dbBinaryValue: NULL_BINARY, documentValue: null },
                        { type: 'true', dbStringValue: TRUE_STRING, dbBinaryValue: TRUE_BINARY, documentValue: true },
                        { type: 'false', dbStringValue: FALSE_STRING, dbBinaryValue: FALSE_BINARY, documentValue: false },
                    ] as const;

                    valueTypes.forEach(({ type, dbStringValue, dbBinaryValue, documentValue }) => {

                        describe(`add() (${type})`, () => {
                            it(`should be binary "${dbStringValue}" in db type on create / read`, async () => {
                                const [friend] = mockFriends(1);
                                friend.age = documentValue;
                                const id = await db.friends.add(friend);
                                const getFriend = await db.friends.get(id) as Friend;

                                expect(friend.age === documentValue).withContext('Pre check').toBeTrue();
                                expect(getFriend.age === documentValue).withContext('Read value').toBeTrue();

                                let friendRaw: any;

                                await db.transaction('readonly', db.friends, async (transaction) => {
                                    transaction.raw = true;
                                    friendRaw = await db.friends.get(id) as Friend;
                                });

                                expect(arrayBuffersAreEqual(friendRaw.age, dbBinaryValue)).withContext('Db value').toBeTrue();
                            });
                        });
                        describe(`bulkAdd() (${type})`, () => {
                            it(`should be binary "${dbStringValue}" in db type on create / read`, async () => {

                                const friends = mockFriends().map(friend => ({ ...friend, age: documentValue }));
                                await db.friends.bulkAdd(friends);
                                const getFriends = await db.friends.toArray();

                                expect(friends.every(friend => friend.age === documentValue)).withContext('Pre check').toBeTrue();
                                expect(getFriends.every(friend => friend.age === documentValue)).withContext('Read value').toBeTrue();

                                let friendsRaw: any[];

                                await db.transaction('readonly', db.friends, async (transaction) => {
                                    transaction.raw = true;
                                    friendsRaw = await db.friends.toArray();
                                });

                                expect(friendsRaw!.every(friendRaw => arrayBuffersAreEqual(friendRaw.age, dbBinaryValue))).withContext('Db value').toBeTrue();
                            });
                        });
                        describe(`put() (${type})`, () => {
                            it(`should be "${dbStringValue}" in db type on create / read`, async () => {
                                const [friend] = mockFriends(1);
                                friend.age = documentValue;
                                const id = await db.friends.put(friend);
                                const getFriend = await db.friends.get(id) as Friend;

                                expect(friend.age === documentValue).withContext('Pre check').toBeTrue();
                                expect(getFriend.age === documentValue).withContext('Read value').toBeTrue();

                                let friendRaw: any;

                                await db.transaction('readonly', db.friends, async (transaction) => {
                                    transaction.raw = true;
                                    friendRaw = await db.friends.get(id) as Friend;
                                });

                                expect(arrayBuffersAreEqual(friendRaw.age, dbBinaryValue)).withContext('Db value').toBeTrue();
                            });
                            it(`should be "${dbStringValue}" in db and ${type} type on put overwrite`, async () => {
                                const [friend] = mockFriends(1);
                                expect(friend.age).not.toBeNull();

                                const id = await db.friends.put(friend);
                                const getFriendAdd = await db.friends.get(id) as Friend;
                                expect(friend.age).not.toBeNull();
                                expect(getFriendAdd.age).not.toBeNull();

                                friend.age = documentValue;
                                friend.id = id;
                                await db.friends.put(friend);
                                const getFriendPut = await db.friends.get(id) as Friend;

                                expect(getFriendAdd.age !== documentValue).withContext('Pre-check').toBeTrue();
                                expect(getFriendPut.age === documentValue).withContext('Read value').toBeTrue();

                                let friendRaw: any;

                                await db.transaction('readonly', db.friends, async (transaction) => {
                                    transaction.raw = true;
                                    friendRaw = await db.friends.get(id) as Friend;
                                });

                                expect(arrayBuffersAreEqual(friendRaw.age, dbBinaryValue)).withContext('Db value').toBeTrue();
                            });
                        });
                        describe(`bulkPut() (${type})`, () => {
                            it(`should be "${dbStringValue}" in db type on create / read`, async () => {
                                const friends = mockFriends().map(friend => ({ ...friend, age: documentValue }));
                                await db.friends.bulkPut(friends);
                                const getFriends = await db.friends.toArray();

                                expect(friends.every(friend => friend.age === documentValue)).withContext('Pre check').toBeTrue();
                                expect(getFriends.every(friend => friend.age === documentValue)).withContext('Read value').toBeTrue();

                                let friendsRaw: any[];

                                await db.transaction('readonly', db.friends, async (transaction) => {
                                    transaction.raw = true;
                                    friendsRaw = await db.friends.toArray();
                                });

                                expect(friendsRaw!.every(friendRaw => arrayBuffersAreEqual(friendRaw.age, dbBinaryValue))).withContext('Db value').toBeTrue();
                            });
                            it(`should be "${dbStringValue}" in db on put overwrite`, async () => {
                                const friends = mockFriends();
                                await db.friends.bulkPut(friends);
                                const getFriendsAdd = await db.friends.toArray();

                                expect(friends.every(friend => friend.age !== documentValue)).withContext('Pre check').toBeTrue();
                                expect(getFriendsAdd.every(friend => friend.age !== documentValue)).withContext('Pre check 2').toBeTrue();

                                const valueFriends = getFriendsAdd.map(friend => ({ ...friend, age: documentValue }));
                                await db.friends.bulkPut(valueFriends);
                                const getFriendsPut = await db.friends.toArray();

                                expect(valueFriends.every(friend => friend.age === documentValue)).withContext('Pre check 3').toBeTrue();
                                expect(getFriendsPut.every(friend => friend.age === documentValue)).withContext('Read value').toBeTrue();

                                let friendsRaw: any[];

                                await db.transaction('readonly', db.friends, async (transaction) => {
                                    transaction.raw = true;
                                    friendsRaw = await db.friends.toArray();
                                });

                                expect(friendsRaw!.every(friendRaw => arrayBuffersAreEqual(friendRaw.age, dbBinaryValue))).withContext('Db value').toBeTrue();
                            });
                        });
                        describe(`update() (${type})`, () => {
                            it(`should be "${dbStringValue}" in db on update`, async () => {
                                const [friend] = mockFriends(1);
                                friend.age = documentValue;
                                const id = await db.friends.add(friend);

                                await db.friends.update(id, { age: documentValue });
                                const getFriend = await db.friends.get(id) as Friend;

                                expect(getFriend.age === documentValue).withContext('Read value').toBeTrue();

                                let friendRaw: any;

                                await db.transaction('readonly', db.friends, async (transaction) => {
                                    transaction.raw = true;
                                    friendRaw = await db.friends.get(id) as Friend;
                                });

                                expect(arrayBuffersAreEqual(friendRaw.age, dbBinaryValue)).withContext('Db value').toBeTrue();
                            });
                        });
                        describe(`get() (${type})`, (() => {
                            let id: number;
                            beforeEach(async () => {
                                const [friend] = mockFriends(1);
                                id = await db.friends.add(friend);
                            });
                            it('should be able to get by keyPath', async () => {
                                await db.friends.update(id, { age: documentValue });
                                const getFriend = await db.friends.get({ age: documentValue }) as Friend;

                                expect(getFriend.age === documentValue).withContext('Read value').toBeTrue();

                                let friendRaw: any;

                                await db.transaction('readonly', db.friends, async (transaction) => {
                                    transaction.raw = true;
                                    friendRaw = await db.friends.get({ age: documentValue }) as Friend;
                                });

                                expect(arrayBuffersAreEqual(friendRaw.age, dbBinaryValue)).withContext('Db value').toBeTrue();
                            });
                            it('should be able to get with multiple key paths', async () => {
                                await db.friends.update(id, { age: documentValue, shoeSize: 12 });
                                const getFriend = await db.friends.get({ id, age: documentValue, shoeSize: 12 }) as Friend;

                                expect(getFriend.age === documentValue).withContext('Read value').toBeTrue();

                                let friendRaw: any;

                                await db.transaction('readonly', db.friends, async (transaction) => {
                                    transaction.raw = true;
                                    friendRaw = await db.friends.get({ id, age: documentValue, shoeSize: 12 }) as Friend;
                                });

                                expect(arrayBuffersAreEqual(friendRaw.age, dbBinaryValue)).withContext('Db value').toBeTrue();
                            });
                        }));
                        describe(`count() (${type})`, (() => {
                            it('should be able to count', async () => {
                                const friends = mockFriends(5);
                                const id = await db.friends.bulkAdd(friends);

                                await db.friends.update(id, { age: documentValue });
                                const count = await db.friends.count();

                                expect(count).toBe(5);
                            });
                        }));
                        describe('each()', (() => {
                            it(`should be included in ${type}`, async () => {

                                const friends = mockFriends(5);
                                friends[2].age = documentValue;
                                await db.friends.bulkAdd(friends);

                                const getFriends: Friend[] = [];

                                await db.friends.each(friend => {
                                    getFriends.push(friend);
                                });

                                expect(getFriends.some(friend => friend.age === documentValue)).withContext('With value').toBeTrue();
                                expect(getFriends.length).withContext('Wrong length').toBe(5);
                            });
                        }));
                        describe('filter()', (() => {
                            it(`should be able to filter out ${type}`, async () => {

                                const friends = mockFriends(5);
                                friends[2].age = documentValue;
                                await db.friends.bulkAdd(friends);

                                const getFriends = await db.friends.filter(friend => friend.age !== documentValue).toArray();

                                expect(getFriends.every(friend => friend.age !== documentValue)).withContext('With value').toBeTrue();
                                expect(getFriends.length).withContext('Wrong length').toBe(4);
                            });
                            it(`should be able to filter for ${type}`, async () => {

                                const friends = mockFriends(5);
                                friends[2].age = documentValue;
                                await db.friends.bulkAdd(friends);

                                const getFriends = await db.friends.filter(friend => friend.age === documentValue).toArray();

                                expect(getFriends.some(friend => friend.age === documentValue)).withContext('With value').toBeTrue();
                                expect(getFriends.length).withContext('Wrong length').toBe(1);
                            });
                        }));
                        describe('orderBy()', (() => {
                            it(`should be able to order with ${type}`, async () => {

                                const friends = mockFriends(5);
                                friends[2].age = documentValue;
                                await db.friends.bulkAdd(friends);

                                const getFriends = await db.friends.orderBy('age').toArray();

                                expect(getFriends.some(friend => friend.age === documentValue)).withContext('With value').toBeTrue();
                                expect(getFriends.length).withContext('Wrong length').toBe(5);
                            });
                            it(`should be able to order with other property`, async () => {

                                const friends = mockFriends(5);
                                friends[2].age = documentValue;
                                await db.friends.bulkAdd(friends);

                                const getFriends = await db.friends.orderBy('firstName').toArray();

                                expect(getFriends.some(friend => friend.age === documentValue)).withContext('With value').toBeTrue();
                                expect(getFriends.length).withContext('Wrong length').toBe(5);
                            });

                        }));
                        describe('where()', () => {
                            let ids: number[];
                            let testId: number;
                            let friends: Friend[];

                            beforeEach(async () => {
                                friends = mockFriends(10);
                                ids = await db.friends.bulkAdd(friends, { allKeys: true });
                                [testId] = ids;
                                await db.friends.update(testId, {
                                    age: documentValue,
                                    firstName: documentValue,
                                    shoeSize: 12
                                });
                            });

                            it('should be able to query by keyPath', async () => {
                                const getFriend = await db.friends.where({ age: documentValue }).first() as Friend;

                                expect(getFriend.age === documentValue).withContext('Read value').toBeTrue();

                                let friendRaw: any;

                                await db.transaction('readonly', db.friends, async (transaction) => {
                                    transaction.raw = true;
                                    friendRaw = await db.friends.get({ age: documentValue }) as Friend;
                                });

                                expect(arrayBuffersAreEqual(friendRaw.age, dbBinaryValue)).withContext('Db value').toBeTrue();
                            });
                            it('should be able to query with multiple keys', async () => {
                                const getFriend = await db.friends.where(['age', 'shoeSize']).equals([documentValue, 12]).first() as Friend;

                                expect(getFriend.age === documentValue).withContext('Read value').toBeTrue();

                                let friendRaw: any;

                                await db.transaction('readonly', db.friends, async (transaction) => {
                                    transaction.raw = true;
                                    friendRaw = await db.friends.get({ age: documentValue, shoeSize: 12 }) as Friend;
                                });

                                expect(arrayBuffersAreEqual(friendRaw.age, dbBinaryValue)).withContext('Db value').toBeTrue();
                            });
                            it('should be able to get with multiple key paths', async () => {
                                const getFriend = await db.friends.where({ age: documentValue, shoeSize: 12 }).first() as Friend;

                                expect(getFriend.age === documentValue).withContext('Read value').toBeTrue();

                                let friendRaw: any;

                                await db.transaction('readonly', db.friends, async (transaction) => {
                                    transaction.raw = true;
                                    friendRaw = await db.friends.get({ age: documentValue, shoeSize: 12 }) as Friend;
                                });

                                expect(arrayBuffersAreEqual(friendRaw.age, dbBinaryValue)).withContext('Db value').toBeTrue();
                            });

                            describe('WhereClause', (() => {
                                describe('above()', (() => {
                                    it(`should not query ${type} values`, async () => {

                                        let addFriends: Friend[] = mockFriends(5)
                                            .map(friend => ({ ...friend, age: faker.datatype.number({ min: 90, max: 100 }) }));

                                        const [addFriendLower] = mockFriends(1);
                                        addFriendLower.age = 90;

                                        const [addFriendUpper] = mockFriends(1);
                                        addFriendUpper.age = 100;

                                        addFriends[3].age = documentValue; // Should be filtered out

                                        addFriends = [...addFriends, addFriendLower, addFriendUpper];
                                        await db.friends.bulkAdd(addFriends);

                                        const getFriends = await db.friends.where('age').above(89).toArray();
                                        expect(getFriends.every(friend => friend.age !== documentValue)).withContext('No value').toBeTrue();
                                        expect(getFriends.length).withContext('Wrong length').toBe(addFriends.length - 1);
                                    });
                                    it(`should query ${type} on other properties`, async () => {

                                        const startDate = new Date();
                                        const endDate = faker.date.soon(30);
                                        const aboveDate = new Date(startDate.getTime() - 1);

                                        let addFriends: Friend[] = mockFriends(5)
                                            .map(friend => ({
                                                ...friend,
                                                age: faker.datatype.number({ min: 90, max: 100 }),
                                                date: faker.date.between(startDate, endDate)
                                            }));

                                        const [addFriendLower] = mockFriends(1);
                                        addFriendLower.date = startDate;

                                        const [addFriendUpper] = mockFriends(1);
                                        addFriendUpper.date = endDate;

                                        addFriends[3].age = documentValue; // Should NOT be filtered out

                                        addFriends = [...addFriends, addFriendLower, addFriendUpper];
                                        await db.friends.bulkAdd(addFriends);

                                        const getFriends = await db.friends.where('date').above(aboveDate).toArray();
                                        expect(getFriends.some(friend => friend.age === documentValue)).withContext('With value').toBeTrue();
                                        expect(getFriends.length).withContext('Wrong length').toBe(addFriends.length);
                                    });
                                    it('should work with any high or low value', async () => {

                                        await expectAsync(db.friends.where('age').above(String.fromCharCode(0)).toArray()).toBeResolved();
                                        await expectAsync(db.friends.where('age').above(String.fromCharCode(1)).toArray()).toBeResolved();
                                        await expectAsync(db.friends.where('age').above(String.fromCharCode(65535)).toArray()).toBeResolved();
                                        await expectAsync(db.friends.where('age').above(1).toArray()).toBeResolved();
                                        await expectAsync(db.friends.where('age').above(Number.MAX_SAFE_INTEGER).toArray()).toBeResolved();
                                    });
                                }));
                                describe('aboveOrEqual()', (() => {
                                    it(`should not query ${type} values`, async () => {

                                        let addFriends: Friend[] = mockFriends(5)
                                            .map(friend => ({ ...friend, age: faker.datatype.number({ min: 90, max: 100 }) }));

                                        const [addFriendLower] = mockFriends(1);
                                        addFriendLower.age = 90;

                                        const [addFriendUpper] = mockFriends(1);
                                        addFriendUpper.age = 100;

                                        addFriends[3].age = documentValue; // Should be filtered out

                                        addFriends = [...addFriends, addFriendLower, addFriendUpper];
                                        await db.friends.bulkAdd(addFriends);

                                        const getFriends = await db.friends.where('age').aboveOrEqual(90).toArray();
                                        expect(getFriends.every(friend => friend.age !== documentValue)).withContext('No value').toBeTrue();
                                        expect(getFriends.length).withContext('Wrong length').toBe(addFriends.length - 1);
                                    });
                                    it(`should query ${type} on other properties`, async () => {

                                        const startDate = new Date();
                                        const endDate = faker.date.soon(30);

                                        let addFriends: Friend[] = mockFriends(5)
                                            .map(friend => ({
                                                ...friend,
                                                age: faker.datatype.number({ min: 90, max: 100 }),
                                                date: faker.date.between(startDate, endDate)
                                            }));

                                        const [addFriendLower] = mockFriends(1);
                                        addFriendLower.date = startDate;

                                        const [addFriendUpper] = mockFriends(1);
                                        addFriendUpper.date = endDate;

                                        addFriends[3].age = documentValue; // Should NOT be filtered out

                                        addFriends = [...addFriends, addFriendLower, addFriendUpper];
                                        await db.friends.bulkAdd(addFriends);

                                        const getFriends = await db.friends.where('date').aboveOrEqual(startDate).toArray();
                                        expect(getFriends.some(friend => friend.age === documentValue)).withContext('With value').toBeTrue();
                                        expect(getFriends.length).withContext('Wrong length').toBe(addFriends.length);
                                    });
                                    it('should work with any high or low value', async () => {

                                        await expectAsync(db.friends.where('age').aboveOrEqual(String.fromCharCode(0)).toArray()).toBeResolved();
                                        await expectAsync(db.friends.where('age').aboveOrEqual(String.fromCharCode(1)).toArray()).toBeResolved();
                                        await expectAsync(db.friends.where('age').aboveOrEqual(String.fromCharCode(65535)).toArray()).toBeResolved();
                                        await expectAsync(db.friends.where('age').aboveOrEqual(1).toArray()).toBeResolved();
                                        await expectAsync(db.friends.where('age').aboveOrEqual(Number.MAX_SAFE_INTEGER).toArray()).toBeResolved();
                                    });
                                }));
                                describe('anyOf()', (() => {
                                    it(`should be able to query for ${type} (array param)`, async () => {

                                        const [addFriend] = mockFriends(1);
                                        addFriend.age = 900;
                                        await db.friends.add(addFriend);

                                        const getFriends = await db.friends.where('age').anyOf([documentValue, 900]).toArray();
                                        expect(getFriends.some(friend => friend.age === documentValue)).withContext('With value').toBeTrue();
                                        expect(getFriends.length).withContext('Wrong length').toBe(2);
                                    });
                                    it(`should be able to query for ${type} (multiple params)`, async () => {

                                        const [addFriend] = mockFriends(1);
                                        addFriend.age = 900;
                                        await db.friends.add(addFriend);

                                        const getFriends = await db.friends.where('age').anyOf(documentValue, 900).toArray();
                                        expect(getFriends.some(friend => friend.age === documentValue)).withContext('With value').toBeTrue();
                                        expect(getFriends.length).withContext('Wrong length').toBe(2);
                                    });
                                    it(`should omit ${documentValue}`, async () => {

                                        const addFriends = mockFriends(3);
                                        addFriends[0].age = 900;
                                        addFriends[1].age = 800;

                                        await db.friends.bulkAdd(addFriends);

                                        const getFriends = await db.friends.where('age').anyOf(800, 900).toArray();
                                        expect(getFriends.every(friend => friend.age !== documentValue)).withContext('Omit value').toBeTrue();
                                        expect(getFriends.length).withContext('Wrong length').toBe(2);
                                    });
                                }));
                                describe('anyOfIgnoreCase()', (() => {
                                    it(`should be able to query`, async () => {

                                        await db.friends.clear();
                                        const friends = mockFriends(5).map((friend, i) => ({ ...friend, firstName: 'z' + i }));
                                        friends[2].firstName = 'AfdgDfgdfgdfg';
                                        friends[4].firstName = 'BsdfgRgr';

                                        friends[2].age = documentValue;
                                        await db.friends.bulkAdd(friends);

                                        const getFriends = await db.friends.where('firstName').anyOfIgnoreCase('afdgdfgdfgdfg', 'bsdfgrgr').toArray();
                                        expect(getFriends.some(friend => friend.age === documentValue)).withContext('No value').toBeTrue();
                                        expect(getFriends.length).withContext('Wrong length').toBe(2);

                                        const getFriends2 = await db.friends.where('firstName').anyOfIgnoreCase(['afdgdfgdfgdfg', 'bsdfgrgr']).toArray();
                                        expect(getFriends2.some(friend => friend.age === documentValue)).withContext('No value').toBeTrue();
                                        expect(getFriends2.length).withContext('Wrong length').toBe(2);
                                    });
                                }));
                                describe('below()', (() => {
                                    it(`should not query ${type} values`, async () => {

                                        let addFriends: Friend[] = mockFriends(5)
                                            .map(friend => ({ ...friend, age: faker.datatype.number({ min: 1, max: 49 }) }));

                                        const [addFriendLower] = mockFriends(1);
                                        addFriendLower.age = 1;

                                        const [addFriendUpper] = mockFriends(1);
                                        addFriendUpper.age = 49;

                                        addFriends[3].age = documentValue; // Should be filtered out

                                        addFriends = [...addFriends, addFriendLower, addFriendUpper];
                                        await db.friends.bulkAdd(addFriends);

                                        const getFriends = await db.friends.where('age').below(50).toArray();
                                        expect(getFriends.every(friend => friend.age !== documentValue)).withContext('No value').toBeTrue();
                                        expect(getFriends.length).withContext('Wrong length').toBe(addFriends.length - 1);
                                    });
                                    it(`should query ${type} on other properties`, async () => {

                                        await db.friends.clear();
                                        const startDate = new Date();
                                        const endDate = faker.date.recent(30);
                                        const belowDate = new Date(startDate.getTime() + 1);

                                        let addFriends: Friend[] = mockFriends(5)
                                            .map(friend => ({
                                                ...friend,
                                                age: faker.datatype.number({ min: 1, max: 49 }),
                                                date: faker.date.between(startDate, endDate)
                                            }));

                                        const [addFriendLower] = mockFriends(1);
                                        addFriendLower.date = startDate;

                                        const [addFriendUpper] = mockFriends(1);
                                        addFriendUpper.date = endDate;

                                        addFriends[3].age = documentValue; // Should NOT be filtered out

                                        addFriends = [...addFriends, addFriendLower, addFriendUpper];
                                        await db.friends.bulkAdd(addFriends);

                                        const getFriends = await db.friends.where('date').below(belowDate).toArray();
                                        expect(getFriends.some(friend => friend.age === documentValue)).withContext('With value').toBeTrue();
                                        expect(getFriends.length).withContext('Wrong length').toBe(addFriends.length);
                                    });
                                    it('should work with any high or low value', async () => {

                                        await expectAsync(db.friends.where('age').below(String.fromCharCode(0)).toArray()).toBeResolved();
                                        await expectAsync(db.friends.where('age').below(String.fromCharCode(1)).toArray()).toBeResolved();
                                        await expectAsync(db.friends.where('age').below(String.fromCharCode(65535)).toArray()).toBeResolved();
                                        await expectAsync(db.friends.where('age').below(1).toArray()).toBeResolved();
                                        await expectAsync(db.friends.where('age').below(Number.MAX_SAFE_INTEGER).toArray()).toBeResolved();
                                    });
                                }));
                                describe('belowOrEqual()', (() => {
                                    it(`should not query ${type} values`, async () => {

                                        await db.friends.clear();

                                        let addFriends: Friend[] = mockFriends(5)
                                            .map((friend, i) => ({ ...friend, firstName: String.fromCharCode(i + 1) }));

                                        const [addFriendLower] = mockFriends(1);
                                        addFriendLower.firstName = String.fromCharCode(1);

                                        const [addFriendUpper] = mockFriends(1);
                                        addFriendUpper.firstName = String.fromCharCode(49);

                                        addFriends[3].firstName = documentValue; // Should be filtered out

                                        addFriends = [...addFriends, addFriendLower, addFriendUpper];
                                        await db.friends.bulkAdd(addFriends);

                                        const getFriends = await db.friends.where('firstName').belowOrEqual(String.fromCharCode(49)).toArray();
                                        expect(getFriends.every(friend => friend.firstName !== documentValue)).withContext('No value').toBeTrue();
                                        expect(getFriends.length).withContext('Wrong length').toBe(addFriends.length - 1);
                                    });
                                    it(`should query ${type} on other properties`, async () => {

                                        await db.friends.clear();
                                        const startDate = new Date();
                                        const endDate = faker.date.recent(30);

                                        let addFriends: Friend[] = mockFriends(5)
                                            .map(friend => ({
                                                ...friend,
                                                age: faker.datatype.number({ min: 1, max: 49 }),
                                                date: faker.date.between(startDate, endDate)
                                            }));

                                        const [addFriendLower] = mockFriends(1);
                                        addFriendLower.date = startDate;

                                        const [addFriendUpper] = mockFriends(1);
                                        addFriendUpper.date = endDate;

                                        addFriends[3].age = documentValue; // Should NOT be filtered out

                                        addFriends = [...addFriends, addFriendLower, addFriendUpper];
                                        await db.friends.bulkAdd(addFriends);

                                        const getFriends = await db.friends.where('date').belowOrEqual(startDate).toArray();
                                        expect(getFriends.some(friend => friend.age === documentValue)).withContext('With value').toBeTrue();
                                        expect(getFriends.length).withContext('Wrong length').toBe(addFriends.length);
                                    });
                                    it('should work with any high or low value', async () => {

                                        await expectAsync(db.friends.where('age').belowOrEqual(String.fromCharCode(0)).toArray()).toBeResolved();
                                        await expectAsync(db.friends.where('age').belowOrEqual(String.fromCharCode(1)).toArray()).toBeResolved();
                                        await expectAsync(db.friends.where('age').belowOrEqual(String.fromCharCode(65535)).toArray()).toBeResolved();
                                        await expectAsync(db.friends.where('age').belowOrEqual(1).toArray()).toBeResolved();
                                        await expectAsync(db.friends.where('age').belowOrEqual(Number.MAX_SAFE_INTEGER).toArray()).toBeResolved();
                                    });
                                }));
                                describe('between()', (() => {
                                    it(`should not query ${type} values`, async () => {

                                        let addFriends: Friend[] = mockFriends(5)
                                            .map(friend => ({ ...friend, age: faker.datatype.number({ min: 2, max: 48 }) }));

                                        const [addFriendLower] = mockFriends(1);
                                        addFriendLower.age = 1;

                                        const [addFriendUpper] = mockFriends(1);
                                        addFriendUpper.age = 49;

                                        addFriends[3].age = documentValue; // Should be filtered out

                                        addFriends = [...addFriends, addFriendLower, addFriendUpper];
                                        await db.friends.bulkAdd(addFriends);

                                        // Default bounds are (true, false) for reasons...
                                        const getFriends = await db.friends.where('age').between(1, 49).toArray();
                                        expect(getFriends.every(friend => friend.age !== documentValue)).withContext('No value').toBeTrue();
                                        expect(getFriends.length).withContext('Wrong length').toBe(addFriends.length - 2);

                                        const getFriends2 = await db.friends.where('age').between(1, 49, false, false).toArray();
                                        expect(getFriends2.every(friend => friend.age !== documentValue)).withContext('No value 2').toBeTrue();
                                        expect(getFriends2.length).withContext('Wrong length 2').toBe(addFriends.length - 3);

                                        const getFriends3 = await db.friends.where('age').between(1, 49, true, false).toArray();
                                        expect(getFriends3.every(friend => friend.age !== documentValue)).withContext('No value 3').toBeTrue();
                                        expect(getFriends3.length).withContext('Wrong length 3').toBe(addFriends.length - 2);

                                        const getFriends4 = await db.friends.where('age').between(1, 49, false, true).toArray();
                                        expect(getFriends4.every(friend => friend.age !== documentValue)).withContext('No value 4').toBeTrue();
                                        expect(getFriends4.length).withContext('Wrong length 4').toBe(addFriends.length - 2);

                                        const getFriends5 = await db.friends.where('age').between(1, 49, true, true).toArray();
                                        expect(getFriends5.every(friend => friend.age !== documentValue)).withContext('No value 5').toBeTrue();
                                        expect(getFriends5.length).withContext('Wrong length 5').toBe(addFriends.length - 1);
                                    });
                                    it(`should query ${type} on other properties`, async () => {

                                        await db.friends.clear();
                                        const startDate = new Date();
                                        const endDate = faker.date.soon(30);
                                        const lowerDate = new Date(startDate.getTime() - 1);
                                        const higherDate = new Date(endDate.getTime() + 1);

                                        let addFriends: Friend[] = mockFriends(5)
                                            .map(friend => ({ ...friend, date: faker.date.between(startDate, endDate) }));

                                        const [addFriendLower] = mockFriends(1);
                                        addFriendLower.date = lowerDate;

                                        const [addFriendUpper] = mockFriends(1);
                                        addFriendUpper.date = higherDate;

                                        addFriends[3].age = documentValue; // Should NOT be filtered out
                                        addFriends[2].date = documentValue; // Should be filtered out

                                        addFriends = [...addFriends, addFriendLower, addFriendUpper];
                                        await db.friends.bulkAdd(addFriends);

                                        // Default bounds are (true, false) for reasons...
                                        const getFriends = await db.friends.where('date').between(lowerDate, higherDate).toArray();
                                        expect(getFriends.every(friend => friend.date !== documentValue)).withContext('No value').toBeTrue();
                                        expect(getFriends.some(friend => friend.age === documentValue)).withContext('Has value').toBeTrue();
                                        expect(getFriends.length).withContext('Wrong length').toBe(addFriends.length - 2);

                                        const getFriends2 = await db.friends.where('date').between(lowerDate, higherDate, false, false).toArray();
                                        expect(getFriends2.every(friend => friend.date !== documentValue)).withContext('No value 2').toBeTrue();
                                        expect(getFriends.some(friend => friend.age === documentValue)).withContext('Has value 2').toBeTrue();
                                        expect(getFriends2.length).withContext('Wrong length 2').toBe(addFriends.length - 3);

                                        const getFriends3 = await db.friends.where('date').between(lowerDate, higherDate, true, false).toArray();
                                        expect(getFriends3.every(friend => friend.date !== documentValue)).withContext('No value 3').toBeTrue();
                                        expect(getFriends.some(friend => friend.age === documentValue)).withContext('Has value 3').toBeTrue();
                                        expect(getFriends3.length).withContext('Wrong length 3').toBe(addFriends.length - 2);

                                        const getFriends4 = await db.friends.where('date').between(lowerDate, higherDate, false, true).toArray();
                                        expect(getFriends4.every(friend => friend.date !== documentValue)).withContext('No value 4').toBeTrue();
                                        expect(getFriends.some(friend => friend.age === documentValue)).withContext('Has value 4').toBeTrue();
                                        expect(getFriends4.length).withContext('Wrong length 4').toBe(addFriends.length - 2);

                                        const getFriends5 = await db.friends.where('date').between(lowerDate, higherDate, true, true).toArray();
                                        expect(getFriends5.every(friend => friend.date !== documentValue)).withContext('No value 5').toBeTrue();
                                        expect(getFriends.some(friend => friend.age === documentValue)).withContext('Has value 5').toBeTrue();
                                        expect(getFriends5.length).withContext('Wrong length 5').toBe(addFriends.length - 1);
                                    });
                                    it('should work with any high or low value', async () => {

                                        await expectAsync(db.friends.where('age').between(String.fromCharCode(0), String.fromCharCode(65535)).toArray()).toBeResolved();
                                        await expectAsync(db.friends.where('age').between(String.fromCharCode(1), String.fromCharCode(65535)).toArray()).toBeResolved();
                                        await expectAsync(db.friends.where('age').between(String.fromCharCode(65535), String.fromCharCode(65535)).toArray()).toBeResolved();
                                        await expectAsync(db.friends.where('age').between(1, Number.MAX_SAFE_INTEGER).toArray()).toBeResolved();
                                        await expectAsync(db.friends.where('age').between(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER).toArray()).toBeResolved();
                                    });
                                }));
                                describe('equals()', (() => {
                                    it(`should be able to query for ${type}`, async () => {

                                        const getFriend = await db.friends.where('age').equals(documentValue).first();
                                        expect(getFriend!.age === documentValue).withContext('With value').toBeTrue();
                                    });
                                    it(`should query ${type} on other properties`, async () => {

                                        await db.friends.clear();
                                        const date = new Date();

                                        const addFriends: Friend[] = mockFriends(5)
                                            .map(friend => ({ ...friend, date }));

                                        addFriends[3].age = documentValue; // Should NOT be filtered out

                                        await db.friends.bulkAdd(addFriends);

                                        const getFriends = await db.friends.where('date').equals(date).toArray();
                                        expect(getFriends.some(friend => friend.age === documentValue)).withContext('With value').toBeTrue();
                                        expect(getFriends.length).withContext('Wrong length').toBe(addFriends.length);
                                    });
                                    it('should work with any high or low value', async () => {

                                        await expectAsync(db.friends.where('age').equals(String.fromCharCode(0)).toArray()).toBeResolved();
                                        await expectAsync(db.friends.where('age').equals(String.fromCharCode(1)).toArray()).toBeResolved();
                                        await expectAsync(db.friends.where('age').equals(String.fromCharCode(65535)).toArray()).toBeResolved();
                                        await expectAsync(db.friends.where('age').equals(1).toArray()).toBeResolved();
                                        await expectAsync(db.friends.where('age').equals(Number.MAX_SAFE_INTEGER).toArray()).toBeResolved();
                                    });
                                }));
                                describe('equalsIgnoreCase()', (() => {
                                    it(`should be able to query`, async () => {

                                        await db.friends.clear();
                                        const friends = mockFriends(5).map((friend, i) => ({ ...friend, firstName: 'b' + i }));
                                        friends[2].firstName = 'AfdgDfgdfgdfg';
                                        friends[2].age = documentValue;
                                        await db.friends.bulkAdd(friends);

                                        const getFriends = await db.friends.where('firstName').equalsIgnoreCase('afdgdfgdfgdfg').toArray();
                                        expect(getFriends.some(friend => friend.age === documentValue)).withContext('With value').toBeTrue();
                                        expect(getFriends.length).withContext('Wrong length').toBe(1);
                                    });
                                }));
                                describe('inAnyRange()', (() => {
                                    it(`should not query ${type} values`, async () => {

                                        const lowerRange = [1, 25] as const;
                                        const addFriends1: Friend[] = mockFriends(5)
                                            .map(friend => ({
                                                ...friend,
                                                age: faker.datatype.number({ min: lowerRange[0] + 1, max: lowerRange[1] - 1 })
                                            }));

                                        const upperRange = [30, 49] as const;
                                        const addFriends2: Friend[] = mockFriends(5)
                                            .map(friend => ({
                                                ...friend,
                                                age: faker.datatype.number({ min: upperRange[0] + 1, max: upperRange[1] - 1 })
                                            }));

                                        const [addFriendLower] = mockFriends(1);
                                        addFriendLower.age = 1;

                                        const [addFriendUpper] = mockFriends(1);
                                        addFriendUpper.age = 49;

                                        addFriends1[3].age = documentValue; // Should be filtered out

                                        const addFriends = [...addFriends1, ...addFriends2, addFriendLower, addFriendUpper];
                                        await db.friends.bulkAdd(addFriends);

                                        // Default bounds are (true, false) for reasons...
                                        const getFriends = await db.friends.where('age').inAnyRange([lowerRange, upperRange]).toArray();
                                        expect(getFriends.every(friend => friend.age !== documentValue)).withContext('No value').toBeTrue();
                                        expect(getFriends.length).withContext('Wrong length').toBe(addFriends.length - 2);

                                        const getFriends2 = await db.friends.where('age')
                                            .inAnyRange([lowerRange, upperRange], { includeLowers: false, includeUppers: false })
                                            .toArray();
                                        expect(getFriends2.every(friend => friend.age !== documentValue)).withContext('No value 2').toBeTrue();
                                        expect(getFriends2.length).withContext('Wrong length 2').toBe(addFriends.length - 3);

                                        const getFriends3 = await db.friends.where('age')
                                            .inAnyRange([lowerRange, upperRange], { includeLowers: true, includeUppers: false })
                                            .toArray();
                                        expect(getFriends3.every(friend => friend.age !== documentValue)).withContext('No value 3').toBeTrue();
                                        expect(getFriends3.length).withContext('Wrong length 3').toBe(addFriends.length - 2);

                                        const getFriends4 = await db.friends.where('age')
                                            .inAnyRange([lowerRange, upperRange], { includeLowers: false, includeUppers: true })
                                            .toArray();
                                        expect(getFriends4.every(friend => friend.age !== documentValue)).withContext('No value 4').toBeTrue();
                                        expect(getFriends4.length).withContext('Wrong length 4').toBe(addFriends.length - 2);

                                        const getFriends5 = await db.friends.where('age')
                                            .inAnyRange([lowerRange, upperRange], { includeLowers: true, includeUppers: true })
                                            .toArray();
                                        expect(getFriends5.every(friend => friend.age !== documentValue)).withContext('No value 5').toBeTrue();
                                        expect(getFriends5.length).withContext('Wrong length 5').toBe(addFriends.length - 1);
                                    });
                                    it(`should query ${type} on other properties`, async () => {

                                        const day1 = 1000 * 60 * 60 * 24;

                                        const startDate = new Date();
                                        const endDate = new Date(startDate.getTime() + (day1 * 30));

                                        const lowerRange = [
                                            startDate,
                                            new Date(startDate.getTime() + (day1 * 15))
                                        ] as const;
                                        const addFriends1: Friend[] = mockFriends(5)
                                            .map(friend => ({
                                                ...friend,
                                                date: faker.date.between(
                                                    new Date(lowerRange[0].getTime() + 1),
                                                    new Date(lowerRange[1].getTime() - 1)
                                                )
                                            }));

                                        const upperRange = [
                                            new Date(startDate.getTime() + (day1 * 16)),
                                            endDate
                                        ] as const;
                                        const addFriends2: Friend[] = mockFriends(5)
                                            .map(friend => ({
                                                ...friend,
                                                date: faker.date.between(
                                                    new Date(upperRange[0].getTime() + 1),
                                                    new Date(upperRange[1].getTime() - 1)
                                                )
                                            }));

                                        const [addFriendLower] = mockFriends(1);
                                        addFriendLower.date = startDate;

                                        const [addFriendUpper] = mockFriends(1);
                                        addFriendUpper.date = endDate;

                                        addFriends1[3].age = documentValue; // Should NOT be filtered out
                                        addFriends1[2].date = documentValue; // Should be filtered out

                                        const addFriends = [...addFriends1, ...addFriends2, addFriendLower, addFriendUpper];
                                        await db.friends.bulkAdd(addFriends);

                                        // Default bounds are (true, false) for reasons...
                                        const getFriends = await db.friends.where('date')
                                            .inAnyRange([lowerRange, upperRange])
                                            .toArray();
                                        expect(getFriends.every(friend => friend.date !== documentValue)).withContext('No value').toBeTrue();
                                        expect(getFriends.some(friend => friend.age === documentValue)).withContext('Has value').toBeTrue();
                                        expect(getFriends.length).withContext('Wrong length').toBe(addFriends.length - 2);

                                        const getFriends2 = await db.friends.where('date')
                                            .inAnyRange([lowerRange, upperRange], { includeLowers: false, includeUppers: false })
                                            .toArray();
                                        expect(getFriends.every(friend => friend.date !== documentValue)).withContext('No value').toBeTrue();
                                        expect(getFriends.some(friend => friend.age === documentValue)).withContext('Has value').toBeTrue();
                                        expect(getFriends2.length).withContext('Wrong length 2').toBe(addFriends.length - 3);

                                        const getFriends3 = await db.friends.where('date')
                                            .inAnyRange([lowerRange, upperRange], { includeLowers: true, includeUppers: false })
                                            .toArray();
                                        expect(getFriends.every(friend => friend.date !== documentValue)).withContext('No value').toBeTrue();
                                        expect(getFriends.some(friend => friend.age === documentValue)).withContext('Has value').toBeTrue();
                                        expect(getFriends3.length).withContext('Wrong length 3').toBe(addFriends.length - 2);

                                        const getFriends4 = await db.friends.where('date')
                                            .inAnyRange([lowerRange, upperRange], { includeLowers: false, includeUppers: true })
                                            .toArray();
                                        expect(getFriends.every(friend => friend.date !== documentValue)).withContext('No value').toBeTrue();
                                        expect(getFriends.some(friend => friend.age === documentValue)).withContext('Has value').toBeTrue();
                                        expect(getFriends4.length).withContext('Wrong length 4').toBe(addFriends.length - 2);

                                        const getFriends5 = await db.friends.where('date')
                                            .inAnyRange([lowerRange, upperRange], { includeLowers: true, includeUppers: true })
                                            .toArray();
                                        expect(getFriends.every(friend => friend.date !== documentValue)).withContext('No value').toBeTrue();
                                        expect(getFriends.some(friend => friend.age === documentValue)).withContext('Has value').toBeTrue();
                                        expect(getFriends5.length).withContext('Wrong length 5').toBe(addFriends.length - 1);
                                    });
                                    it('should work with any high or low value', async () => {

                                        await expectAsync(db.friends.where('age')
                                            .inAnyRange([[String.fromCharCode(0), String.fromCharCode(65535)]])
                                            .toArray())
                                            .toBeResolved();
                                        await expectAsync(db.friends.where('age')
                                            .inAnyRange([[String.fromCharCode(1), String.fromCharCode(65535)]])
                                            .toArray())
                                            .toBeResolved();
                                        await expectAsync(db.friends.where('age')
                                            .inAnyRange([[String.fromCharCode(65534), String.fromCharCode(65535)]])
                                            .toArray())
                                            .toBeResolved();
                                        await expectAsync(db.friends.where('age')
                                            .inAnyRange([[1, Number.MAX_SAFE_INTEGER]])
                                            .toArray())
                                            .toBeResolved();
                                        await expectAsync(db.friends.where('age')
                                            .inAnyRange([[Number.MAX_SAFE_INTEGER - 1, Number.MAX_SAFE_INTEGER]])
                                            .toArray())
                                            .toBeResolved();
                                    });
                                }));
                                describe('noneOf()', (() => {
                                    it(`should be able to query for none of ${type}`, async () => {

                                        const getFriends = await db.friends.where('age').noneOf([documentValue]).toArray();
                                        expect(getFriends.every(friend => friend.age !== documentValue)).withContext('No value').toBeTrue();

                                        const getFriends2 = await db.friends.where('age').noneOf([900, 800]).toArray();
                                        expect(getFriends2.some(friend => friend.age === documentValue)).withContext('No value').toBeTrue();
                                    });
                                    it(`should query for ${type} on other properties`, async () => {

                                        await db.friends.clear();

                                        const addFriends: Friend[] = mockFriends(5)
                                            .map(friend => ({ ...friend }));

                                        const date = addFriends[2].date;
                                        addFriends[3].age = documentValue; // Should NOT be filtered out

                                        await db.friends.bulkAdd(addFriends);

                                        const getFriends = await db.friends.where('date').noneOf([date]).toArray();
                                        expect(getFriends.some(friend => friend.age === documentValue)).withContext('With value').toBeTrue();
                                        expect(getFriends.length).withContext('Wrong length').toBe(addFriends.length - 1);
                                    });
                                    it('should work with any high or low value', async () => {

                                        await expectAsync(db.friends.where('age').noneOf([String.fromCharCode(0)]).toArray()).toBeResolved();
                                        await expectAsync(db.friends.where('age').noneOf([String.fromCharCode(1)]).toArray()).toBeResolved();
                                        await expectAsync(db.friends.where('age').noneOf([String.fromCharCode(65535)]).toArray()).toBeResolved();
                                        await expectAsync(db.friends.where('age').noneOf([1]).toArray()).toBeResolved();
                                        await expectAsync(db.friends.where('age').noneOf([Number.MAX_SAFE_INTEGER]).toArray()).toBeResolved();
                                    });
                                }));
                                describe('notEqual()()', (() => {
                                    it(`should be able to query for none of ${type}`, async () => {

                                        const getFriends = await db.friends.where('age').notEqual(documentValue).toArray();
                                        expect(getFriends.every(friend => friend.age !== documentValue)).withContext('No value').toBeTrue();
                                    });
                                    it(`should query for ${type} on other properties`, async () => {

                                        await db.friends.clear();

                                        const addFriends: Friend[] = mockFriends(5)
                                            .map(friend => ({ ...friend }));

                                        const date = addFriends[2].date;
                                        addFriends[3].age = documentValue; // Should NOT be filtered out

                                        await db.friends.bulkAdd(addFriends);

                                        const getFriends = await db.friends.where('date').notEqual(date).toArray();
                                        expect(getFriends.some(friend => friend.age === documentValue)).withContext('With value').toBeTrue();
                                        expect(getFriends.length).withContext('Wrong length').toBe(addFriends.length - 1);
                                    });
                                    it('should work with any high or low value', async () => {

                                        await expectAsync(db.friends.where('age').notEqual(String.fromCharCode(0)).toArray()).toBeResolved();
                                        await expectAsync(db.friends.where('age').notEqual(String.fromCharCode(1)).toArray()).toBeResolved();
                                        await expectAsync(db.friends.where('age').notEqual(String.fromCharCode(65535)).toArray()).toBeResolved();
                                        await expectAsync(db.friends.where('age').notEqual(1).toArray()).toBeResolved();
                                        await expectAsync(db.friends.where('age').notEqual(Number.MAX_SAFE_INTEGER).toArray()).toBeResolved();
                                    });
                                }));
                                describe('startsWith()', (() => {
                                    it(`should be able to query`, async () => {

                                        await db.friends.clear();
                                        const friends = mockFriends(5).map((friend, i) => ({ ...friend, firstName: 'b' + i }));
                                        friends[2].firstName = 'Afdgdfgdfgdfg';
                                        friends[2].age = documentValue;
                                        await db.friends.bulkAdd(friends);

                                        const getFriends = await db.friends.where('firstName').startsWith('A').toArray();
                                        expect(getFriends.some(friend => friend.age === documentValue)).withContext('With value').toBeTrue();
                                        expect(getFriends.length).withContext('Wrong length').toBe(1);
                                    });
                                }));
                                describe('startsWithAnyOf()', (() => {
                                    it(`should be able to query`, async () => {

                                        await db.friends.clear();
                                        const friends = mockFriends(5).map((friend, i) => ({ ...friend, firstName: 'z' + i }));
                                        friends[2].firstName = 'Afdgdfgdfgdfg';
                                        friends[4].firstName = 'Bsdfgrgr';

                                        friends[2].age = documentValue;
                                        await db.friends.bulkAdd(friends);

                                        const getFriends = await db.friends.where('firstName').startsWithAnyOf('A', 'B').toArray();
                                        expect(getFriends.some(friend => friend.age === documentValue)).withContext('No value').toBeTrue();
                                        expect(getFriends.length).withContext('Wrong length').toBe(2);

                                        const getFriends2 = await db.friends.where('firstName').startsWithAnyOf(['A', 'B']).toArray();
                                        expect(getFriends2.some(friend => friend.age === documentValue)).withContext('No value').toBeTrue();
                                        expect(getFriends2.length).withContext('Wrong length').toBe(2);
                                    });
                                }));
                                describe('startsWithAnyOfIgnoreCase()', (() => {
                                    it(`should be able to query`, async () => {

                                        await db.friends.clear();
                                        const friends = mockFriends(5).map((friend, i) => ({ ...friend, firstName: 'z' + i }));
                                        friends[2].firstName = 'Afdgdfgdfgdfg';
                                        friends[4].firstName = 'Bsdfgrgr';

                                        friends[2].age = documentValue;
                                        await db.friends.bulkAdd(friends);

                                        const getFriends = await db.friends.where('firstName').startsWithAnyOfIgnoreCase('a', 'b').toArray();
                                        expect(getFriends.some(friend => friend.age === documentValue)).withContext('No value').toBeTrue();
                                        expect(getFriends.length).withContext('Wrong length').toBe(2);

                                        const getFriends2 = await db.friends.where('firstName').startsWithAnyOfIgnoreCase(['a', 'b']).toArray();
                                        expect(getFriends2.some(friend => friend.age === documentValue)).withContext('No value').toBeTrue();
                                        expect(getFriends2.length).withContext('Wrong length').toBe(2);
                                    });
                                }));
                                describe('startsWithIgnoreCase()', (() => {
                                    it(`should be able to query`, async () => {

                                        await db.friends.clear();
                                        const friends = mockFriends(5).map((friend, i) => ({ ...friend, firstName: 'b' + i }));
                                        friends[2].firstName = 'Afdgdfgdfgdfg';
                                        friends[2].age = documentValue;
                                        await db.friends.bulkAdd(friends);

                                        const getFriends = await db.friends.where('firstName').startsWithIgnoreCase('a').toArray();
                                        expect(getFriends.some(friend => friend.age === documentValue)).withContext('With value').toBeTrue();
                                        expect(getFriends.length).withContext('Wrong length').toBe(1);
                                    });
                                }));
                            }));

                            describe('Compound index', (() => {
                                it(`should be able to query for ${type} with "[] notation"`, async () => {

                                    const friends = mockFriends(5);
                                    friends[2].age = documentValue;
                                    friends[2].shoeSize = 900;
                                    await db.friends.bulkAdd(friends);

                                    const [addFriend] = mockFriends(1);
                                    addFriend.age = 900;
                                    await db.friends.add(addFriend);

                                    const getFriends = await db.friends.where('[age+shoeSize]').equals([documentValue, 900]).toArray();

                                    expect(getFriends.some(friend => friend.age === documentValue)).withContext('With value age').toBeTrue();
                                    expect(getFriends.some(friend => friend.shoeSize === 900)).withContext('With shoeSize').toBeTrue();
                                    expect(getFriends.length).withContext('Wrong length').toBe(1);
                                });
                                it(`should be able to query for ${type} with "{} notation"`, async () => {

                                    const friends = mockFriends(5);
                                    friends[2].age = documentValue;
                                    friends[2].shoeSize = 900;
                                    await db.friends.bulkAdd(friends);

                                    const [addFriend] = mockFriends(1);
                                    addFriend.age = 900;
                                    await db.friends.add(addFriend);

                                    const getFriends = await db.friends.where({ age: documentValue, shoeSize: 900 }).toArray();

                                    expect(getFriends.some(friend => friend.age === documentValue)).withContext('With value age').toBeTrue();
                                    expect(getFriends.some(friend => friend.shoeSize === 900)).withContext('With shoeSize').toBeTrue();
                                    expect(getFriends.length).withContext('Wrong length').toBe(1);
                                });
                                it(`should be omitted when query for ${type} with between()`, async () => {

                                    await db.friends.clear();
                                    const friends = mockFriends(5);
                                    friends[2].age = documentValue;
                                    friends[3].shoeSize = 900;
                                    await db.friends.bulkAdd(friends);

                                    const getFriends = await db.friends.where('[age+shoeSize]')
                                        .between([0, 999], [800, 1000])
                                        .toArray();

                                    expect(getFriends.every(friend => friend.age !== documentValue)).withContext('With value age').toBeTrue();
                                    expect(getFriends.some(friend => friend.shoeSize === 900)).withContext('With shoeSize').toBeTrue();
                                    expect(getFriends.length).withContext('Wrong length').toBe(4);
                                });
                                it(`should be able to query for ${type} with anyOf()`, async () => {

                                    db.friends.clear();
                                    const friends = mockFriends(5);
                                    friends[2].age = documentValue;
                                    friends[2].shoeSize = 900;
                                    friends[4].age = 700;
                                    friends[4].shoeSize = 800;
                                    await db.friends.bulkAdd(friends);

                                    const getFriends = await db.friends.where('[age+shoeSize]')
                                        .anyOf([
                                            [documentValue, 900],
                                            [700, 800]
                                        ])
                                        .toArray();

                                    expect(getFriends.some(friend => friend.age === documentValue)).withContext('With value age').toBeTrue();
                                    expect(getFriends.some(friend => friend.shoeSize === 900)).withContext('With shoeSize').toBeTrue();
                                    expect(getFriends.length).withContext('Wrong length').toBe(2);
                                });
                            }));

                            describe('Unique index', (() => {
                                it(`should not be able to add multiple ${type} to unique index`, async () => {

                                    const friends = mockFriends(5);
                                    friends[2].uniqueValue = documentValue;

                                    await expectAsync(db.friends.bulkAdd(friends)).toBeResolved();

                                    await db.friends.clear();

                                    friends[3].uniqueValue = documentValue;

                                    await expectAsync(db.friends.bulkAdd(friends)).toBeRejected();
                                });
                            }));
                        });

                        describe('Collection', (() => {

                            let ids: number[];
                            let testId: number;
                            let friends: Friend[];

                            beforeEach(async () => {
                                friends = mockFriends(10);
                                ids = await db.friends.bulkAdd(friends, { allKeys: true });
                                [testId] = ids;
                                await db.friends.update(testId, {
                                    age: documentValue,
                                    firstName: documentValue,
                                    shoeSize: 12
                                });
                            });

                            describe('and()', (() => {
                                it(`should be able to query for ${type}`, async () => {

                                    const getFriend = await db.friends.where('age')
                                        .equals(documentValue)
                                        .and(friend => friend.age === documentValue)
                                        .first();
                                    expect(getFriend!.age === documentValue).withContext('With value').toBeTrue();
                                });
                            }));
                            describe('clone()', (() => {
                                it(`should be able to query for ${type}`, async () => {

                                    const getFriend = await db.friends.where('age')
                                        .equals(documentValue)
                                        .clone()
                                        .first();
                                    expect(getFriend!.age === documentValue).withContext('With value').toBeTrue();
                                });
                            }));
                            describe('clone()', (() => {
                                it(`should be able to query for ${type}`, async () => {

                                    const getFriend = await db.friends.where('age')
                                        .equals(documentValue)
                                        .clone()
                                        .first();
                                    expect(getFriend!.age === documentValue).withContext('With value').toBeTrue();
                                });
                            }));
                            describe('count()', (() => {
                                it(`should be able to query for ${type}`, async () => {

                                    const getFriendsCount = await db.friends.where('age')
                                        .equals(documentValue)
                                        .count();
                                    expect(getFriendsCount === 1).withContext('With count').toBeTrue();
                                });
                                it(`should be able to query for ${type} (callBack)`, async () => {

                                    let cbCount: number;

                                    await db.friends.where('age')
                                        .equals(documentValue)
                                        .count(count => cbCount = count);
                                    expect(cbCount! === 1).withContext('With count').toBeTrue();
                                });
                            }));
                            describe('delete()', (() => {
                                it(`should be able to query for ${type}`, async () => {

                                    const deletedFriends = await db.friends.where('age')
                                        .equals(documentValue)
                                        .delete();
                                    expect(deletedFriends === 1).withContext('Delete count').toBeTrue();
                                });
                            }));
                            describe('distinct()', (() => {
                                it(`should be able to query for ${type}`, async () => {

                                    await db.friends.clear();

                                    const multiFriends = friends.map((friend, i) => ({
                                        ...friend,
                                        age: [documentValue, 30],
                                        id: i + 1
                                    }));

                                    await db.friends.bulkAdd(multiFriends);

                                    const getFriends = await db.friends.where('age')
                                        .equals(documentValue)
                                        .distinct()
                                        .toArray();
                                    expect(getFriends.length).withContext('Wrong length').toBe(10);

                                    const getFriends2 = await db.friends.where('age')
                                        .equals(30)
                                        .distinct()
                                        .toArray();
                                    expect(getFriends2.length).withContext('Wrong length').toBe(10);

                                    expect(getFriends).toEqual(getFriends2);
                                    expect(getFriends).toEqual(multiFriends);
                                    expect(getFriends2).toEqual(multiFriends);
                                });
                            }));
                            describe('each()', (() => {
                                it(`should be able to query for ${type}`, async () => {

                                    const getFriends: Friend[] = [];

                                    await db.friends.where('age')
                                        .equals(documentValue)
                                        .each(friend => {
                                            getFriends.push(friend);
                                        });

                                    expect(getFriends.some(friend => friend.age === documentValue)).withContext('With value').toBeTrue();
                                    expect(getFriends.length).withContext('Wrong length').toBe(1);
                                });
                            }));
                            describe('eachKey()', (() => {
                                it(`should be able to query for ${type}`, async () => {

                                    const getKeys: IndexableTypeExtended[] = [];

                                    await db.friends.where('age')
                                        .equals(documentValue)
                                        .eachKey(key => {
                                            getKeys.push(key);
                                        });

                                    expect(getKeys.some(key => key === documentValue)).withContext('With value').toBeTrue();
                                    expect(getKeys.length).withContext('Wrong length').toBe(1);
                                });
                            }));
                            describe('eachPrimaryKey()', (() => {
                                it(`should be able to query for ${type}`, async () => {

                                    const getKeys: IndexableTypeExtended[] = [];

                                    await db.friends.where('age')
                                        .equals(documentValue)
                                        .eachPrimaryKey(key => {
                                            getKeys.push(key);
                                        });

                                    expect(getKeys.some(key => key === testId)).withContext('With value').toBeTrue();
                                    expect(getKeys.length).withContext('Wrong length').toBe(1);
                                });
                            }));
                            describe('eachUniqueKey()', (() => {
                                it(`should be able to query for ${type}`, async () => {

                                    const getKeys: IndexableTypeExtended[] = [];

                                    await db.friends.where('age')
                                        .equals(documentValue)
                                        .eachUniqueKey(key => {
                                            getKeys.push(key);
                                        });

                                    expect(getKeys.some(key => key === documentValue)).withContext('With value').toBeTrue();
                                    expect(getKeys.length).withContext('Wrong length').toBe(1);
                                });
                            }));
                            describe('filter()', (() => {
                                it(`should be able to query for ${type}`, async () => {

                                    const getFriends = await db.friends.where('age')
                                        .equals(documentValue)
                                        .filter(friend => friend.age === documentValue)
                                        .toArray();

                                    expect(getFriends.some(friend => friend.age === documentValue)).withContext('With value').toBeTrue();
                                    expect(getFriends.length).withContext('Wrong length').toBe(1);
                                });
                            }));
                            describe('first()', (() => {
                                it(`should be able to query for ${type}`, async () => {

                                    const getFriend = await db.friends.where('age')
                                        .equals(documentValue)
                                        .filter(friend => friend.age === documentValue)
                                        .first();

                                    expect(getFriend!.age === documentValue).withContext('With value').toBeTrue();
                                });
                            }));
                            describe('keys()', (() => {
                                it(`should be able to query for ${type}`, async () => {

                                    const getKeys = await db.friends.where('age')
                                        .equals(documentValue)
                                        .keys();

                                    expect(getKeys.some(key => key === documentValue)).withContext('With value').toBeTrue();
                                    expect(getKeys.length).withContext('Wrong length').toBe(1);
                                });
                                it(`should be able to query for ${type} (callBack)`, async () => {

                                    let getKeys: any[] = [];

                                    await db.friends.where('age')
                                        .equals(documentValue)
                                        .keys(keys => getKeys = keys);

                                    expect(getKeys.some(key => key === documentValue)).withContext('With value').toBeTrue();
                                    expect(getKeys.length).withContext('Wrong length').toBe(1);
                                });
                            }));
                            describe('last()', (() => {
                                it(`should be able to query for ${type}`, async () => {

                                    const getFriend = await db.friends.where('age')
                                        .equals(documentValue)
                                        .filter(friend => friend.age === documentValue)
                                        .last();

                                    expect(getFriend!.age === documentValue).withContext('With value').toBeTrue();
                                });
                            }));
                            describe(`modify() (${type})`, () => {
                                it(`should be "${dbStringValue}" in db on update`, async () => {

                                    await db.friends.where('age').equals(documentValue).modify({ age: 900 });
                                    const getFriend = await db.friends.where('age').equals(900).first() as Friend;

                                    expect(getFriend !== undefined).withContext('Read value').toBeTrue();

                                    await db.friends.where('age').equals(900).modify({ age: documentValue });
                                    const getFriend2 = await db.friends.where('age').equals(documentValue).first() as Friend;

                                    expect(getFriend2 !== undefined && getFriend2.age === documentValue).withContext('Read value 2').toBeTrue();

                                    let friendRaw: any;

                                    await db.transaction('readonly', db.friends, async (transaction) => {
                                        transaction.raw = true;
                                        friendRaw = await db.friends.where('age').equals(documentValue).first();
                                    });

                                    expect(arrayBuffersAreEqual(friendRaw.age, dbBinaryValue)).withContext('Db value').toBeTrue();
                                });
                                it(`should be able to query for ${type} (callBack)`, async () => {

                                    await db.friends.where('age').equals(documentValue).modify(friend => { friend.age = 900; });
                                    const getFriend = await db.friends.where('age').equals(900).first() as Friend;

                                    expect(getFriend !== undefined).withContext('Read value').toBeTrue();

                                    await db.friends.where('age').equals(900).modify(friend => { friend.age = documentValue; });
                                    const getFriend2 = await db.friends.where('age').equals(documentValue).first() as Friend;

                                    expect(getFriend2 !== undefined && getFriend2.age === documentValue).withContext('Read value 2').toBeTrue();

                                    let friendRaw: any;

                                    await db.transaction('readonly', db.friends, async (transaction) => {
                                        transaction.raw = true;
                                        friendRaw = await db.friends.where('age').equals(documentValue).first();
                                    });

                                    expect(arrayBuffersAreEqual(friendRaw.age, dbBinaryValue)).withContext('Db value').toBeTrue();
                                });
                            });
                            describe(`or() (${type})`, () => {
                                it(`should be "${dbStringValue}" in db on update`, async () => {

                                    const [newFriend] = mockFriends(1);
                                    newFriend.shoeSize = 900;
                                    await db.friends.add(newFriend);

                                    const getFriends = await db.friends.where('shoeSize').equals(900).or('age').equals(documentValue).toArray();

                                    expect(getFriends.some(friend => friend.age === documentValue)).withContext('With value age').toBeTrue();
                                    expect(getFriends.some(friend => friend.shoeSize === 900)).withContext('With value shoeSize').toBeTrue();
                                    expect(getFriends.length).withContext('Wrong length').toBe(2);
                                });
                            });
                            describe('primaryKeys()', (() => {
                                it(`should be able to query for ${type}`, async () => {

                                    const getKeys = await db.friends.where('age')
                                        .equals(documentValue)
                                        .primaryKeys();

                                    expect(getKeys.some(key => key === testId)).withContext('With value').toBeTrue();
                                    expect(getKeys.length).withContext('Wrong length').toBe(1);
                                });
                                it(`should be able to query for ${type} (callBack)`, async () => {

                                    let getKeys: any[] = [];

                                    await db.friends.where('age')
                                        .equals(documentValue)
                                        .primaryKeys(keys => getKeys = keys);

                                    expect(getKeys.some(key => key === testId)).withContext('With value').toBeTrue();
                                    expect(getKeys.length).withContext('Wrong length').toBe(1);
                                });
                            }));
                            describe(`sortBy() (${type})`, () => {
                                it(`should included "${dbStringValue}"`, async () => {

                                    const [newFriend] = mockFriends(1);
                                    newFriend.shoeSize = 900;
                                    await db.friends.add(newFriend);

                                    const getFriends = await db.friends.where('age').equals(documentValue).sortBy('age');

                                    expect(getFriends.some(friend => friend.age === documentValue)).withContext('With value age').toBeTrue();
                                    expect(getFriends.length).withContext('Wrong length').toBe(1);
                                });
                            });
                            describe('uniqueKeys()', (() => {
                                it(`should be able to query for ${type}`, async () => {

                                    const [friend] = mockFriends(1);
                                    friend.age = documentValue;
                                    await db.friends.add(friend);

                                    const getKeysPre = await db.friends.where('age')
                                        .equals(documentValue)
                                        .keys();

                                    expect(getKeysPre.length).withContext('Pre check').toBe(2);

                                    const getKeys = await db.friends.where('age')
                                        .equals(documentValue)
                                        .uniqueKeys();

                                    expect(getKeys.some(key => key === documentValue)).withContext('With value').toBeTrue();
                                    expect(getKeys.length).withContext('Wrong length').toBe(1);
                                });
                                it(`should be able to query for ${type} (callBack)`, async () => {

                                    let getKeys: any[] = [];

                                    await db.friends.where('age')
                                        .equals(documentValue)
                                        .uniqueKeys(keys => getKeys = keys);

                                    expect(getKeys.some(key => key === documentValue)).withContext('With value').toBeTrue();
                                    expect(getKeys.length).withContext('Wrong length').toBe(1);
                                });
                            }));
                            describe('until()', (() => {
                                it(`should be able to query for ${type}`, async () => {

                                    const [friend] = mockFriends(1);
                                    friend.age = documentValue;
                                    await db.friends.add(friend);

                                    const getFriends = await db.friends.where('age')
                                        .equals(documentValue)
                                        .until(friend => friend.age === documentValue)
                                        .toArray();

                                    expect(getFriends.length).withContext('Wrong length').toBe(0);

                                    const getFriends2 = await db.friends.where('age')
                                        .equals(documentValue)
                                        .until(friend => friend.age === documentValue, true)
                                        .toArray();

                                    expect(getFriends2.some(friend => friend.age === documentValue)).withContext('With value').toBeTrue();
                                    expect(getFriends2.length).withContext('Wrong length').toBe(1);
                                });
                            }));
                        }));

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
});
