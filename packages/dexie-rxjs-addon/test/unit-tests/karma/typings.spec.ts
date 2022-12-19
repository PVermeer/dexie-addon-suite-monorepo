import { Dexie, Table } from "dexie";
import { dexieRxjs } from "../../../src";

interface Friend {
  id?: number;
  testProp?: string;
  age: number;
  hasAge?: boolean;
  firstName: string;
  lastName: string;
  shoeSize: number;
  customId: number;
  some?: { id: number };

  someMethod: () => void;
}

export const typings = async () => {
  const db = new (class TestDatabase extends Dexie {
    public friends: Table<Friend, number>;
    constructor(name: string) {
      super(name);
      dexieRxjs(this);
      this.on("blocked", () => false);
      this.version(1).stores({
        friends:
          "++id, customId, firstName, lastName, shoeSize, age, [age+shoeSize]",
      });
    }
  })("TestDatabase");

  await db.open();
  expect(db.isOpen()).toBeTrue();
  // Just some type matching, should not error in IDE / compilation or test

  const friend = await db.friends.get(1);
  friend!.someMethod();

  // Table

  db.friends.$.get(12);
  // @ts-expect-error
  db.friends.$.get("id");
  db.friends.$.get({ firstName: "someName" });
  db.friends.$.get({ nonExistent: "what" });
  db.friends.$.get({ someMethod: "fiets" });

  db.friends.$.where("id");
  db.friends.$.where(":id");
  db.friends.$.where(["id", "age"]);
  db.friends.$.where({ firstName: "name" });
  db.friends.$.where({ nonExistent: "what" });
  db.friends.$.where({ someMethod: "name" });

  db.friends.$.orderBy("id");
  db.friends.$.orderBy(":id");
  db.friends.$.orderBy(["id", "age"]);

  // Collection

  db.friends.$.toCollection().sortBy("id");
  db.friends.$.toCollection().sortBy(":id");

  await db.delete();
};
