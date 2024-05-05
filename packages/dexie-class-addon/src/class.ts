import { Dexie, Table } from "dexie";
import { getTableExtended } from "./table-extended.class";

export type OmitMethods<T> = Pick<
  T,
  { [P in keyof T]: T[P] extends (...args: any[]) => any ? never : P }[keyof T]
>;

export type SerializeObject = { [prop: string]: unknown };

export interface OnSerialize {
  serialize(): Partial<SerializeObject>;
}

type DexieExtended = Dexie & {
  pVermeerAddonsRegistered?: { [addon: string]: boolean };
};

export function classMap(db: Dexie) {
  // Register addon
  // @ts-expect-error Dexie issue when extending
  const dbExtended: DexieExtended = db;
  dbExtended.pVermeerAddonsRegistered = {
    ...dbExtended.pVermeerAddonsRegistered,
    class: true,
  };

  function serialize<T = unknown>(item: T, table?: Table) {
    const transaction = Dexie.currentTransaction;
    if (transaction?.raw) return item;

    if (!(typeof item === "object" && !Array.isArray(item) && item !== null))
      return item;

    let itemState = item as Record<keyof any, unknown>;

    // Dexie supports key path updates. These are treated as raw updates.
    if (Object.keys(itemState).some((key) => key.includes(".")))
      return itemState;

    if (
      itemState["serialize"] &&
      typeof itemState["serialize"] === "function"
    ) {
      itemState = itemState.serialize();
    } else if (table) {
      // Check if a class is provided and if it has a serialize method. Table.update item has probably no serialize method.
      const constructor = table.schema.mappedClass;
      if (constructor && constructor === item.constructor) {
        const classInstance = Object.create(constructor.prototype);
        if (
          classInstance["serialize"] &&
          typeof classInstance["serialize"] === "function"
        ) {
          Object.assign(classInstance, item);
          itemState = classInstance["serialize"];
        }
      }
    }
    // Recursive for nested classes
    Object.entries(itemState).forEach(
      ([key, value]) => (itemState[key] = serialize(value))
    );

    if (!table) return itemState;

    // Delete primary key property if it's undefined
    const primaryKey = table.schema.primKey.name;
    if (primaryKey in itemState && itemState[primaryKey] === undefined) {
      delete itemState[primaryKey];
    }

    return itemState;
  }

  // Extend / override the Table class.
  Object.defineProperty(db, "Table", {
    value: getTableExtended(db),
  });

  // =============== Add =================
  db.Table.prototype.add = Dexie.override(
    db.Table.prototype.add,
    (origFunc: Dexie.Table<any, any>["add"]) =>
      function (this: Table, item, key?) {
        if (this.name.startsWith("_")) return origFunc.call(this, item, key);

        const itemState = serialize(item, this);
        return origFunc.call(this, itemState, key);
      } as typeof origFunc
  );

  db.Table.prototype.bulkAdd = Dexie.override(
    db.Table.prototype.bulkAdd,
    (origFunc: Dexie.Table<any, any>["bulkAdd"]) =>
      function (
        this: Table,
        items: Parameters<typeof origFunc>[0],
        key?: Parameters<typeof origFunc>[1]
      ) {
        if (this.name.startsWith("_")) return origFunc.call(this, items, key);

        const itemStates = items.map((item) => serialize(item, this));
        return origFunc.call(this, itemStates, key);
      } as typeof origFunc
  );
  // =============== Put =================
  db.Table.prototype.put = Dexie.override(
    db.Table.prototype.put,
    (origFunc: Dexie.Table<any, any>["put"]) =>
      function (this: Table, item, key?) {
        if (this.name.startsWith("_")) return origFunc.call(this, item, key);

        const itemState = serialize(item, this);

        return origFunc.call(this, itemState, key);
      } as typeof origFunc
  );

  db.Table.prototype.bulkPut = Dexie.override(
    db.Table.prototype.bulkPut,
    (origFunc: Dexie.Table<any, any>["bulkPut"]) =>
      function (
        this: Table,
        items: Parameters<typeof origFunc>[0],
        key?: Parameters<typeof origFunc>[1]
      ) {
        if (this.name.startsWith("_")) return origFunc.call(this, items, key);

        const itemStates = items.map((item) => serialize(item, this));

        return origFunc.call(this, itemStates, key);
      } as typeof origFunc
  );
  // =============== Update =================
  db.Table.prototype.update = Dexie.override(
    db.Table.prototype.update,
    (origFunc: Dexie.Table<unknown, any>["update"]) =>
      function (this: Table<unknown>, key, changes) {
        if (this.name.startsWith("_")) return origFunc.call(this, key, changes);

        const changesState = serialize(changes, this);

        return origFunc.call(this, key, changesState);
      } as typeof origFunc
  );
  db.Table.prototype.bulkUpdate = Dexie.override(
    db.Table.prototype.bulkUpdate,
    (origFunc: Dexie.Table<any, any>["bulkUpdate"]) =>
      function (this: Table, keysAndChanges: Parameters<typeof origFunc>[0]) {
        if (this.name.startsWith("_"))
          return origFunc.call(this, keysAndChanges);

        const itemStates = keysAndChanges.map((item) => ({
          key: item.key,
          changes: serialize(item.changes, this),
        }));

        return origFunc.call(this, itemStates);
      } as typeof origFunc
  );
}
