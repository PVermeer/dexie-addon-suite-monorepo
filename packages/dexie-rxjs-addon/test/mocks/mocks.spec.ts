import type { Dexie as DexieType } from 'dexie';
import faker from 'faker/locale/nl';
import { EMPTY, of } from 'rxjs';
import { mergeMap, map } from 'rxjs/operators';
import { dexieRxjs } from '../../src';

export interface Friend {
    id?: number;
    testProp?: string;
    age: number;
    hasAge?: boolean;
    firstName: string;
    lastName: string;
    shoeSize: number;
    customId: number;
    some?: { id: number; };
}

type TestDatabaseType = DexieType & { friends: DexieType.Table<Friend, number>; };

export const databasesPositive = [
    {
        desc: 'TestDatabase',
        db: (Dexie: typeof DexieType) => new class TestDatabase extends Dexie {
            public friends: DexieType.Table<Friend, number>;
            constructor(name: string) {
                super(name);
                dexieRxjs(this);
                this.on('blocked', () => false);
                this.version(1).stores({
                    friends: '++id, customId, firstName, lastName, shoeSize, age, [age+shoeSize]'
                });
            }
        }('TestDatabase')
    },
    {
        desc: 'TestDatabaseKeyPath',
        db: (Dexie: typeof DexieType) => new class TestDatabaseKeyPath extends Dexie {
            public friends: DexieType.Table<Friend, number>;
            constructor(name: string) {
                super(name);
                dexieRxjs(this);
                this.on('blocked', () => false);
                this.version(1).stores({
                    friends: '++some.id, customId, firstName, lastName, shoeSize, age, [age+shoeSize]'
                });
            }
        }('TestDatabaseKeyPath')
    },
    {
        desc: 'TestDatabaseCustomKey',
        db: (Dexie: typeof DexieType) => new class TestDatabaseCustomKey extends Dexie {
            public friends: DexieType.Table<Friend, number>;
            constructor(name: string) {
                super(name);
                dexieRxjs(this);
                this.on('blocked', () => false);
                this.version(1).stores({
                    friends: 'customId, firstName, lastName, shoeSize, age, [age+shoeSize]'
                });
            }
        }('TestDatabaseCustomKey')
    },
    {
        desc: 'TestDatabaseNoKey',
        db: (Dexie: typeof DexieType) => new class TestDatabaseNoKey extends Dexie {
            public friends: DexieType.Table<Friend, number>;
            constructor(name: string) {
                super(name);
                dexieRxjs(this);
                this.on('blocked', () => false);
                this.version(1).stores({
                    friends: '++, customId, firstName, lastName, shoeSize, age, [age+shoeSize]'
                });
            }
        }('TestDatabaseNoKey')
    }
];

export const databasesNegative = [
    {
        desc: 'TestDatabaseCompoundIndex',
        db: (Dexie: typeof DexieType) => new class TestDatabaseCompoundIndex extends Dexie {
            public friends: DexieType.Table<Friend, number>;
            constructor(name: string) {
                super(name);
                dexieRxjs(this);
                this.on('blocked', () => false);
                this.version(1).stores({
                    friends: '++id, firstName, lastName, [firstName+lastName], shoeSize, age'
                });
            }
        }('TestDatabaseCompoundIndex')
    },
    {
        desc: 'TestDatabaseMultiIndex',
        db: (Dexie: typeof DexieType) => new class TestDatabaseMultiIndex extends Dexie {
            public friends: DexieType.Table<Friend, number>;
            constructor(name: string) {
                super(name);
                dexieRxjs(this);
                this.on('blocked', () => false);
                this.version(1).stores({
                    friends: '++id, multi*, firstName, lastName, shoeSize, age'
                });
            }
        }('TestDatabaseMultiIndex')
    }
];

interface MethodOptions {
    emitUndefined?: boolean;
    emitFull?: boolean;
    singelton?: boolean;
}
export const methods = [
    {
        desc: 'get()',
        singelton: false,
        array: false,
        alwaysEmit: false,
        method: (db: TestDatabaseType) => (id: number, _customId: number, _options?: MethodOptions) => db.friends.$.get(id)
    },
    {
        desc: 'get({id})',
        singelton: false,
        array: false,
        alwaysEmit: false,
        method: (db: TestDatabaseType) => (id: number, _customId: number, _options?: MethodOptions) =>
            db.friends.schema.primKey.keyPath === 'id' ?
                db.friends.$.get({ id }) :
                db.friends.$.get({ customId: _customId })
    },
    {
        desc: 'toArray()',
        singelton: true,
        array: true,
        alwaysEmit: true,
        method: (db: TestDatabaseType) => (
            id: number,
            _customId: number,
            _options: MethodOptions = {}
        ) => _options.singelton ?
                db.friends.$.toArray() :
                db.friends.$.toArray().pipe(
                    mergeMap(x => {
                        if (_options.emitFull) { return of(x); }
                        /** The general method tests rely on returning undefined when not found. */
                        const find = x.find(y => y.id === id || y.customId === _customId || (y.some && y.some.id === id));
                        if (!find && !_options.emitUndefined) { return EMPTY; }
                        return of(find);
                    })
                )
    },
    {
        desc: 'where()',
        singelton: false,
        array: true,
        alwaysEmit: false,
        method: (db: TestDatabaseType) => (id: number, _customId: number, _options: MethodOptions = {}) =>
            db.friends.$.where(':id').equals(id).toArray().pipe(map(x => _options.emitFull ? x : x[0]))
    },
    {
        desc: 'where({id})',
        singelton: false,
        array: true,
        alwaysEmit: false,
        method: (db: TestDatabaseType) => (id: number, _customId: number, _options: MethodOptions = {}) =>
            db.friends.schema.primKey.keyPath === 'id' ?
                db.friends.$.where({ id }).toArray().pipe(map(x => _options.emitFull ? x : x[0])) :
                db.friends.$.where({ customId: _customId }).toArray().pipe(map(x => _options.emitFull ? x : x[0]))
    },
    {
        desc: 'where([age, shoeSize])',
        singelton: false,
        array: true,
        alwaysEmit: false,
        method: (db: TestDatabaseType) => (id: number, _customId: number, _options: MethodOptions = {}) =>
            db.friends.$.where(['age', 'shoeSize']).between([0, 0], [100, 100]).toArray().pipe(
                mergeMap(x => {
                    if (_options.emitFull) { return of(x); }
                    /** The general method tests rely on returning undefined when not found. */
                    const find = x.find(y => y.id === id || y.customId === _customId || (y.some && y.some.id === id));
                    if (!find && !_options.emitUndefined) { return EMPTY; }
                    return of(find);
                })
            )
    },
    {
        desc: 'where().anyOf()',
        singelton: false,
        array: true,
        alwaysEmit: false,
        method: (db: TestDatabaseType) => (id: number, _customId: number, _options: MethodOptions = {}) =>
            db.friends.$.where(':id').anyOf([id]).toArray().pipe(map(x => _options.emitFull ? x : x[0]))
    }
];

let customId = 1000000;
export const mockFriends = (count = 5): Friend[] => {
    const friend = () => ({
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        age: faker.datatype.number({ min: 1, max: 80 }),
        shoeSize: faker.datatype.number({ min: 5, max: 12 }),
        customId
    });
    return new Array(count).fill(null).map(() => {
        const mockfriend = friend();
        mockfriend.customId = customId;
        customId++;
        return mockfriend;
    });
};
