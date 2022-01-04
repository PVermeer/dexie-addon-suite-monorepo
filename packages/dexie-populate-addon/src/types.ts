import { Collection, DBCoreKeyRange, Dexie, IndexableType, Table, TableSchema, Transaction, WhereClause } from 'dexie';
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

/**
 * Ref nominal type.
 * TS does not support nominal types. Fake implementation so the type system can match.
 * O = object type after populate;
 * K = key type before populate (see Dexie IndexableType).
 */
export type Ref<O extends object, K extends IndexableType, _N = 'Ref'> = NominalT<O> | K;

/**
 * Overwrite the return type to the type as given in the Ref type after refs are populated.
 * T = object type;
 * B = boolean if shallow populate;
 * O = union type of object keys to populate or the string type to populate all.
 */
export type Populated<T, B extends boolean, O extends string> = {

    // Check for nominal Ref on properties:
    [P in keyof T]: T[P] extends Ref<infer X, infer Y, infer N> ?
    N extends 'Ref' ?

    // Check for partial population:
    P extends O ?

    // Overwrite the properties where ref is found:
    RecursivePopulate<B, X, O>

    // Else use index type
    : Y extends any[] ? Y : Y | null

    // Final use original type
    : T[P] : T[P]
};

type NominalRef<T, R extends string = 'Ref'> = Nominal<T, R>;
type NominalT<T> = T extends any[] ? { [P in keyof T]: NominalRef<T[P]> } : NominalRef<T> | null;

type RecursivePopulate<B extends boolean, X, O extends string> =
    // Check if shallow is true:
    B extends true ?

    X extends any[] ? { [K in keyof X]: X[K] | null } : X | null
    :
    X extends any[] ? { [K in keyof X]: Populated<X[K] | null, B, O> | null } : Populated<X | null, B, O>;
