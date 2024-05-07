import { Dexie, ObservabilitySet } from "dexie";
import { filter, fromEventPattern, share } from "rxjs";
import { getTableExtended } from "./table-extended.class";
import type { DexieExtended } from "./types";

export function dexieRxjs(db: Dexie) {
  // Register addon
  const dbExtended = db as DexieExtended;
  dbExtended.pVermeerAddonsRegistered = {
    ...dbExtended.pVermeerAddonsRegistered,
    rxjs: true,
  };

  // Extend the DB class
  Object.defineProperty(db, "changes$", {
    value: fromEventPattern<ObservabilitySet>(
      (handler) => Dexie.on("storagemutated", handler),
      (handler) => db.on("close", handler)
    ).pipe(
      filter((obsSet) => {
        return Object.keys(obsSet).some((key) => {
          const keyParts = key.split("/");
          const dbName = keyParts[2];

          if (dbName === db.name) {
            return true;
          }

          return false;
        });
      }),
      share({ resetOnComplete: true, resetOnRefCountZero: true })
    ),
  });

  // Extend the Table class.
  Object.defineProperty(db, "Table", {
    value: getTableExtended(db),
  });

  db.on("ready", async () => {
    // Do not allow any forward slashes in names
    // This can collide with ObservabilitySet
    if (db.name.includes("/")) {
      db.close();
      throw new Error(
        "DEXIE-RXJS-ADDON: Do not use '/' in the database name. This is not supported"
      );
    }
    db.tables.forEach((table) => {
      if (table.name.includes("/")) {
        db.close();
        throw new Error(
          "DEXIE-RXJS-ADDON: Do not use '/' in table names. This is not supported"
        );
      }
    });
    Object.values(db._dbSchema).forEach((schema) => {
      const indices = [
        ...schema.indexes.map((index) => index.name),
        schema.primKey.name,
      ];
      if (indices.some((index) => index.includes("/"))) {
        db.close();
        throw new Error(
          "DEXIE-RXJS-ADDON: Do not use '/' in index name. This is not supported"
        );
      }
    });
  });
}
