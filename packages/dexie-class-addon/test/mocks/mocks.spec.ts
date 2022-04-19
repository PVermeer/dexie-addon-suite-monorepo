import { Dexie } from 'dexie';
import faker from 'faker/locale/en';
import { classMap } from '../../src/class';
import { OnSerialize } from '../../src/serialize';

type OmitMethods<T> = Pick<T, { [P in keyof T]: T[P] extends (...args: any[]) => any ? never : P; }[keyof T]>;

export class Friend implements OnSerialize {
    id?: number;
    age?: number;
    firstName: string;
    lastName: string;
    shoeSize: number;
    date: Date;

    someMethod() { return; }

    serialize() {
        return {
            id: () => this.id,
            age: () => this.age,
            firstName: () => this.firstName,
            lastName: () => this.lastName,
            shoeSize: () => this.shoeSize,
            date: () => this.date.getTime()
        };
    }

    deserialize(input: OmitMethods<Friend>) {
        Object.entries(input).forEach(([prop, value]) => this[prop] = value);
        this.date = new Date(input.date);
    }

    constructor(input: OmitMethods<Friend>) {
        this.deserialize(input);
    }
}

class TestDatabase extends Dexie {
    public friends: Dexie.Table<Friend, number>;
    constructor(name: string) {
        super(name);
        classMap(this);
        this.version(1).stores({
            friends: '++id, age',
        });

        this.friends.mapToClass(Friend);
    }
}
class TestDatabaseAddons extends Dexie {
    public friends: Dexie.Table<Friend, number>;
    constructor(name: string) {
        super(name, {
            addons: [classMap]
        });
        this.version(1).stores({
            friends: '++id, age',
        });

        this.friends.mapToClass(Friend);
    }
}

function testDatabaseJs(): TestDatabase {
    const db = new Dexie('TestDatabaseJs', {
        addons: [classMap]
    });
    db.version(1).stores({
        friends: '++id, age',
    });

    db['friends'].mapToClass(Friend);

    return db as TestDatabase;
}

export const databasesPositive = [
    {
        desc: 'TestDatabase',
        db: () => new TestDatabase('TestDatabase')
    },
    {
        desc: 'TestDatabaseAddons',
        db: () => new TestDatabaseAddons('TestDatabaseAddons')
    },
    {
        desc: 'testDatabaseJs',
        db: () => testDatabaseJs()
    }
];

export const mockFriends = (count = 5): Friend[] => {
    const friend = () => new Friend({
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        age: faker.datatype.number({ min: 1, max: 80 }),
        shoeSize: faker.datatype.number({ min: 5, max: 12 }),
        date: faker.date.recent()
    });
    return new Array(count).fill(null).map(() => friend());
};
