import { Dexie } from "dexie";
import faker from "faker/locale/en";
import { classMap } from "../../src/class";
import { OnSerialize } from "../../src/serialize";

type OmitMethods<T> = Pick<
  T,
  { [P in keyof T]: T[P] extends (...args: any[]) => any ? never : P }[keyof T]
>;

class Theme {
  name: string;
  createdAt: Date;

  serialize() {
    return {
      name: () => this.name,
      createdAt: () => this.createdAt.getTime(),
    };
  }

  deserialize(input: OmitMethods<Theme>) {
    Object.entries(input).forEach(([prop, value]) => (this[prop] = value));
    this.createdAt = new Date(input.createdAt);
  }

  constructor(input: OmitMethods<Theme>) {
    this.deserialize(input);
  }
}

class Club {
  name: string;
  theme: Theme;
  createdAt: Date;

  serialize() {
    return {
      name: () => this.name,
      theme: () => this.theme,
      createdAt: () => this.createdAt.getTime(),
    };
  }

  deserialize(input: OmitMethods<Club>) {
    Object.entries(input).forEach(([prop, value]) => (this[prop] = value));
    this.theme = new Theme(this.theme);
    this.createdAt = new Date(input.createdAt);
  }

  constructor(input: OmitMethods<Club>) {
    this.deserialize(input);
  }
}

export class Friend implements OnSerialize {
  id?: number;
  age?: number;
  firstName: string;
  lastName: string;
  shoeSize: number;
  date: Date;
  memberOf: Club;

  address: {
    zipCode: string;
    street: string;
  };

  someMethod() {
    return;
  }

  serialize() {
    return {
      id: () => this.id,
      age: () => this.age,
      firstName: () => this.firstName,
      lastName: () => this.lastName,
      shoeSize: () => this.shoeSize,
      date: () => this.date.getTime(),
      address: () => ({ ...this.address }),
      memberOf: () => this.memberOf,
    };
  }

  deserialize(input: OmitMethods<Friend>) {
    Object.entries(input).forEach(([prop, value]) => (this[prop] = value));
    this.date = new Date(input.date);
    this.memberOf = new Club(this.memberOf);
  }

  constructor(input: OmitMethods<Friend>) {
    this.deserialize(input);
  }
}

class TestDatabase extends Dexie {
  public friends: Dexie.Table<Friend, number>;
  constructor(name: string) {
    super(name + " - " + faker.random.alphaNumeric(5));
    this.on("blocked", () => false);
    classMap(this);
    this.version(1).stores({
      friends: "++id, age",
    });

    this.friends.mapToClass(Friend);
  }
}
class TestDatabaseAddons extends Dexie {
  public friends: Dexie.Table<Friend, number>;
  constructor(name: string) {
    super(name + " - " + faker.random.alphaNumeric(5), {
      addons: [classMap],
    });
    this.on("blocked", () => false);
    this.version(1).stores({
      friends: "++id, age",
    });

    this.friends.mapToClass(Friend);
  }
}

function testDatabaseJs(): TestDatabase {
  const db = new Dexie(
    "TestDatabaseJs" + " - " + faker.random.alphaNumeric(5),
    {
      addons: [classMap],
    }
  );
  db.on("blocked", () => false);
  db.version(1).stores({
    friends: "++id, age",
  });

  db["friends"].mapToClass(Friend);

  return db as TestDatabase;
}

export const databasesPositive = [
  {
    desc: "TestDatabase",
    db: () => new TestDatabase("TestDatabase"),
  },
  {
    desc: "TestDatabaseAddons",
    db: () => new TestDatabaseAddons("TestDatabaseAddons"),
  },
  {
    desc: "testDatabaseJs",
    db: () => testDatabaseJs(),
  },
];

export const mockFriends = (count = 5): Friend[] => {
  const friend = () =>
    new Friend({
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      age: faker.datatype.number({ min: 1, max: 80 }),
      shoeSize: faker.datatype.number({ min: 5, max: 12 }),
      date: faker.date.recent(),
      memberOf: new Club({
        createdAt: faker.date.past(),
        name: faker.name.jobTitle(),
        theme: new Theme({
          createdAt: faker.date.past(),
          name: faker.name.jobArea(),
        }),
      }),

      address: {
        zipCode: faker.address.zipCode(),
        street: faker.address.streetName(),
      },
    });
  return new Array(count).fill(null).map(() => friend());
};
