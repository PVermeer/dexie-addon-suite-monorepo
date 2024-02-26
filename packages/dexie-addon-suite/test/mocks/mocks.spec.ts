import { OnSerialize } from "@pvermeer/dexie-class-addon";
import { EncryptedOptions, Encryption } from "@pvermeer/dexie-encrypted-addon";
import { Ref } from "@pvermeer/dexie-populate-addon";
import { Dexie } from "dexie";
import faker from "faker/locale/en";
import { addonSuite, Config } from "../../src/addon-suite";

type OmitMethods<T> = Pick<
  T,
  { [P in keyof T]: T[P] extends (...args: any[]) => any ? never : P }[keyof T]
>;

export class HairColor {
  id?: number;
  name: string;

  doSomething() {
    return "done";
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
    return "done";
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
    return "done";
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
    return "done";
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
    return "done";
  }

  constructor(group: OmitMethods<Group>) {
    Object.entries(group).forEach(([key, value]) => {
      this[key] = value;
    });
  }
}
export class Friend implements OnSerialize {
  id?: string;
  age: number;
  firstName: string;
  lastName: string;
  shoeSize: number;
  customId: number;
  date: Date;
  hasFriends: Ref<Friend, number>[];
  memberOf: Ref<Club, number>[];
  group: Ref<Group, number>;
  hairColor: Ref<HairColor, number>;

  doSomething() {
    return "done";
  }

  serialize() {
    const serialized = {
      id: () => this.id,
      age: () => this.age,
      firstName: () => this.firstName,
      lastName: () => this.lastName,
      shoeSize: () => this.shoeSize,
      customId: () => this.customId,
      date: () => this.date.getTime(),
      hasFriends: () => this.hasFriends,
      memberOf: () => this.memberOf,
      group: () => this.group,
      hairColor: () => this.hairColor,
    };
    return serialized;
  }

  deserialize(input: OmitMethods<Friend>) {
    Object.entries(input).forEach(([prop, value]) => (this[prop] = value));
    this.date = new Date(input.date);
  }

  constructor(friend: OmitMethods<Friend>) {
    this.deserialize(friend);
  }
}

export const getDatabase = (
  dexie: typeof Dexie,
  name: string,
  config?: Config & EncryptedOptions
) =>
  new (class TestDatabase extends dexie {
    public friends: Dexie.Table<Friend, string>;
    public clubs: Dexie.Table<Club, number>;
    public themes: Dexie.Table<Theme, number>;
    public groups: Dexie.Table<Group, number>;
    public styles: Dexie.Table<Style, number>;
    public hairColors: Dexie.Table<HairColor, number>;

    constructor(_name: string) {
      // Make sure test don't use the same name
      super(_name + " - " + faker.random.alphaNumeric(5));

      addonSuite(this, config);
      this.on("blocked", () => false);
      this.version(1).stores({
        friends:
          config?.secretKey || config?.encrypted?.secretKey
            ? "#id, &customId, $date, $firstName, lastName, shoeSize, age, hasFriends => friends.id, *memberOf => clubs.id, group => groups.id, &hairColor => hairColors.id, [id+group]"
            : "++id, &customId, date, firstName, lastName, shoeSize, age, hasFriends => friends.id, *memberOf => clubs.id, group => groups.id, &hairColor => hairColors.id, [id+group]",

        clubs: "++id, $name, theme => themes.id",
        themes: "++id, $name, style => styles.id",
        styles: "++id, $name, color",
        groups: "++id, $name",
        hairColors: "++id, $name",
      });

      this.friends.mapToClass(Friend);
      this.clubs.mapToClass(Club);
      this.themes.mapToClass(Theme);
      this.groups.mapToClass(Group);
      this.styles.mapToClass(Style);
      this.hairColors.mapToClass(HairColor);
    }
  })(name);

export const databasesPositive = [
  // Not testing with immutable false because this makes testing a living hell...
  {
    desc: "TestDatabase - all addons",
    immutable: true,
    encrypted: true,
    class: true,
    db: (dexie: typeof Dexie) =>
      getDatabase(dexie, (this as any)!.desc!, {
        secretKey: Encryption.createRandomEncryptionKey(),
      }),
  },
  {
    desc: "TestDatabase - populate / observable / immutable / class",
    encrypted: false,
    immutable: true,
    class: true,
    db: (dexie: typeof Dexie) => getDatabase(dexie, (this as any)!.desc!),
  },
];

let customId = 1000000;
export const mockFriends = (count = 5): Friend[] => {
  const friend = () =>
    new Friend({
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      age: faker.datatype.number({ min: 1, max: 80 }),
      shoeSize: faker.datatype.number({ min: 5, max: 12 }),
      customId,
      hasFriends: [],
      memberOf: [],
      group: null,
      hairColor: null,
      date: faker.date.recent(),
    });
  return new Array(count).fill(null).map(() => {
    const mockfriend = friend();
    customId++;
    return mockfriend;
  });
};
export const mockClubs = (count = 5): Club[] => {
  const club = () =>
    new Club({
      name: faker.lorem.words(2),
      size: faker.datatype.number(),
      theme: null,
      description: faker.lorem.sentences(4),
    });
  return new Array(count).fill(null).map(() => club());
};
export const mockThemes = (count = 5): Theme[] => {
  const theme = () =>
    new Theme({
      name: faker.lorem.words(2),
      style: null,
      description: faker.lorem.sentences(4),
    });
  return new Array(count).fill(null).map(() => theme());
};
export const mockGroups = (count = 5): Group[] => {
  const group = () =>
    new Group({
      name: faker.lorem.words(2),
      true: faker.datatype.boolean(),
      description: faker.lorem.sentences(4),
    });
  return new Array(count).fill(null).map(() => group());
};
export const mockStyles = (count = 5): Style[] => {
  const style = () =>
    new Style({
      name: faker.lorem.words(2),
      color: faker.random.word(),
      description: faker.lorem.sentences(4),
    });
  return new Array(count).fill(null).map(() => style());
};
export const mockHairColors = (count = 5): HairColor[] => {
  const hairColor = () =>
    new HairColor({
      name: faker.lorem.words(2),
    });
  return new Array(count).fill(null).map(() => hairColor());
};
