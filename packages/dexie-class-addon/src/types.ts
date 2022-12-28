import { Dexie, Table, TableSchema, Transaction } from "dexie";

export interface DexieExtended extends Dexie {
  pVermeerAddonsRegistered: { [addon: string]: boolean };
  Table: new <T, TKey>(
    name: string,
    tableSchema: TableSchema,
    optionalTrans?: Transaction
  ) => Table<T, TKey>;
}
