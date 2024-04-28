import {
  Collection,
  DBCoreKeyRange,
  Dexie,
  Table,
  TableSchema,
  Transaction,
  WhereClause,
} from "dexie";

export interface DexieExtended extends Dexie {
  pVermeerAddonsRegistered?: { [addon: string]: boolean };

  Table: new <T, TKey, TInsertType>(
    name: string,
    tableSchema: TableSchema,
    optionalTrans?: Transaction
  ) => Table<T, TKey, TInsertType>;

  Collection: new <T, TKey, TInsertType>(
    whereClause: WhereClause | null,
    keyRangeGenerator?: () => DBCoreKeyRange
  ) => Collection<T, TKey, TInsertType>;

  WhereClause: new <T, TKey, TInsertType>(
    table: Table<T, TKey, TInsertType>,
    index?: string,
    orCollection?: Collection<T, TKey, TInsertType>
  ) => WhereClause<T, TKey, TInsertType>;
}
