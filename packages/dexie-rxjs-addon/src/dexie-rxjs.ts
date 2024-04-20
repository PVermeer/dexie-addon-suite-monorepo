import type { Dexie } from "dexie";
import { getTableExtended } from "./table-extended.class";
import type { DexieExtended } from "./types";

export function dexieRxjs(db: Dexie) {
  // Register addon
  const dbExtended = db as DexieExtended;
  dbExtended.pVermeerAddonsRegistered = {
    ...dbExtended.pVermeerAddonsRegistered,
    rxjs: true,
  };

  // Extend the Table class.
  Object.defineProperty(db, "Table", {
    value: getTableExtended(db),
  });
}
