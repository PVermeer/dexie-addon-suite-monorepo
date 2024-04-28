import { Dexie, Table, TableSchema, Transaction } from "dexie";

export interface DexieExtended extends Dexie {
  pVermeerAddonsRegistered: { [addon: string]: boolean };
  Table: new <T, TKey, TInsertType>(
    name: string,
    tableSchema: TableSchema,
    optionalTrans?: Transaction
  ) => Table<T, TKey, TInsertType>;
}
