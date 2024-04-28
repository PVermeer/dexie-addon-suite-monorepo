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
    value: fromEventPattern<ObservabilitySet>((handler) =>
      Dexie.on("storagemutated", handler)
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
}
