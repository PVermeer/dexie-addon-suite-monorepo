import { Dexie } from 'dexie';
import { populate } from '../../../src/populate';
import { SchemaParser } from '../../../src/schema-parser.class';
import { DexieExtended } from '../../../src/types';

class TestDatabase extends Dexie {
    constructor(name: string) {
        super(name);
        populate(this);
        this.on('blocked', () => false);
        this.version(1).stores({
            friends: '++id, customId, firstName, lastName, shoeSize, age, hasFriends => friends.id, memberOf => clubs.id, group => groups.id, hairColor => hairColors.id',
            clubs: '++id, name, theme => themes.id',
            themes: '++id, name, style => styles.id',
            styles: '++id, name, color',
            groups: '++id, name',
            hairColors: '++id, name'
        });
    }
}
class TestDatabaseEmptyTable extends Dexie {
    constructor(name: string) {
        super(name);
        populate(this);
        this.on('blocked', () => false);
        this.version(1).stores({
            friends: '',
            clubs: '++id, name, theme => themes.id',
            themes: '++id, name, style => styles.id',
            styles: '++id, name, color'
        });
    }
}

describe('Schema-parser class', () => {
    let db: TestDatabase;
    let dbExt: DexieExtended;
    let dbEmpty: TestDatabaseEmptyTable;
    let dbExtEmpty: DexieExtended;

    beforeEach(async () => {
        db = new TestDatabase('TestDatabaseSchema');
        dbEmpty = new TestDatabaseEmptyTable('TestDatabaseSchemaEmpty');
        await db.open();
        await dbEmpty.open();
        dbExt = db as unknown as DexieExtended;
        dbExtEmpty = dbEmpty as unknown as DexieExtended;
    });
    afterEach(async () => {
        await db.delete();
        await dbEmpty.delete();
    });
    describe('Relational schema', () => {
        it('should return the correct schema', async () => {
            const schemaParser = new SchemaParser(dbExt._storesSpec);
            const relationalKeys = schemaParser.getRelationalKeys();

            const expected = {
                friends: {
                    hasFriends: { targetTable: 'friends', targetKey: 'id' },
                    memberOf: { targetTable: 'clubs', targetKey: 'id' },
                    group: { targetTable: 'groups', targetKey: 'id' },
                    hairColor: { targetTable: 'hairColors', targetKey: 'id' }
                },
                clubs: {
                    theme: { targetTable: 'themes', targetKey: 'id' }
                },
                themes: {
                    style: { targetTable: 'styles', targetKey: 'id' }
                }
            };
            expect(relationalKeys).toEqual(expected);
        });
        it('should not return an empty table', async () => {
            const schemaParser = new SchemaParser(dbExtEmpty._storesSpec);
            const relationalKeys = schemaParser.getRelationalKeys();

            const expected = {
                clubs: {
                    theme: { targetTable: 'themes', targetKey: 'id' }
                },
                themes: {
                    style: { targetTable: 'styles', targetKey: 'id' }
                }
            };
            expect(relationalKeys).toEqual(expected);
        });
    });
    describe('Sanitized schema', () => {
        it('should return the correct schema', async () => {
            const schemaParser = new SchemaParser(dbExt._storesSpec);
            const cleanSchema = schemaParser.getCleanedSchema();

            const expected = {
                friends: '++id, customId, firstName, lastName, shoeSize, age, hasFriends, memberOf, group, hairColor',
                clubs: '++id, name, theme',
                themes: '++id, name, style',
                styles: '++id, name, color',
                groups: '++id, name',
                hairColors: '++id, name'
            };
            expect(cleanSchema).toEqual(expected);
        });
        it('should return the empty table', async () => {
            const schemaParser = new SchemaParser(dbExtEmpty._storesSpec);
            const cleanSchema = schemaParser.getCleanedSchema();

            const expected = {
                friends: '',
                clubs: '++id, name, theme',
                themes: '++id, name, style',
                styles: '++id, name, color'
            };
            expect(cleanSchema).toEqual(expected);
        });
        it('should return a table with a falsy value on table that is not a string', async () => {
            const dbFalse = new class TestDatabaseFalseTable extends Dexie {
                constructor(name: string) {
                    super(name);
                    populate(this);
                    this.on('blocked', () => false);
                    this.version(1).stores({
                        friends: null,
                        clubs: '++id, name, theme => themes.id',
                        themes: '++id, name, style => styles.id',
                        styles: '++id, name, color'
                    });
                }
            }('TestDatabaseFalseTable') as unknown as DexieExtended;
            await db.open();

            const schemaParser = new SchemaParser(dbFalse._storesSpec);
            const cleanSchema = schemaParser.getCleanedSchema();

            const expected = {
                friends: null,
                clubs: '++id, name, theme',
                themes: '++id, name, style',
                styles: '++id, name, color'
            };
            expect(cleanSchema).toEqual(expected);
            db.delete();
        });
    });
});
