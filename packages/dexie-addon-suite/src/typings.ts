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
  Table: new <T, TKey>(
    name: string,
    tableSchema: TableSchema,
    optionalTrans?: Transaction
  ) => Table<T, TKey>;
  Collection: new <T, TKey>(
    whereClause?: WhereClause | null,
    keyRangeGenerator?: () => DBCoreKeyRange
  ) => Collection<T, TKey>;
  _relationalSchema: RelationalDbSchema;

  pVermeerAddonsRegistered?: { [addon: string]: boolean };
}
