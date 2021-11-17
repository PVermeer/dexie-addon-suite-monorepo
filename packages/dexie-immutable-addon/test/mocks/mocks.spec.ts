import { Dexie } from 'dexie';
import faker from 'faker/locale/en';
import { immutable } from '../../src/immutable';

export interface Friend {
    id?: number;
    testProp?: string;
    age?: number;
    firstName: string;
    lastName: string;
    shoeSize: number;
}

class TestDatabase extends Dexie {
    public friends: Dexie.Table<Friend, number>;
    constructor(name: string) {
        super(name);
        immutable(this);
        this.version(1).stores({
            friends: '++id, firstName, lastName, shoeSize, age',
            buddies: '++id, buddyName, buddyAge',
            dudes: '++id, dudeName, dudeAge',
            empty: ''
        });
    }
}
class TestDatabaseAddons extends Dexie {
    public friends: Dexie.Table<Friend, number>;
    constructor(name: string) {
        super(name, {
            addons: [immutable]
        });
        this.version(1).stores({
            friends: '++id, firstName, lastName, shoeSize, age',
        });
    }
}

export class TestDatabaseWithHooks extends Dexie {
    public friends: Dexie.Table<Friend, number>;
    constructor(name: string) {
        super(name, {
            autoOpen: false
        });
        immutable(this);

        this.on('ready', () => {
            this.friends.hook('creating', (_primaryKey, _document) => {
                const [friend] = mockFriends(1);
                _document.firstName = friend.firstName;
            });

            this.friends.hook('updating', (_document) => {
                const [friend] = mockFriends(1);
                const updDocument = { lastName: friend.lastName };
                return updDocument;
            });
        });

        this.version(1).stores({
            friends: '++id, firstName, lastName, shoeSize, age',
        });
    }
}
function testDatabaseJs(): TestDatabase {
    const db = new Dexie('TestDatabaseJs', {
        addons: [immutable]
    });
    db.version(1).stores({
        friends: '++id, firstName, lastName, shoeSize, age',
        buddies: '++id, buddyName, buddyAge',
        dudes: '++id, dudeName, dudeAge',
        empty: ''
    });
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

export class TestDatabaseNotImmutable extends Dexie {
    public friends: Dexie.Table<Friend, string>;
    constructor(name: string) {
        super(name);
        this.version(1).stores({
            friends: '++id, firstName, lastName, shoeSize, age',
        });
    }
}

export const mockFriends = (count = 5): Friend[] => {
    const friend = () => ({
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        age: faker.datatype.number({ min: 1, max: 80 }),
        shoeSize: faker.datatype.number({ min: 5, max: 12 })
    });
    return new Array(count).fill(null).map(() => friend());
};
