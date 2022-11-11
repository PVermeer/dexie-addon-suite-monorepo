import { Collection, Dexie, IndexableType, Table, WhereClause } from 'dexie';
import { IDatabaseChange } from 'dexie-observable/api';
import isEqual from 'lodash.isequal';
import uniqWith from 'lodash.uniqwith';
import { Observable } from 'rxjs';
import { buffer, debounceTime, distinctUntilChanged, filter, map, mergeMap, share, shareReplay, startWith } from 'rxjs/operators';
import { ObservableCollection } from './observable-collection.class';
import { ObservableWhereClause } from './observable-where-clause.class';
import { DexieExtended } from './types';
import { mixinClass } from './utils';

// Type check for when dexie would update the Table interface
type TableMapObservable = Omit<
    Record<keyof Table, (...args: any[]) => any>,
    // Only to observe so omit:
    'db' | 'name' | 'schema' | 'hook' | 'core' | 'each' | 'mapToClass' | 'add' | 'update' | 'put' | 'delete' | 'clear' | 'bulkAdd' | 'bulkGet' | 'bulkPut' | 'bulkDelete' | '$' | 'populate'
>;

export class ObservableTable<T, TKey> implements TableMapObservable {

    private changes$ = this._db.changes$.pipe(
        map(x => x.filter(y => y.table === this._table.name)),
        filter(x => x.length > 0),
        share()
    );

    private _tableChanges$: Observable<IDatabaseChange[]> = this.changes$.pipe(
        debounceTime(50), // Only checking if there are any changes on the table so only trigger on last in debounce window
        startWith([]),
        share()
    );

    private _table$: Observable<T[]> = this._tableChanges$.pipe(
        mergeMap(() => this._table.toArray()),
        distinctUntilChanged(isEqual),
        shareReplay({ bufferSize: 1, refCount: true })
    );

    /**
     * Observable stream of table changes.
     * Emits updated value on changes.
     * @note Stays open so unsubscribe.
     */
    public changes(): Observable<IDatabaseChange[]> {
        return this.changes$.pipe(
            buffer(this.changes$.pipe(debounceTime(50))),
            map(changesBuffer => uniqWith(changesBuffer.flat(), isEqual)),
            share()
        );
    }

    /**
     * Create an Observable Collection of this table.
     */
    public toCollection(): ObservableCollection<T, TKey> {
        return new ObservableCollection(this._db, this._table, this._table.toCollection());
    }

    /**
     * Observable stream of the complete Table.
     * Emits updated Table array on changes.
     * @note Stays open so unsubscribe.
     */
    public toArray() { return this._table$; }

    /**
     * Observable stream of a get request.
     * Emits updated value on changes.
     * @note Stays open so unsubscribe.
     */
    get(key: TKey): Observable<T | undefined>;
    get(equalityCriterias: { [key: string]: any; }): Observable<T | undefined>;
    get(keyOrequalityCriterias: TKey | { [key: string]: any; }): Observable<T | undefined>;

    public get(keyOrequalityCriterias: TKey | { [key: string]: any; }) {

        return this._db.changes$.pipe(
            filter(x => x.some(y => y.table === this._table.name)),
            filter(x => {
                if (typeof keyOrequalityCriterias === 'object' && typeof keyOrequalityCriterias !== null) {

                    return Object.entries(keyOrequalityCriterias as any).some(([key, value]) =>
                        x.some(y => {
                            const obj = 'obj' in y ? y.obj : y.oldObj;
                            return obj[key] && obj[key] === value ? true :
                                y.key === value ? true : false;
                        })
                    );

                } else {
                    const primKey = keyOrequalityCriterias;
                    return x.some(y => primKey === y.key);
                }
            }),
            debounceTime(50),
            startWith(null),
            mergeMap(() => this._table.get(keyOrequalityCriterias as any)),
            distinctUntilChanged(isEqual),
            shareReplay({ bufferSize: 1, refCount: true })
        );
    }

    /**
     * Observable stream of a where query.
     * Emits updated values on changes, including new or updated records that are in range.
     * @return ObservableWhereClause that behaves like a normal Dexie where-clause or an ObservableCollection.
     * @note Stays open so unsubscribe.
     */
    where(index: string | string[]): ObservableWhereClause<T, TKey>;
    where(equalityCriterias: { [key: string]: IndexableType; }): ObservableCollection<T, TKey>;

    public where(
        indexOrequalityCriterias: string | string[] | { [key: string]: any; }
    ): ObservableWhereClause<T, TKey> | ObservableCollection<T, TKey> {

        const CollectionExt = this._db.Collection as DexieExtended['Collection'];

        const whereClauseOrCollection = this._table
            // No combined overload in Dexie.js, so strong typed
            .where(indexOrequalityCriterias as any) as WhereClause<T, TKey> | Collection<T, TKey>;

        // Check what's returned.
        if (whereClauseOrCollection instanceof CollectionExt) {

            const collection = whereClauseOrCollection;
            return new ObservableCollection(this._db, this._table, collection);

        } else {

            const whereClause = whereClauseOrCollection;
            return new ObservableWhereClause<T, TKey>(this._db, this._table, whereClause);

        }

    }

    /**
     * Observable stream of the complete Table orderd by indexed key.
     * Emits updated Table array on changes.
     * @note Stays open so unsubscribe.
     */
    public orderBy(index: string | string[]): ObservableCollection<T, TKey> {
        const collection = this._table.orderBy((Array.isArray(index) ? `[${index.join('+')}]` : index));
        const observableCollection = new ObservableCollection(this._db, this._table, collection);
        return observableCollection;
    }

    /**
     * Observable stream of the complete Table count.
     * Emits updated new number on changes.
     * @note Stays open so unsubscribe.
     */
    public count(): Observable<number> {
        const count$ = this.toCollection().count();
        return count$;
    }

    // Can be exposed because returns `this.toCollection()`
    public filter: (...args: Parameters<Table<T, TKey>['filter']>) => ObservableCollection<T, TKey>;
    public offset: (...args: Parameters<Table<T, TKey>['offset']>) => ObservableCollection<T, TKey>;
    public limit: (...args: Parameters<Table<T, TKey>['limit']>) => ObservableCollection<T, TKey>;
    public reverse: (...args: Parameters<Table<T, TKey>['reverse']>) => ObservableCollection<T, TKey>;


    constructor(
        protected _db: Dexie,
        protected _table: Table<T, TKey>
    ) {
        // Mixin with Table
        mixinClass(this, this._table);
    }

}
