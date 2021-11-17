import { Dexie, Collection, DBCoreKeyRange, Table, TableSchema, Transaction, WhereClause } from 'dexie';

export interface DexieExtended extends Dexie {

    pVermeerAddonsRegistered?: { [addon: string]: boolean; };

    Table: new <T, TKey>(name: string, tableSchema: TableSchema, optionalTrans?: Transaction) => Table<T, TKey>;

    Collection: new <T, TKey>(whereClause: WhereClause | null, keyRangeGenerator?: () => DBCoreKeyRange) => Collection<T, TKey>;

    WhereClause: new <T, TKey>(table: Table, index?: string, orCollection?: Collection) => WhereClause<T, TKey>;

}
