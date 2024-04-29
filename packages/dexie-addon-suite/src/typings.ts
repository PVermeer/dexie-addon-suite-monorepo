import { RelationalDbSchema } from "@pvermeer/dexie-populate-addon";
import {
  Dexie,
  Collection,
  DBCoreKeyRange,
  Table,
  TableSchema,
  Transaction,
  WhereClause,
} from "dexie";

export interface DexieExtended extends Dexie {
  Table: new <T, TKey, TInsertType>(
    name: string,
    tableSchema: TableSchema,
    optionalTrans?: Transaction
  ) => Table<T, TKey, TInsertType>;
  Collection: new <T, TKey, TInsertType>(
    whereClause?: WhereClause | null,
    keyRangeGenerator?: () => DBCoreKeyRange
  ) => Collection<T, TKey, TInsertType>;
  _relationalSchema: RelationalDbSchema;

  pVermeerAddonsRegistered?: { [addon: string]: boolean };
}
