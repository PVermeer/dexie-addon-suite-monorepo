import { Collection, DBCoreKeyRange, Dexie, Table, TableSchema, Transaction, WhereClause } from 'dexie';

export type OmitMethodsObservable<T> = Pick<T, { [P in keyof T]: T[P] extends (...args: any[]) => any ? never : P; }[keyof T]>;

export interface DexieExtended extends Dexie {

    pVermeerAddonsRegistered?: { [addon: string]: boolean; };

    Table: new <T, TKey>(name: string, tableSchema: TableSchema, optionalTrans?: Transaction) => Table<T, TKey>;

    Collection: new <T, TKey>(whereClause: WhereClause | null, keyRangeGenerator?: () => DBCoreKeyRange) => Collection<T, TKey>;

    WhereClause: new <T, TKey>(table: Table<T, TKey>, index?: string, orCollection?: Collection<T, TKey>) => WhereClause<T, TKey>;

}
