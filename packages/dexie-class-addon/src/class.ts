import { Dexie, Table } from "dexie";
import { SerializeObject, Serializer } from "./serialize";
import { getTableExtended } from "./table-extended.class";

type DexieExtended = Dexie & {
  pVermeerAddonsRegistered?: { [addon: string]: boolean };
};

export function classMap(db: Dexie) {
  // Register addon
  const dbExtended: DexieExtended = db;
  dbExtended.pVermeerAddonsRegistered = {
    ...dbExtended.pVermeerAddonsRegistered,
    class: true,
  };

  function serialize(table: Table, item: { [prop: string]: any }) {
    let itemState = item;
    if (
      !(
        typeof itemState === "object" &&
        !Array.isArray(itemState) &&
        itemState !== null
      )
    )
      return itemState;

    const transaction = Dexie.currentTransaction;
    if (transaction?.raw) return itemState;

    // Dexie supports key path updates. These are treated as raw updates.
    if (Object.keys(itemState).some((key) => key.includes(".")))
      return itemState;

    if (item["serialize"] && typeof item["serialize"] === "function") {
      itemState = { ...new Serializer(item.serialize()) };
    } else {
      // Check if a class is provided and if it has a serialize method. Table.update item has probably no serialize method.
      const constructor = table.schema.mappedClass;
      if (constructor) {
        const classInstance = Object.create(constructor.prototype);
        if (
          classInstance["serialize"] &&
          typeof classInstance["serialize"] === "function"
        ) {
          Object.assign(classInstance, item);
          const serializeObject: SerializeObject = classInstance["serialize"]();
          itemState = { ...new Serializer(serializeObject, Object.keys(item)) };
        }
      }
    }

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

        const itemState = serialize(this, item);
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

        const itemStates = items.map((item) => serialize(this, item));
        return origFunc.call(this, itemStates, key);
      } as typeof origFunc
  );
  // =============== Put =================
  db.Table.prototype.put = Dexie.override(
    db.Table.prototype.put,
    (origFunc: Dexie.Table<any, any>["put"]) =>
      function (this: Table, item, key?) {
        if (this.name.startsWith("_")) return origFunc.call(this, item, key);

        const itemState = serialize(this, item);
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

        const itemStates = items.map((item) => serialize(this, item));
        return origFunc.call(this, itemStates, key);
      } as typeof origFunc
  );
  // =============== Update =================
  db.Table.prototype.update = Dexie.override(
    db.Table.prototype.update,
    (origFunc: Dexie.Table<any, any>["update"]) =>
      function (this: Table, key, changes) {
        if (this.name.startsWith("_")) return origFunc.call(this, key, changes);

        const changesState = serialize(this, changes);
        return origFunc.call(this, key, changesState);
      } as typeof origFunc
  );
}
