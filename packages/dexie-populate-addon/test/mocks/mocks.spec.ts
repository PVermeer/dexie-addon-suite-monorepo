import { Dexie, PromiseExtended } from 'dexie';
import faker from 'faker/locale/nl';
import { populate } from '../../src/populate';
import { Populated, Ref } from '../../src/types';

type OmitMethods<T> = Pick<T, { [P in keyof T]: T[P] extends (...args: any[]) => any ? never : P; }[keyof T]>;

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
    styleId?: number;
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
    id?: number;
    testProp?: string;
    age: number;
    hasAge?: boolean;
    firstName: string;
    lastName: string;
    shoeSize: number;
    customId: number;
    some?: { id: number; other: string; };
    hasFriends: Ref<Friend, number>[];
    memberOf: Ref<Club, number>[];
    group: Ref<Group, number>;
    hairColor: Ref<HairColor, number>;
    testArray: string[];

    doSomething() {
        return 'done';
    }

    constructor(friend: OmitMethods<Friend>) {
        Object.entries(friend).forEach(([key, value]) => {
            this[key] = value;
        });
    }
}

type TestDatabaseType = Dexie & { friends: Dexie.Table<Friend, number>; };

export const databasesPositive = [
    {
        desc: 'TestDatabase',
        db: (dexie: typeof Dexie, addon: typeof populate) => new class TestDatabase extends dexie {

            public friends: Dexie.Table<Friend, number>;
            public clubs: Dexie.Table<Club, number>;
            public themes: Dexie.Table<Theme, number>;
            public groups: Dexie.Table<Group, number>;
            public styles: Dexie.Table<Style, number>;
            public hairColors: Dexie.Table<HairColor, number>;

            constructor(name: string) {
                super(name);
                addon(this);
                this.on('blocked', () => false);
                this.version(1).stores({
                    friends: '++id, &customId, firstName, lastName, shoeSize, age, hasFriends => friends.id, *memberOf => clubs.id, group => groups.id, &hairColor => hairColors.id, [id+group]',
                    clubs: '++id, name, theme => themes.id',
                    themes: '++id, name, style => styles.styleId',
                    styles: '++styleId, name, color',
                    groups: '++id, name',
                    hairColors: '++id, name'
                });

                this.friends.mapToClass(Friend);
                this.clubs.mapToClass(Club);
                this.themes.mapToClass(Theme);
                this.groups.mapToClass(Group);
                this.styles.mapToClass(Style);
                this.hairColors.mapToClass(HairColor);
            }
        }('TestDatabase')
    }
];

export const testDatabaseNoRelationalKeys = (dexie: typeof Dexie) =>
    new class TestDatabase extends dexie {
        constructor(name: string) {
            super(name);
            populate(this);
            this.on('blocked', () => false);
            this.version(1).stores({
                friends: '++id, customId, firstName, lastName, shoeSize, age',
            });
        }
    }('Negative TestDatabase - no relational keys');

export const testDatabaseNoTableForRelationalKeys = (dexie: typeof Dexie) =>
    new class TestDatabase extends dexie {
        constructor(name: string) {
            super(name);
            populate(this);
            this.on('blocked', () => false);
            this.version(1).stores({
                friends: '++id, customId, firstName, lastName, shoeSize, age, group => groups.id',
            });
        }
    }('Negative TestDatabase - no table for relational keys');


export const databasesNegative = [];


export const methodsPositive = [

    // ======== Get() =========
    {
        desc: 'Table.populate().get()',
        populated: true,
        method: (db: TestDatabaseType) => (_id: number, _shallow = false) =>
            db.friends.populate({ shallow: _shallow }).get(_id).then(x => x!)
    },
    {
        desc: 'Table.populate().get({ group: id })',
        index: true,
        populated: true,
        method: (db: TestDatabaseType) => (_id: number, _shallow = false) =>
            db.friends.populate({ shallow: _shallow }).get({ group: _id }).then(x => x!)
    },
    {
        desc: `Table.populate().get(cb)`,
        populated: true,
        method: (db: TestDatabaseType) => (_id: number, _shallow = false) =>
            db.friends.populate({ shallow: _shallow }).get(_id, cb => cb)
    },
    {
        desc: `Table.populate(['hasFriends', 'memberOf', 'theme', 'style', 'hairColor']).get()`,
        populated: true,
        populatedPartial: true,
        method: (db: TestDatabaseType) => (_id: number, shallow = false) =>
            db.friends.populate(['hasFriends', 'memberOf', 'theme', 'style', 'hairColor'], { shallow }).get(_id).then(x => x!)
    },
    {
        desc: 'Table.get()',
        populated: false,
        method: (db: TestDatabaseType) => (_id: number, _shallow = false) =>
            db.friends.get(_id).then(x => x!)
    },
    {
        desc: 'Table.get({ group: id })',
        index: true,
        populated: false,
        method: (db: TestDatabaseType) => (_id: number, _shallow = false) =>
            db.friends.get({ group: _id }).then(x => x!)
    },

    // ======== toArray() =========
    {
        desc: 'Table.populate().toArray()',
        populated: true,
        method: (db: TestDatabaseType) => (_id: number, _shallow = false) =>
            db.friends.populate({ shallow: _shallow }).toArray().then(x => x.find(y => y.id === _id))
    },
    {
        desc: `Table.populate().toArray(cb)`,
        populated: true,
        populatedPartial: false,
        method: (db: TestDatabaseType) => (_id: number, _shallow = false) =>
            db.friends.populate({ shallow: _shallow }).toArray(x => x!.find(y => y.id === _id))
    },
    {
        desc: `Table.populate(['hasFriends', 'memberOf', 'theme', 'style', 'hairColor']).toArray()`,
        populated: true,
        populatedPartial: true,
        method: (db: TestDatabaseType) => (_id: number, shallow = false) =>
            db.friends.populate(['hasFriends', 'memberOf', 'theme', 'style', 'hairColor'], { shallow }).toArray().then(x => x.find(y => y.id === _id))
    },
    {
        desc: 'Table.toArray()',
        populated: false,
        method: (db: TestDatabaseType) => (_id: number, _shallow = false) =>
            db.friends.toArray().then(x => x.find(y => y.id === _id))
    },

    // ======== Where() =========
    {
        desc: 'Table.populate().where()',
        populated: true,
        method: (db: TestDatabaseType) => (_id: number, _shallow = false) =>
            db.friends.populate({ shallow: _shallow }).where(':id').equals(_id).first()
    },
    {
        desc: `Table.populate().where('group')`,
        populated: true,
        index: true,
        method: (db: TestDatabaseType) => (_id: number, _shallow = false) =>
            db.friends.populate({ shallow: _shallow }).where('group').equals(_id).first()
    },
    {
        desc: 'Table.populate().where({ group: id })',
        populated: true,
        index: true,
        method: (db: TestDatabaseType) => (_id: number, _shallow = false) =>
            db.friends.populate({ shallow: _shallow }).where({ group: _id }).first()
    },
    {
        desc: `Table.populate().where('memberOf')`,
        populated: true,
        index: true,
        multiIndex: true,
        method: (db: TestDatabaseType) => (_id: number, _shallow = false) =>
            db.friends.populate({ shallow: _shallow }).where('memberOf').equals(_id).first()
    },
    {
        desc: 'Table.populate().where(cb)',
        populated: true,
        method: (db: TestDatabaseType) => (_id: number, _shallow = false) =>
            db.friends.populate({ shallow: _shallow }).where(':id').equals(_id).first(cb => cb)
    },
    {
        desc: `Table.populate(['hasFriends', 'memberOf', 'theme', 'style', 'hairColor']).where()`,
        populated: true,
        populatedPartial: true,
        method: (db: TestDatabaseType) => (_id: number, shallow = false) =>
            db.friends.populate(['hasFriends', 'memberOf', 'theme', 'style', 'hairColor'], { shallow }).where(':id').equals(_id).first()
    },
    {
        desc: `Table.populate(['hasFriends', 'memberOf', 'theme', 'style', 'hairColor']).where({ id })`,
        populated: true,
        populatedPartial: true,
        method: (db: TestDatabaseType) => (id: number, shallow = false) =>
            db.friends.populate(['hasFriends', 'memberOf', 'theme', 'style', 'hairColor'], { shallow }).where({ id }).first()
    },
    {
        desc: 'Table.where()',
        populated: false,
        method: (db: TestDatabaseType) => (_id: number, _shallow = false) =>
            db.friends.where(':id').equals(_id).first()
    },
    {
        desc: 'Table.where({ id })',
        populated: false,
        method: (db: TestDatabaseType) => (id: number, _shallow = false) =>
            db.friends.where({ id }).first()
    },
    {
        desc: 'Table.where({ group: id })',
        populated: false,
        index: true,
        method: (db: TestDatabaseType) => (id: number, _shallow = false) =>
            db.friends.where({ group: id }).first()
    },
    {
        desc: `Table.populate().where('memberOf')`,
        populated: false,
        index: true,
        multiIndex: true,
        method: (db: TestDatabaseType) => (_id: number, _shallow = false) =>
            db.friends.where('memberOf').equals(_id).first()
    },

    // ======== Where().toArray() =========
    {
        desc: 'Table.populate().where().toArray()',
        populated: true,
        method: (db: TestDatabaseType) => (_id: number, _shallow = false) =>
            db.friends.populate({ shallow: _shallow }).where(':id').equals(_id).toArray().then(x => x[0])
    },
    {
        desc: 'Table.populate().where().toArray(cb)',
        populated: true,
        method: (db: TestDatabaseType) => (_id: number, _shallow = false) =>
            db.friends.populate({ shallow: _shallow }).where(':id').equals(_id).toArray(x => x[0])
    },

    // ======== Where().anyOf() =========
    {
        desc: 'Table.populate().where().anyOf()',
        populated: true,
        method: (db: TestDatabaseType) => (_id: number, _shallow = false) =>
            db.friends.populate({ shallow: _shallow }).where(':id').anyOf(_id).first()
    },

    // ======== Compound =========
    {
        desc: `Table.populate().where('[group+age]')`,
        populated: true,
        method: (db: TestDatabaseType) => (_id: number, _shallow = false) =>
            db.friends.populate({ shallow: _shallow }).where('[id+group]').equals([_id, 2]).first()
    },
    {
        desc: `Table.populate().where({ id: _id, group: 2 })`,
        populated: true,
        method: (db: TestDatabaseType) => (_id: number, _shallow = false) =>
            db.friends.populate({ shallow: _shallow }).where({ id: _id, group: 2 }).first()
    },

    // ======== Each() =========
    {
        desc: 'Table.populate().each()',
        populated: true,
        method: (db: TestDatabaseType) => (_id: number, _shallow = false) =>
            new Promise((res: (value: Populated<Friend, false, string>) => void) =>
                db.friends.populate({ shallow: _shallow }).each(x => res(x)))
    },
    {
        desc: `Table.populate(['hasFriends', 'memberOf', 'theme', 'style', 'hairColor']).each()`,
        populated: true,
        populatedPartial: true,
        method: (db: TestDatabaseType) => (_id: number, shallow = false) =>
            new Promise((res: (value: Populated<Friend, false, string>) => void) =>
                db.friends.populate(['hasFriends', 'memberOf', 'theme', 'style', 'hairColor'], { shallow }).each(x => res(x as any)))
    },
    {
        desc: 'Table.each()',
        populated: false,
        method: (db: TestDatabaseType) => (_id: number, _shallow = false) =>
            new Promise((res: (value: Friend) => void) =>
                db.friends.each(x => res(x)))
    },
    {
        desc: 'Table.populate().where().each()',
        populated: true,
        method: (db: TestDatabaseType) => (_id: number, _shallow = false) =>
            new Promise((res: (value: Populated<Friend, false, string>) => void) =>
                db.friends.populate({ shallow: _shallow }).where(':id').equals(_id).each(x => res(x as any)))
    },
    {
        desc: `Table.populate(['hasFriends', 'memberOf', 'theme', 'style', 'hairColor']).where().each()`,
        populated: true,
        populatedPartial: true,
        method: (db: TestDatabaseType) => (_id: number, shallow = false) =>
            new Promise((res: (value: Populated<Friend, false, string>) => void) =>
                db.friends
                    .populate(['hasFriends', 'memberOf', 'theme', 'style', 'hairColor'], { shallow })
                    .where(':id')
                    .equals(_id)
                    .each(x => res(x as any)))
    },
    {
        desc: 'Table.where().each()',
        populated: false,
        method: (db: TestDatabaseType) => (_id: number, _shallow = false) =>
            new Promise((res: (value: Friend) => void) =>
                db.friends.where(':id').equals(_id).each(x => res(x)))
    },

    // ======== orderBy(age) =========
    {
        desc: 'Table.populate().orderBy(age).toArray()',
        populated: true,
        method: (db: TestDatabaseType) => (_id: number, _shallow = false) =>
            db.friends.populate({ shallow: _shallow }).orderBy('age').toArray().then(x => x.find(y => y.id === _id))
    }
];

export const methodsNegative = [
    {
        desc: 'Table.populate().get()',
        populated: true,
        method: (db: TestDatabaseType) => (_id: number, shallow = false) =>
            db.friends.populate(['sdfsdf'], { shallow }).get(_id).then(x => x!)
    },
    {
        desc: 'Table.populate().where()',
        populated: true,
        method: (db: TestDatabaseType) => (_id: number, shallow = false) =>
            db.friends.populate(['sdfsdf'], { shallow }).where(':id').equals(_id).first()
    },
    {
        desc: 'Table.populate().each()',
        populated: true,
        method: (db: TestDatabaseType) => (_id: number, shallow = false) =>
            db.friends.populate(['sdfsdf'], { shallow })
                .each(x => x) as unknown as PromiseExtended<Populated<Friend, false, 'sdfsdf'>>
    },
    {
        desc: 'Table.populate().where().each()',
        populated: true,
        method: (db: TestDatabaseType) => (_id: number, shallow = false) =>
            db.friends.populate(['sdfsdf'], { shallow }).where(':id').equals(_id)
                .each(x => x) as unknown as PromiseExtended<Populated<Friend, false, 'sdfsdf'>>
    }
];

let customId = 1000;
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
        hairColor: null,
        testArray: []
    });
    return new Array(count).fill(null).map(() => {
        const mockFriend = friend();
        customId++;
        return mockFriend;
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
