import faker from 'faker/locale/en';
import * as hooks from '../../../src/hooks';
import { FALSE_CHAR_STRING, FALSE_STRING, NULL_CHAR_STRING, NULL_STRING, TRUE_CHAR_STRING, TRUE_STRING } from '../../../src/utils';
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
                    beforeEach(async () => {
                        friends = mockFriends();
                        ids = await db.friends.bulkAdd(friends, { allKeys: true });
                        id = ids[0];
                        const hooksSpy = spyOnAllFunctions(hooks);
                        Object.keys(hooksSpy).forEach(key => hooksSpy[key].and.callThrough());
                    });
                    describe('Creation', () => {
                        let newFriends: Friend[];
                        beforeEach(async () => {
                            newFriends = mockFriends();
                        });
                        afterEach(() => {
                            expect(hooks.mapToStringOnCreation).toHaveBeenCalled();
                            expect(hooks.mapToStringOnUpdating).not.toHaveBeenCalled();
                            expect(hooks.mapStringToValueOnReading).not.toHaveBeenCalled();
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
                            expect(hooks.mapToStringOnUpdating).toHaveBeenCalled();
                            expect(hooks.mapToStringOnCreation).not.toHaveBeenCalled();
                            expect(hooks.mapStringToValueOnReading).not.toHaveBeenCalled();
                        });
                        it('should be called on update()', async () => {
                            await db.friends.update(id, friends[1]);
                        });
                        it('should be called on put()', async () => {
                            await db.friends.put({ ...friends[1], id });
                        });
                        it('should be called on bulkPut()', async () => {
                            const friends2 = mockFriends();
                            const hashedDocuments = friends2.map((friend, i) => ({ ...friend, id: ids[i] }));
                            await db.friends.bulkPut(hashedDocuments);
                        });
                    });
                    describe('Reading', () => {
                        afterEach(() => {
                            expect(hooks.mapStringToValueOnReading).toHaveBeenCalled();
                            expect(hooks.mapToStringOnUpdating).not.toHaveBeenCalled();
                            expect(hooks.mapToStringOnCreation).not.toHaveBeenCalled();
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
                        { type: 'null', dbStringValue: NULL_STRING, dbCharValue: NULL_CHAR_STRING, documentValue: null },
                        { type: 'true', dbStringValue: TRUE_STRING, dbCharValue: TRUE_CHAR_STRING, documentValue: true },
                        { type: 'false', dbStringValue: FALSE_STRING, dbCharValue: FALSE_CHAR_STRING, documentValue: false },
                    ] as const;

                    valueTypes.forEach(({ type, dbStringValue, dbCharValue, documentValue }) => {

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

                                expect(friendRaw.age.toString() === dbCharValue).withContext('Db value').toBeTrue();
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

                                expect(friendsRaw!.every(friend => friend.age.toString() === dbCharValue)).withContext('Db value').toBeTrue();
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

                                expect(friendRaw.age.toString() === dbCharValue).withContext('Db value').toBeTrue();
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

                                expect(friendRaw.age.toString() === dbCharValue).withContext('Db value').toBeTrue();
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

                                expect(friendsRaw!.every(friend => friend.age.toString() === dbCharValue)).withContext('Db value').toBeTrue();
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

                                expect(friendsRaw!.every(friend => friend.age.toString() === dbCharValue)).withContext('Db value').toBeTrue();
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

                                expect(friendRaw.age.toString() === dbCharValue).withContext('Db value').toBeTrue();
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

                                expect(friendRaw.age.toString() === dbCharValue).withContext('Db value').toBeTrue();
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

                                expect(friendRaw.age.toString() === dbCharValue).withContext('Db value').toBeTrue();
                            });
                        }));
                        describe('where()', () => {
                            let ids: number[];
                            let friends: Friend[];

                            beforeEach(async () => {
                                friends = mockFriends(10);
                                ids = await db.friends.bulkAdd(friends, { allKeys: true });
                                const [testId] = ids;
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

                                expect(friendRaw.age.toString() === dbCharValue).withContext('Db value').toBeTrue();
                            });
                            it('should be able to query with multiple keys', async () => {
                                // @ts-expect-error // Not officially supported by Dexie
                                const getFriend = await db.friends.where(['age', 'shoeSize']).equals([documentValue, 12]).first() as Friend;

                                expect(getFriend.age === documentValue).withContext('Read value').toBeTrue();

                                let friendRaw: any;

                                await db.transaction('readonly', db.friends, async (transaction) => {
                                    transaction.raw = true;
                                    friendRaw = await db.friends.get({ age: documentValue, shoeSize: 12 }) as Friend;
                                });

                                expect(friendRaw.age.toString() === dbCharValue).withContext('Db value').toBeTrue();
                            });
                            it('should be able to get with multiple key paths', async () => {
                                const getFriend = await db.friends.where({ age: documentValue, shoeSize: 12 }).first() as Friend;

                                expect(getFriend.age === documentValue).withContext('Read value').toBeTrue();

                                let friendRaw: any;

                                await db.transaction('readonly', db.friends, async (transaction) => {
                                    transaction.raw = true;
                                    friendRaw = await db.friends.get({ age: documentValue, shoeSize: 12 }) as Friend;
                                });

                                expect(friendRaw.age.toString() === dbCharValue).withContext('Db value').toBeTrue();
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
                                // below should just work because are converted values are above
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
                                // belowOrEqual should just work because are converted values are above
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
                                describe('equals()', (() => {
                                    it(`should be able to query for ${type}`, async () => {

                                        const getFriends = await db.friends.where('age').equals(documentValue).toArray();
                                        expect(getFriends.every(friend => friend.age === documentValue)).withContext('With value').toBeTrue();
                                    });
                                }));
                            }));

                            describe('Collection', (() => {
                                // it(`modify() should be ${NULL_STRING_VALUE_DEFAULT} in db and null type with modify()`, async () => {
                                //     const [friend] = mockFriends(1);
                                //     friend.age = null;
                                //     const id = await db.friends.add(friend);

                                //     await db.friends.where('id')
                                //         .equals(id)
                                //         .modify(() => ({ age: null }));

                                //     const [getFriend] = await db.friends.where('id').equals(id).toArray();
                                //     expect(friend.age).toBeNull();
                                //     expect(getFriend.age).toBeNull();

                                //     let friendRaw: Friend;

                                //     await db.transaction('readonly', db.friends, async (transaction) => {
                                //         transaction.raw = true;
                                //         friendRaw = await db.friends.get(id) as Friend;
                                //     });

                                //     expect(friendRaw!.age as any).toEqual(nullValue);
                                // });
                            }));
                        });
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
