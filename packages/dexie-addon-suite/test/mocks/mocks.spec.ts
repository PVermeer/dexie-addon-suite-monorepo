import { Dexie } from 'dexie';
import faker from 'faker/locale/en';
import { Ref } from '@pvermeer/dexie-populate-addon';
import { OmitMethods } from '../../../common/src/utility-types';
import { addonSuite, Config } from '../../src/addon-suite';
import { EncryptedOptions, Encryption } from '@pvermeer/dexie-encrypted-addon';

export class HairColor {
    id?: number;
    name: string;

    doSomething() {
        return 'done';
    }

    constructor(input: OmitMethods<HairColor>) {
        Object.entries(input).forEach(([key, value]) => {
            this[key] = value;
        });
    }

}
export class Style {
    id?: number;
    name: string;
    color: string;
    description: string;

    doSomething() {
        return 'done';
    }

    constructor(style: OmitMethods<Style>) {
        Object.entries(style).forEach(([key, value]) => {
            this[key] = value;
        });
    }

}
export class Theme {
    id?: number;
    name: string;
    style: Ref<Style, number>;
    description: string;

    doSomething() {
        return 'done';
    }

    constructor(theme: OmitMethods<Theme>) {
        Object.entries(theme).forEach(([key, value]) => {
            this[key] = value;
        });
    }

}
export class Club {
    id?: number;
    name: string;
    size: number;
    theme: Ref<Theme, number>;
    description: string;

    doSomething() {
        return 'done';
    }

    constructor(club: OmitMethods<Club>) {
        Object.entries(club).forEach(([key, value]) => {
            this[key] = value;
        });
    }

}
export class Group {
    id?: number;
    name: string;
    true: boolean;
    description: string;

    doSomething() {
        return 'done';
    }

    constructor(group: OmitMethods<Group>) {
        Object.entries(group).forEach(([key, value]) => {
            this[key] = value;
        });
    }

}
export class Friend {
    id?: string;
    testProp?: string;
    age: number;
    hasAge?: boolean;
    firstName: string;
    lastName: string;
    shoeSize: number;
    customId: number;
    some?: { id: number; other: string; };
    hasFriends: Ref<Friend[], number[]>;
    memberOf: Ref<Club[], number[]>;
    group: Ref<Group, number>;
    hairColor: Ref<HairColor, number>;

    doSomething() {
        return 'done';
    }

    constructor(friend: OmitMethods<Friend>) {
        Object.entries(friend).forEach(([key, value]) => {
            this[key] = value;
        });
    }
}

const getDatabase = (
    dexie: typeof Dexie,
    name: string,
    config?: Config & EncryptedOptions
) => new class TestDatabase extends dexie {
    public friends: Dexie.Table<Friend, string>;
    public clubs: Dexie.Table<Club, number>;
    public themes: Dexie.Table<Theme, number>;
    public groups: Dexie.Table<Group, number>;
    public styles: Dexie.Table<Style, number>;
    public hairColors: Dexie.Table<HairColor, number>;
    constructor(_name: string) {
        super(_name);
        addonSuite(this, config);
        this.on('blocked', () => false);
        this.version(1).stores({
            friends: config?.secretKey || config?.encrypted?.secretKey ?
                '#id, &customId, $firstName, lastName, shoeSize, age, hasFriends => friends.id, *memberOf => clubs.id, group => groups.id, &hairColor => hairColors.id, [id+group]' :

                '++id, &customId, $firstName, lastName, shoeSize, age, hasFriends => friends.id, *memberOf => clubs.id, group => groups.id, &hairColor => hairColors.id, [id+group]',

            clubs: '++id, $name, theme => themes.id',
            themes: '++id, $name, style => styles.id',
            styles: '++id, $name, color',
            groups: '++id, $name',
            hairColors: '++id, $name'
        });
        this.friends.mapToClass(Friend);
        this.clubs.mapToClass(Club);
        this.themes.mapToClass(Theme);
        this.groups.mapToClass(Group);
        this.styles.mapToClass(Style);
        this.hairColors.mapToClass(HairColor);
    }
}(name);


export const databasesPositive = [
    // Not testing with immutable false because this makes testing a living hell...
    {
        desc: 'TestDatabase - all addons',
        immutable: true,
        encrypted: true,
        db: (dexie: typeof Dexie) => getDatabase(dexie, 'TestDatabase - all addons', {
            secretKey: Encryption.createRandomEncryptionKey()
        })
    },
    {
        desc: 'TestDatabase - populate / observable / immutable',
        encrypted: false,
        immutable: true,
        db: (dexie: typeof Dexie) => getDatabase(dexie, 'TestDatabase - populate / observable')
    }
];

let customId = 1000000;
export const mockFriends = (count = 5): Friend[] => {
    const friend = () => new Friend({
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        age: faker.datatype.number({ min: 1, max: 80 }),
        shoeSize: faker.datatype.number({ min: 5, max: 12 }),
        customId,
        hasFriends: [],
        memberOf: [],
        group: null,
        hairColor: null
    });
    return new Array(count).fill(null).map(() => {
        const mockfriend = friend();
        customId++;
        mockfriend.customId = customId;
        return mockfriend;
    });
};
export const mockClubs = (count = 5): Club[] => {
    const club = () => new Club({
        name: faker.lorem.words(2),
        size: faker.datatype.number(),
        theme: null,
        description: faker.lorem.sentences(4)
    });
    return new Array(count).fill(null).map(() => club());
};
export const mockThemes = (count = 5): Theme[] => {
    const theme = () => new Theme({
        name: faker.lorem.words(2),
        style: null,
        description: faker.lorem.sentences(4)
    });
    return new Array(count).fill(null).map(() => theme());
};
export const mockGroups = (count = 5): Group[] => {
    const group = () => new Group({
        name: faker.lorem.words(2),
        true: faker.datatype.boolean(),
        description: faker.lorem.sentences(4)
    });
    return new Array(count).fill(null).map(() => group());
};
export const mockStyles = (count = 5): Style[] => {
    const style = () => new Style({
        name: faker.lorem.words(2),
        color: faker.random.word(),
        description: faker.lorem.sentences(4)
    });
    return new Array(count).fill(null).map(() => style());
};
export const mockHairColors = (count = 5): HairColor[] => {
    const hairColor = () => new HairColor({
        name: faker.lorem.words(2),
    });
    return new Array(count).fill(null).map(() => hairColor());
};

// import { addonSuite } from '@pvermeer/dexie-suite-addon';
// import type { Dexie as DexieType } from 'dexie';
// import faker from 'faker/locale/nl';
// import { EMPTY, of } from 'rxjs';
// import { mergeMap, map } from 'rxjs/operators';

// export interface Friend {
//     id?: number;
//     testProp?: string;
//     age: number;
//     hasAge?: boolean;
//     firstName: string;
//     lastName: string;
//     shoeSize: number;
//     customId: number;
//     some?: { id: number; };
// }

// type TestDatabaseType = DexieType & { friends: DexieType.Table<Friend, number>; };

// export const databasesPositive = [
//     {
//         desc: 'TestDatabase',
//         db: (Dexie: typeof DexieType) => new class TestDatabase extends Dexie {
//             public friends: DexieType.Table<Friend, number>;
//             constructor(name: string) {
//                 super(name);
//                 addonSuite(this);
//                 this.on('blocked', () => false);
//                 this.version(1).stores({
//                     friends: '++id, customId, firstName, lastName, shoeSize, age, [age+shoeSize]'
//                 });
//                 console.log(this);
//             }
//         }('TestDatabase')
//     },
//     {
//         desc: 'TestDatabaseKeyPath',
//         db: (Dexie: typeof DexieType) => new class TestDatabaseKeyPath extends Dexie {
//             public friends: DexieType.Table<Friend, number>;
//             constructor(name: string) {
//                 super(name);
//                 addonSuite(this);
//                 this.on('blocked', () => false);
//                 this.version(1).stores({
//                     friends: '++some.id, customId, firstName, lastName, shoeSize, age, [age+shoeSize]'
//                 });
//             }
//         }('TestDatabaseKeyPath')
//     },
//     {
//         desc: 'TestDatabaseCustomKey',
//         db: (Dexie: typeof DexieType) => new class TestDatabaseCustomKey extends Dexie {
//             public friends: DexieType.Table<Friend, number>;
//             constructor(name: string) {
//                 super(name);
//                 addonSuite(this);
//                 this.on('blocked', () => false);
//                 this.version(1).stores({
//                     friends: 'customId, firstName, lastName, shoeSize, age, [age+shoeSize]'
//                 });
//             }
//         }('TestDatabaseCustomKey')
//     },
//     {
//         desc: 'TestDatabaseNoKey',
//         db: (Dexie: typeof DexieType) => new class TestDatabaseNoKey extends Dexie {
//             public friends: DexieType.Table<Friend, number>;
//             constructor(name: string) {
//                 super(name);
//                 addonSuite(this);
//                 this.on('blocked', () => false);
//                 this.version(1).stores({
//                     friends: '++, customId, firstName, lastName, shoeSize, age, [age+shoeSize]'
//                 });
//             }
//         }('TestDatabaseNoKey')
//     }
// ];

// export const databasesNegative = [
//     {
//         desc: 'TestDatabaseCompoundIndex',
//         db: (Dexie: typeof DexieType) => new class TestDatabaseCompoundIndex extends Dexie {
//             public friends: DexieType.Table<Friend, number>;
//             constructor(name: string) {
//                 super(name);
//                 addonSuite(this);
//                 this.on('blocked', () => false);
//                 this.version(1).stores({
//                     friends: '++id, firstName, lastName, [firstName+lastName], shoeSize, age'
//                 });
//             }
//         }('TestDatabaseCompoundIndex')
//     },
//     {
//         desc: 'TestDatabaseMultiIndex',
//         db: (Dexie: typeof DexieType) => new class TestDatabaseMultiIndex extends Dexie {
//             public friends: DexieType.Table<Friend, number>;
//             constructor(name: string) {
//                 super(name);
//                 addonSuite(this);
//                 this.on('blocked', () => false);
//                 this.version(1).stores({
//                     friends: '++id, multi*, firstName, lastName, shoeSize, age'
//                 });
//             }
//         }('TestDatabaseMultiIndex')
//     }
// ];

// interface MethodOptions {
//     emitUndefined?: boolean;
//     emitFull?: boolean;
//     singelton?: boolean;
// }
// export const methods = [
//     {
//         desc: 'get()',
//         singelton: false,
//         array: false,
//         alwaysEmit: false,
//         method: (db: TestDatabaseType) => (id: number, _customId: number, _options?: MethodOptions) => db.friends.$.get(id)
//     },
//     {
//         desc: 'get({id})',
//         singelton: false,
//         array: false,
//         alwaysEmit: false,
//         method: (db: TestDatabaseType) => (id: number, _customId: number, _options?: MethodOptions) =>
//             db.friends.schema.primKey.keyPath === 'id' ?
//                 db.friends.$.get({ id }) :
//                 db.friends.$.get({ customId: _customId })
//     },
//     {
//         desc: 'toArray()',
//         singelton: true,
//         array: true,
//         alwaysEmit: true,
//         method: (db: TestDatabaseType) => (
//             id: number,
//             _customId: number,
//             _options: MethodOptions = {}
//         ) => _options.singelton ?
//                 db.friends.$.toArray() :
//                 db.friends.$.toArray().pipe(
//                     mergeMap(x => {
//                         if (_options.emitFull) { return of(x); }
//                         /** The general method tests rely on returning undefined when not found. */
//                         const find = x.find(y => y.id === id || y.customId === _customId || (y.some && y.some.id === id));
//                         if (!find && !_options.emitUndefined) { return EMPTY; }
//                         return of(find);
//                     })
//                 )
//     },
//     {
//         desc: 'where()',
//         singelton: false,
//         array: true,
//         alwaysEmit: false,
//         method: (db: TestDatabaseType) => (id: number, _customId: number, _options: MethodOptions = {}) =>
//             db.friends.$.where(':id').equals(id).toArray().pipe(map(x => _options.emitFull ? x : x[0]))
//     },
//     {
//         desc: 'where({id})',
//         singelton: false,
//         array: true,
//         alwaysEmit: false,
//         method: (db: TestDatabaseType) => (id: number, _customId: number, _options: MethodOptions = {}) =>
//             db.friends.schema.primKey.keyPath === 'id' ?
//                 db.friends.$.where({ id }).toArray().pipe(map(x => _options.emitFull ? x : x[0])) :
//                 db.friends.$.where({ customId: _customId }).toArray().pipe(map(x => _options.emitFull ? x : x[0]))
//     },
//     {
//         desc: 'where([age, shoeSize])',
//         singelton: false,
//         array: true,
//         alwaysEmit: false,
//         method: (db: TestDatabaseType) => (id: number, _customId: number, _options: MethodOptions = {}) =>
//             db.friends.$.where(['age', 'shoeSize']).between([0, 0], [100, 100]).toArray().pipe(
//                 mergeMap(x => {
//                     if (_options.emitFull) { return of(x); }
//                     /** The general method tests rely on returning undefined when not found. */
//                     const find = x.find(y => y.id === id || y.customId === _customId || (y.some && y.some.id === id));
//                     if (!find && !_options.emitUndefined) { return EMPTY; }
//                     return of(find);
//                 })
//             )
//     },
//     {
//         desc: 'where().anyOf()',
//         singelton: false,
//         array: true,
//         alwaysEmit: false,
//         method: (db: TestDatabaseType) => (id: number, _customId: number, _options: MethodOptions = {}) =>
//             db.friends.$.where(':id').anyOf([id]).toArray().pipe(map(x => _options.emitFull ? x : x[0]))
//     }
// ];

// let customId = 1000000;
// export const mockFriends = (count = 5): Friend[] => {
//     const friend = () => ({
//         firstName: faker.name.firstName(),
//         lastName: faker.name.lastName(),
//         age: faker.datatype.number({ min: 1, max: 80 }),
//         shoeSize: faker.datatype.number({ min: 5, max: 12 }),
//         customId
//     });
//     return new Array(count).fill(null).map(() => {
//         const mockfriend = friend();
//         mockfriend.customId = customId;
//         customId++;
//         return mockfriend;
//     });
// };

