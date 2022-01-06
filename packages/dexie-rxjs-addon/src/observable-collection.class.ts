import { Dexie, Collection, Table } from 'dexie';
import isEqual from 'lodash.isequal';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, mergeMap, shareReplay, startWith } from 'rxjs/operators';

export class ObservableCollection<T, TKey> {

    private _collection$: Observable<T[]> = this._db.changes$.pipe(
        filter(x => x.some(y => y.table === this._table.name)),
        debounceTime(50),
        startWith([]),
        mergeMap(() => this._collection.toArray()),
        distinctUntilChanged(isEqual),
        shareReplay({ bufferSize: 1, refCount: true })
    );

    /**
     * Get an array of the query results.
     * @note For now RxJs operators can be used to achieve the same functionality of Dexie.Collection.
     */
    public toArray() { return this._collection$; }

    constructor(
        protected _db: Dexie,
        protected _table: Table<T, TKey>,
        public _collection: Collection<T, TKey>
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
