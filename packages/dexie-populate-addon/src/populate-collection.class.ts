import { Collection, DBCoreKeyRange, Dexie, IndexableType, PromiseExtended, Table, ThenShortcut, WhereClause } from 'dexie';
import { Populate } from './populate.class';
import { RelationalDbSchema } from './schema-parser.class';
import { Populated, PopulateOptions } from './types';

// Interfaces to extend Dexie declarations. A lot of properties are not exposed :(
export interface WhereClauseExtended<T, TKey> {
    Collection: new (whereClause?: WhereClause<any, TKey> | null, keyRangeGenerator?: () => DBCoreKeyRange) => Collection<T, TKey>;
}

export interface CollectionPopulated<T, TKey, B extends boolean, K extends string> extends Collection<Populated<T, B, K>, TKey> { }

/**
 * Dexie.js is actively hiding classes and only exports interfaces
 * but extention is possible from the getter in the WhereClause.
 * From here the Collection class can be extended to override some methods
 * when table.populate() is called.
 */
export function getCollectionPopulated<T, TKey, B extends boolean, K extends string>(
    whereClause: WhereClause<Populated<T, B, K>, TKey> | null | undefined,
    keysOrOptions: string[] | PopulateOptions<B> | undefined,
    db: Dexie,
    table: Table<T, TKey>,
    relationalSchema: RelationalDbSchema
) {

    const whereClauseExt = whereClause as WhereClauseExtended<T, TKey>;
    const collection = whereClauseExt.Collection;

    /** New collection class where methods are overwritten to support population */
    return class CollectionPopulatedClass extends collection {

        public toArray<R>(
            thenShortcut: ThenShortcut<Populated<T, B, K>[], R> = (value: any) => value
        ): PromiseExtended<R> {

            // Not using async / await so PromiseExtended is returned
            return super.toArray()
                .then(results => {
                    const populatedClass = new Populate<T, TKey, B, K>(results, keysOrOptions, db, table, relationalSchema);
                    return populatedClass.populated;
                })
                .then(popResults => thenShortcut(popResults));
        }

        /**
         * @warning Potentially very slow.
         */
        public each(
            callback: (obj: T, cursor: { key: IndexableType; primaryKey: TKey; }) => any
        ): PromiseExtended<void> {
            const records: T[] = [];
            const cursors: { key: IndexableType; primaryKey: TKey; }[] = [];
            return super.each((x, y) => records.push(x) && cursors.push(y))
                .then(async () => {
                    const populatedClass = new Populate<T, TKey, B, K>(records, keysOrOptions, db, table, relationalSchema);
                    const recordsPop = await populatedClass.populated;
                    recordsPop.forEach((x, i) => callback(x, cursors[i]));
                    return;
                });
        }

        constructor(
            _whereClause?: WhereClause<Populated<T, B, K>, TKey> | null,
            _keyRangeGenerator?: (() => DBCoreKeyRange),
            _collection?: Collection<T, TKey>
        ) {
            super(_whereClause, _keyRangeGenerator);

            // Because original WhereClause is not on the collection class,
            // a new class can be created and then overwritten by the Collection props
            if (_collection) {
                Object.entries(_collection).forEach(([key, value]) => {
                    this[key] = value;
                });
            }
        }
    };

}
