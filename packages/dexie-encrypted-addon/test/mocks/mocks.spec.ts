import { Dexie } from "dexie";
import faker from "faker/locale/en";
import { encrypted } from "../../src/encrypted";
import { Encryption } from "../../src/encryption.class";

export interface Friend {
  id?: string;
  testProp?: string;
  hasAge?: boolean;
  firstName: string;
  lastName: string;
  shoeSize: number;
}

export class TestDatabase extends Dexie {
  public friends: Dexie.Table<Friend, string>;
  constructor(name: string, secret?: string) {
    super(name + " - " + faker.random.alphaNumeric(5));
    encrypted(this, {
      secretKey: secret || Encryption.createRandomEncryptionKey(),
    });
    this.version(1).stores({
      friends: "++#id, firstName, $lastName, $shoeSize, age",
      buddies: "++id, buddyName, buddyAge",
      dudes: "++id, $dudeName, $dudeAge",
      empty: "",
    });
  }
}
class TestDatabaseAddons extends Dexie {
  public friends: Dexie.Table<Friend, string>;
  constructor(name: string, secret: string) {
    super(name + " - " + faker.random.alphaNumeric(5), {
      addons: [encrypted.setOptions({ secretKey: secret })],
    });
    this.version(1).stores({
      friends: "++#id, firstName, $lastName, $shoeSize, age",
    });
  }
}
class TestDatabaseAddonsNoSecret extends Dexie {
  public friends: Dexie.Table<Friend, string>;
  constructor(name: string) {
    super(name + " - " + faker.random.alphaNumeric(5), {
      addons: [
        encrypted.setOptions({
          secretKey: Encryption.createRandomEncryptionKey(),
        }),
      ],
    });
    this.version(1).stores({
      friends: "++#id, firstName, $lastName, $shoeSize, age",
    });
  }
}
class TestDatabaseNoEncryptedKeys extends Dexie {
  public friends: Dexie.Table<Friend, string>;
  constructor(name: string) {
    super(name + " - " + faker.random.alphaNumeric(5));
    encrypted(this, { secretKey: Encryption.createRandomEncryptionKey() });
    this.version(1).stores({
      friends: "++#id, firstName, lastName, shoeSize, age",
    });
  }
}
class TestDatabaseNoHashPrimary extends Dexie {
  public friends: Dexie.Table<Friend, string>;
  constructor(name: string) {
    super(name + " - " + faker.random.alphaNumeric(5));
    encrypted(this, { secretKey: Encryption.createRandomEncryptionKey() });
    this.version(1).stores({
      friends: "++id, firstName, lastName, shoeSize, age",
    });
  }
}
class TestDatabaseNoIndexes extends Dexie {
  public friends: Dexie.Table<Friend, string>;
  constructor(name: string) {
    super(name + " - " + faker.random.alphaNumeric(5));
    encrypted(this, { secretKey: Encryption.createRandomEncryptionKey() });
    this.version(1).stores({
      friends: "",
    });
  }
}

export class TestDatabaseFalsySecret extends Dexie {
  public friends: Dexie.Table<Friend, string>;
  constructor(name: string) {
    super(name + " - " + faker.random.alphaNumeric(5));
    encrypted(this, { secretKey: "" });
    this.version(1).stores({
      friends: "++#id, firstName, $lastName, $shoeSize, age",
      buddies: "++id, buddyName, buddyAge",
      dudes: "++id, $dudeName, $dudeAge",
      empty: "",
    });
  }
}

function testDatabaseJs(): TestDatabase {
  const db = new Dexie(
    "TestDatabaseJs" + " - " + faker.random.alphaNumeric(5),
    {
      addons: [
        encrypted.setOptions({
          secretKey: Encryption.createRandomEncryptionKey(),
        }),
      ],
    }
  );
  db.version(1).stores({
    friends: "#id, firstName, $lastName, $shoeSize, age",
    buddies: "++id, buddyName, buddyAge",
    dudes: "++id, $dudeName, $dudeAge",
    empty: "",
  });
  return db as TestDatabase;
}

export function testDatabaseJsWithSecret(_secret?: string): TestDatabase {
  const secret = _secret ?? Encryption.createRandomEncryptionKey();
  const db = new Dexie(
    "TestDatabaseJs" + " - " + faker.random.alphaNumeric(5),
    {
      addons: [encrypted.setOptions({ secretKey: secret })],
    }
  );
  db.version(1).stores({
    friends: "#id, firstName, $lastName, $shoeSize, age",
    buddies: "++id, buddyName, buddyAge",
    dudes: "++id, $dudeName, $dudeAge",
    empty: "",
  });
  return db as TestDatabase;
}

export const databasesPositive = [
  {
    desc: "TestDatabase",
    db: () =>
      new TestDatabase("TestDatabase", Encryption.createRandomEncryptionKey()),
  },
  {
    desc: "TestDatabaseNoEncryptedKeys",
    db: () => new TestDatabaseNoEncryptedKeys("TestDatabaseNoEncryptedKeys"),
  },
  {
    desc: "TestDatabaseAddons",
    db: () =>
      new TestDatabaseAddons(
        "TestDatabaseAddons",
        Encryption.createRandomEncryptionKey()
      ),
  },
  {
    desc: "TestDatabaseAddonsNoSecret",
    db: () => new TestDatabaseAddonsNoSecret("TestDatabaseAddonsNoSecret"),
  },
  {
    desc: "testDatabaseJs",
    db: () => testDatabaseJs(),
  },
  {
    desc: "testDatabaseJsWithSecret",
    db: () => testDatabaseJsWithSecret(),
  },
];
export const databasesNegative = [
  {
    desc: "TestDatabaseNoHashPrimary",
    db: () => new TestDatabaseNoHashPrimary("TestDatabaseNoHashPrimary"),
  },
  {
    desc: "TestDatabaseNoIndexesNoHash",
    db: () => new TestDatabaseNoIndexes("TestDatabaseNoIndexesNoHash"),
  },
];

export class TestDatabaseNotImmutable extends Dexie {
  public friends: Dexie.Table<Friend, string>;
  constructor(name: string) {
    super(name + " - " + faker.random.alphaNumeric(5));
    encrypted(this, {
      secretKey: Encryption.createRandomEncryptionKey(),
      immutable: false,
    });
    this.version(1).stores({
      friends: "++#id, firstName, $lastName, $shoeSize, age",
    });
  }
}

export const mockFriends = (count = 5): Friend[] => {
  const friend = () => ({
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    age: faker.datatype.number({ min: 1, max: 80 }),
    shoeSize: faker.datatype.number({ min: 5, max: 12 }),
  });
  return new Array(count).fill(null).map(() => friend());
};
