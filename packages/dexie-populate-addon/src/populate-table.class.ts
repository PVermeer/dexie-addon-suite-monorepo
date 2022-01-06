import { Collection, Dexie, IndexableType, PromiseExtended, Table, ThenShortcut, WhereClause } from 'dexie';
import { CollectionPopulated, getCollectionPopulated } from './populate-collection.class';
import { Populate } from './populate.class';
import { RelationalDbSchema } from './schema-parser.class';
import { DexieExtended, Populated, PopulateOptions } from './types';

export class PopulateTable<T, TKey, B extends boolean, K extends string> {

    get(key: TKey): PromiseExtended<Populated<T, B, K> | undefined>;
    get<R>(key: TKey, thenShortcut: ThenShortcut<Populated<T, B, K> | undefined, R>): PromiseExtended<R>;
    get(equalityCriterias: { [key: string]: IndexableType; }): PromiseExtended<Populated<T, B, K> | undefined>;
    get<R>(
        equalityCriterias: { [key: string]: IndexableType; },
        thenShortcut: ThenShortcut<Populated<T, B, K> | undefined, R>
    ): PromiseExtended<R>;

    public get<R>(
        keyOrequalityCriterias: TKey | { [key: string]: IndexableType; },
        thenShortcut: ThenShortcut<Populated<T, B, K> | undefined, R> = (value: any) => value
    ): PromiseExtended<R | undefined> {

        // Not using async / await so PromiseExtended is returned
        return this._table.get(keyOrequalityCriterias)
            .then(result => {
                const populatedClass = new Populate<T, TKey, B, K>(
                    result,
                    this._keysOrOptions,
                    this._db, this._table,
                    this._relationalSchema
                );
                return populatedClass.populated;
            })
            .then(popResults => popResults[0])
            .then(popResult => thenShortcut(popResult));
    }

    toArray(): PromiseExtended<Populated<T, B, K>[]>;
    toArray<R>(
        thenShortcut: ThenShortcut<Populated<T, B, K>[] | undefined, R>
    ): PromiseExtended<R>;

    public toArray<R>(
        thenShortcut: ThenShortcut<Populated<T, B, K>[] | undefined, R> = (value: any) => value
    ): PromiseExtended<R> {
        return this._table.toArray()
            .then(result => {
                const populatedClass = new Populate<T, TKey, B, K>(
                    result,
                    this._keysOrOptions,
                    this._db,
                    this._table,
                    this._relationalSchema
                );
                return populatedClass.populated;
            })
            .then(popResult => thenShortcut(popResult));
    }


    where(index: string | string[]): WhereClause<Populated<T, B, K>, TKey>;
    where(equalityCriterias: { [key: string]: IndexableType; }): CollectionPopulated<T, TKey, B, K>;

    public where(
        indexOrequalityCriterias: string | string[] | { [key: string]: any; }
    ) {

        const dbExt = this._db as DexieExtended;
        let whereClause: WhereClause<Populated<T, B, K>, TKey> | undefined;
        let collection: Collection<T, TKey> | undefined;

        const whereClauseOrCollection = this._table
            // No combined overload in Dexie so strong typed
            .where(indexOrequalityCriterias as any) as unknown as WhereClause<Populated<T, B, K>, TKey> | Collection<T, TKey>;

        /*
        Check what's returned.
        Alltough typings of Dexie.js says otherwise,
        a Collection class cannot be constructed without a WhereClause
        */
        if (whereClauseOrCollection instanceof dbExt.Collection) {
            collection = whereClauseOrCollection;
            whereClause = this._table.where('') as unknown as WhereClause<Populated<T, B, K>, TKey>;
        } else {
            whereClause = whereClauseOrCollection;
        }

        const CollectionPopulatedClass = getCollectionPopulated<T, TKey, B, K>(
            whereClause,
            this._keysOrOptions,
            this._db,
            this._table,
            this._relationalSchema
        );

        if (collection) {
            const collectionPop = new CollectionPopulatedClass(whereClause, undefined, collection);
            return collectionPop;
        }

        // Override the Collection getter to return the new class
        Object.defineProperty(whereClause, 'Collection', {
            get(this) { return CollectionPopulatedClass; }
        });

        return whereClause;

    }

    public orderBy(index: string | string[]): CollectionPopulated<T, TKey, B, K> {
        const collection = this._table.orderBy(Array.isArray(index) ? `[${index.join('+')}]` : index);
        const whereClause = this._table.where('') as unknown as WhereClause<Populated<T, B, K>, TKey>;
        const CollectionPopulatedClass = getCollectionPopulated<T, TKey, B, K>(
            whereClause,
            this._keysOrOptions,
            this._db,
            this._table,
            this._relationalSchema
        );
        const collectionPop = new CollectionPopulatedClass(whereClause, undefined, collection) as CollectionPopulated<T, TKey, B, K>;
        return collectionPop;
    }

    /**
     * @warning Potentially very slow.
     */
    public each(
        callback: (obj: Populated<T, B, K>, cursor: { key: IndexableType; primaryKey: TKey; }) => any
    ): PromiseExtended<void> {
        const records: T[] = [];
        const cursors: { key: IndexableType; primaryKey: TKey; }[] = [];
        return this._table.each((x, y) => records.push(x) && cursors.push(y))
            .then(async () => {
                const populatedClass = new Populate<T, TKey, B, K>(
                    records,
                    this._keysOrOptions,
                    this._db,
                    this._table,
                    this._relationalSchema
                );
                const recordsPop = await populatedClass.populated;
                recordsPop.forEach((x, i) => callback(x, cursors[i]));
                return;
            });
    }

    constructor(
        protected _keysOrOptions: K[] | PopulateOptions<B> | undefined,
        protected _db: Dexie,
        protected _table: Table<T, TKey>,
        protected _relationalSchema: RelationalDbSchema
    ) { }

}
