import { Dexie } from 'dexie';
import faker from 'faker/locale/en';
import { booleanNullIndex } from '../../src/boolean-null-index';

export interface Friend {
    id?: number;
    testProp?: string;
    age: number | null | boolean;
    firstName: string | null | boolean;
    lastName: string;
    shoeSize: number;
    date: Date | null | boolean;
}

class TestDatabase extends Dexie {
    public friends: Dexie.Table<Friend, number>;
    constructor(name: string) {
        super(name);
        booleanNullIndex(this);
        this.version(1).stores({
            friends: '++id, firstName, lastName, shoeSize, age, date, [age+shoeSize]',
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
            addons: [booleanNullIndex]
        });
        this.version(1).stores({
            friends: '++id, firstName, lastName, shoeSize, age, date, [age+shoeSize]',
        });
    }
}

export class TestDatabaseWithHooks extends Dexie {
    public friends: Dexie.Table<Friend, number>;
    constructor(name: string) {
        super(name, {
            autoOpen: false
        });
        booleanNullIndex(this);

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
            friends: '++id, firstName, lastName, shoeSize, age, date, [age+shoeSize]',
        });
    }
}
function testDatabaseJs(): TestDatabase {
    const db = new Dexie('TestDatabaseJs', {
        addons: [booleanNullIndex]
    });
    db.version(1).stores({
        friends: '++id, firstName, lastName, shoeSize, age, date, [age+shoeSize]',
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

export const mockFriends = (count = 5): Friend[] => {
    const friend = () => ({
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName(),
        age: faker.datatype.number({ min: 50, max: 80 }),
        shoeSize: faker.datatype.number({ min: 5, max: 12 }),
        date: faker.date.recent()
    });
    return new Array(count).fill(null).map(() => friend());
};
