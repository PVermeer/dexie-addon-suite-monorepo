import {
  Collection,
  DBCoreKeyRange,
  Dexie,
  IndexableType,
  Table,
  TableSchema,
  Transaction,
  WhereClause,
} from "dexie";
import { RelationalDbSchema, StoreSchemas } from "./schema-parser.class";

export interface DexieExtended extends Dexie {
  pVermeerAddonsRegistered: { [addon: string]: boolean };
  _relationalSchema: RelationalDbSchema;
  _storesSpec: StoreSchemas;

  Table: new <T, TKey, TInsertType>(
    name: string,
    tableSchema: TableSchema,
    optionalTrans?: Transaction
  ) => Table<T, TKey, TInsertType>;

  Collection: new <T, TKey, TInsertType>(
    whereClause?: WhereClause | null,
    keyRangeGenerator?: () => DBCoreKeyRange
  ) => Collection<T, TKey, TInsertType>;

  WhereClause: new <T, TKey, TInsertType>(
    table: Table<T, TKey, TInsertType>,
    index?: string,
    orCollection?: Collection<T, TKey, TInsertType>
  ) => WhereClause<T, TKey, TInsertType>;
}

export interface PopulateOptions<B extends boolean = false> {
  shallow: B;
}

/**
 * Ref nominal type.
 * TS does not support nominal types. Fake implementation so the type system can match.
 * O = object type after populate;
 * K = key type before populate (see Dexie IndexableType).
 */
export declare type Ref<
  _O extends object,
  K extends IndexableType,
  _N = "Ref"
> = K | null;

/**
 * Overwrite the return type to the type as given in the Ref type after refs are populated.
 * T = object type;
 * B = boolean if shallow populate;
 * O = union type of object keys to populate or the string type to populate all.
 */
export type Populated<
  T,
  B extends boolean = false,
  K extends string = string
> = {
  // Check for nominal Ref on array properties:
  [P in keyof T]: T[P] extends Ref<infer O, infer _, infer R>[]
    ? R extends "Ref"
      ? // Check for partial population in array:
        P extends K
        ? B extends false
          ? (Populated<O> | null)[]
          : (O | null)[]
        : T[P]
      : T[P]
    : // Check for nominal Ref on properties:
    T[P] extends Ref<infer O, infer _, infer R>
    ? R extends "Ref"
      ? // Check for partial population:
        P extends K
        ? B extends false
          ? Populated<O> | null
          : O | null
        : T[P]
      : // Final use original type
        T[P]
    : T[P];
};
