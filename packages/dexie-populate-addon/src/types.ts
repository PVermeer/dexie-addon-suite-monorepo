import { Collection, DBCoreKeyRange, Dexie, Table, TableSchema, Transaction, WhereClause } from 'dexie';
import type { Nominal } from 'simplytyped';
import { RelationalDbSchema, StoreSchemas } from './schema-parser.class';

export interface DexieExtended extends Dexie {
    pVermeerAddonsRegistered: { [addon: string]: boolean; };
    _relationalSchema: RelationalDbSchema;
    _storesSpec: StoreSchemas;
    Table: new <T, TKey>(name: string, tableSchema: TableSchema, optionalTrans?: Transaction) => Table<T, TKey>;
    Collection: new <T, TKey>(whereClause?: WhereClause | null, keyRangeGenerator?: () => DBCoreKeyRange) => Collection<T, TKey>;
}

export interface PopulateOptions<B extends boolean = false> {
    shallow: B;
}

type IndexTypes = string | number | Date;
type NominalRef<T, R extends string = 'Ref'> = Nominal<T, R>;

/**
 * Ref nominal type.
 * TS does not support nominal types. Fake implementation so the type system can match.
 * O = object type after populate;
 * K = key type before populate (see Dexie IndexableType).
 */
export declare type Ref<O extends object, K extends IndexTypes, _N = "Ref"> = NominalRef<O> | K | null;

/**
 * Overwrite the return type to the type as given in the Ref type after refs are populated.
 * T = object type;
 * B = boolean if shallow populate;
 * O = union type of object keys to populate or the string type to populate all.
 */
export type Populated<T, B extends boolean = false, O extends string = string> = {

    // Check for nominal Ref on properties:
    [P in keyof T]: T[P] extends Ref<infer X, infer _, infer N>[] ? N extends 'Ref' ?

    // Check for partial population in array:
    P extends O ? B extends false ? (Populated<X, B, O> | null)[] : (X | null)[] : T[P] : T[P]

    : T[P] extends Ref<infer X, infer _, infer N> ? N extends 'Ref' ?

    // Check for partial population:
    P extends O ? B extends false ? Populated<X> | null : X | null : T[P]

    // Final use original type
    : T[P] : T[P]
};
