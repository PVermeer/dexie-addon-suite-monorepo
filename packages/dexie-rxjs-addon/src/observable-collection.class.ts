import { Collection, Dexie, IndexableTypeArray, Table } from 'dexie';
import { IDatabaseChange } from 'dexie-observable/api';
import cloneDeep from 'lodash.clonedeep';
import isEqual from 'lodash.isequal';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, mergeMap, share, shareReplay, startWith } from 'rxjs/operators';
import { ObservableWhereClause } from './observable-where-clause.class';
import { DexieExtended } from './types';

// Type check for when dexie would update the Collection interface
type CollectionMap = Omit<
    Record<keyof Collection, (...args: any[]) => any>,
    // Only to observe so omit:
    'each' | 'eachKey' | 'eachPrimaryKey' | 'eachUniqueKey' | 'clone' | 'raw' | 'delete' | 'modify'
>;

export class ObservableCollection<T, TKey> implements CollectionMap {

    private _ctx: { [prop: string]: any; };

    private _tableChanges$: Observable<IDatabaseChange[]> = this._db.changes$.pipe(
        filter(x => x.some(y => y.table === this._table.name)),
        debounceTime(50), // Only checking if there are any changes on the table so only trigger on last in debounce window
        startWith([]),
        share()
    );

    private cloneAsCollection(): Collection<T, TKey> {
        (this._collection as any)._ctx = this._ctx;
        const collection = cloneDeep(this._collection);
        return collection;
    }

    public toArray(): Observable<T[]> {
        const collection = this.cloneAsCollection();
        const _collection$ = this._tableChanges$.pipe(
            mergeMap(() => collection.toArray()),
            distinctUntilChanged((a, b) => isEqual(a, b)),
            shareReplay({ bufferSize: 1, refCount: true })
        );
        return _collection$;
    }

    public sortBy(keyPath: string): Observable<T[]> {
        const collection = this.cloneAsCollection();
        const sortBy$ = this._tableChanges$.pipe(
            mergeMap(() => collection.sortBy(keyPath)),
            distinctUntilChanged((a, b) => isEqual(a, b)),
            shareReplay({ bufferSize: 1, refCount: true })
        );
        return sortBy$;
    }

    public count(): Observable<number> {
        const collection = this.cloneAsCollection();
        const count$ = this._tableChanges$.pipe(
            mergeMap(() => collection.count()),
            distinctUntilChanged(),
            shareReplay({ bufferSize: 1, refCount: true })
        );
        return count$;
    }

    public first(): Observable<T | undefined> {
        const collection = this.cloneAsCollection();
        const first$ = this._tableChanges$.pipe(
            mergeMap(() => collection.first()),
            distinctUntilChanged((a, b) => isEqual(a, b)),
            shareReplay({ bufferSize: 1, refCount: true })
        );
        return first$;
    }

    public last(): Observable<T | undefined> {
        const collection = this.cloneAsCollection();
        const last$ = this._tableChanges$.pipe(
            mergeMap(() => collection.last()),
            distinctUntilChanged((a, b) => isEqual(a, b)),
            shareReplay({ bufferSize: 1, refCount: true })
        );
        return last$;
    }

    public keys(): Observable<IndexableTypeArray> {
        const collection = this.cloneAsCollection();
        const keys$ = this._tableChanges$.pipe(
            mergeMap(() => collection.keys()),
            distinctUntilChanged((a, b) => isEqual(a, b)),
            shareReplay({ bufferSize: 1, refCount: true })
        );
        return keys$;
    }

    public primaryKeys(): Observable<TKey[]> {
        const collection = this.cloneAsCollection();
        const primaryKeys$ = this._tableChanges$.pipe(
            mergeMap(() => collection.primaryKeys()),
            distinctUntilChanged((a, b) => isEqual(a, b)),
            shareReplay({ bufferSize: 1, refCount: true })
        );
        return primaryKeys$;
    }

    public uniqueKeys(): Observable<IndexableTypeArray> {
        const collection = this.cloneAsCollection();
        const uniqueKeys$ = this._tableChanges$.pipe(
            mergeMap(() => collection.uniqueKeys()),
            distinctUntilChanged((a, b) => isEqual(a, b)),
            shareReplay({ bufferSize: 1, refCount: true })
        );
        return uniqueKeys$;
    }

    // Can be exposed because returns `this`
    public and: (...args: Parameters<Collection['and']>) => ObservableCollection<T, TKey>;
    public distinct: (...args: Parameters<Collection['distinct']>) => ObservableCollection<T, TKey>;
    public filter: (...args: Parameters<Collection['filter']>) => ObservableCollection<T, TKey>;
    public limit: (...args: Parameters<Collection['limit']>) => ObservableCollection<T, TKey>;
    public offset: (...args: Parameters<Collection['offset']>) => ObservableCollection<T, TKey>;
    public reverse: (...args: Parameters<Collection['reverse']>) => ObservableCollection<T, TKey>;
    public until: (...args: Parameters<Collection['until']>) => ObservableCollection<T, TKey>;

    // Remap
    public or(...args: Parameters<Collection['or']>): ObservableWhereClause<T, TKey> {
        const collection = this.cloneAsCollection();
        const whereClause = new (this._db.WhereClause as DexieExtended['WhereClause'])(
            this._table,
            ...args,
            collection
        );
        return new ObservableWhereClause(this._db, this._table, whereClause);
    }


    constructor(
        protected _db: Dexie,
        protected _table: Table<T, TKey>,
        public _collection: Collection<T, TKey>,
    ) {
        // Mixin with Collection
        Object.keys(_collection).forEach(key => {
            if (key === 'constructor' || this[key] !== undefined) { return; }
            this[key] = _collection[key];
        });

        const prototype = Object.getPrototypeOf(_db.Collection.prototype);
        Object.getOwnPropertyNames(prototype).forEach(name => {
            if (this[name] !== undefined) { return; }
            Object.defineProperty(
                ObservableCollection.prototype,
                name,
                Object.getOwnPropertyDescriptor(prototype, name) as any
            );
        });
    }

}
