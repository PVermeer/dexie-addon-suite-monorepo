import { Collection, Dexie, IndexableTypeArray, Table } from "dexie";
import { IDatabaseChange } from "dexie-observable/api";
import cloneDeep from "lodash.clonedeep";
import { merge, Observable, OperatorFunction } from "rxjs";
import {
  debounceTime,
  filter,
  first,
  mergeMap,
  share,
  shareReplay,
  skip,
  startWith,
} from "rxjs/operators";
import { ObservableWhereClause } from "./observable-where-clause.class";
import { DexieExtended } from "./types";
import { distinctUntilChangedIsEqual, mixinClass } from "./utils";

// Type check for when dexie would update the Collection interface
type CollectionMapObservable = Omit<
  Record<keyof Collection, (...args: any[]) => any>,
  // Only to observe so omit:
  | "each"
  | "eachKey"
  | "eachPrimaryKey"
  | "eachUniqueKey"
  | "clone"
  | "raw"
  | "delete"
  | "modify"
>;

interface Options {
  debounceTime?: number;
}

// Custom pipe operator
function debounceTimeWhen<T>(value?: number): OperatorFunction<T, T> {
  return function (source: Observable<T>): Observable<T> {
    return value
      ? merge(source.pipe(first()), source.pipe(skip(1), debounceTime(value)))
      : source;
  };
}

export class ObservableCollection<T, TKey> implements CollectionMapObservable {
  private _tableChanges$: Observable<IDatabaseChange[]> =
    this._db.changes$.pipe(
      filter((x) => x.some((y) => y.table === this._table.name)),
      debounceTime(50), // Only checking if there are any changes on the table so only trigger on last in debounce window
      startWith([]),
      share()
    );

  private cloneAsCollection(): Collection<T, TKey> {
    (this._collection as any)._ctx = (this as any)._ctx;
    const collection = cloneDeep(this._collection);
    return collection;
  }

  public toArray(options?: Options): Observable<T[]> {
    const _collection$ = this._tableChanges$.pipe(
      debounceTimeWhen(options?.debounceTime),
      mergeMap(() => this.cloneAsCollection().toArray()),
      distinctUntilChangedIsEqual(),
      shareReplay({ bufferSize: 1, refCount: true })
    );
    return _collection$;
  }

  public sortBy(keyPath: string, options?: Options): Observable<T[]> {
    const sortBy$ = this._tableChanges$.pipe(
      debounceTimeWhen(options?.debounceTime),
      mergeMap(() => this.cloneAsCollection().sortBy(keyPath)),
      distinctUntilChangedIsEqual(),
      shareReplay({ bufferSize: 1, refCount: true })
    );
    return sortBy$;
  }

  public count(options?: Options): Observable<number> {
    const count$ = this._tableChanges$.pipe(
      debounceTimeWhen(options?.debounceTime),
      mergeMap(() => this.cloneAsCollection().count()),
      distinctUntilChangedIsEqual(),
      shareReplay({ bufferSize: 1, refCount: true })
    );
    return count$;
  }

  public first(options?: Options): Observable<T | undefined> {
    const first$ = this._tableChanges$.pipe(
      debounceTimeWhen(options?.debounceTime),
      mergeMap(() => this.cloneAsCollection().first()),
      distinctUntilChangedIsEqual(),
      shareReplay({ bufferSize: 1, refCount: true })
    );
    return first$;
  }

  public last(options?: Options): Observable<T | undefined> {
    const last$ = this._tableChanges$.pipe(
      debounceTimeWhen(options?.debounceTime),
      mergeMap(() => this.cloneAsCollection().last()),
      distinctUntilChangedIsEqual(),
      shareReplay({ bufferSize: 1, refCount: true })
    );
    return last$;
  }

  public keys(options?: Options): Observable<IndexableTypeArray> {
    const keys$ = this._tableChanges$.pipe(
      debounceTimeWhen(options?.debounceTime),
      mergeMap(() => this.cloneAsCollection().keys()),
      distinctUntilChangedIsEqual(),
      shareReplay({ bufferSize: 1, refCount: true })
    );
    return keys$;
  }

  public primaryKeys(options?: Options): Observable<TKey[]> {
    const primaryKeys$ = this._tableChanges$.pipe(
      debounceTimeWhen(options?.debounceTime),
      mergeMap(() => this.cloneAsCollection().primaryKeys()),
      distinctUntilChangedIsEqual(),
      shareReplay({ bufferSize: 1, refCount: true })
    );
    return primaryKeys$;
  }

  public uniqueKeys(options?: Options): Observable<IndexableTypeArray> {
    const uniqueKeys$ = this._tableChanges$.pipe(
      debounceTimeWhen(options?.debounceTime),
      mergeMap(() => this.cloneAsCollection().uniqueKeys()),
      distinctUntilChangedIsEqual(),
      shareReplay({ bufferSize: 1, refCount: true })
    );
    return uniqueKeys$;
  }

  // Can be exposed because returns `this`
  public and: (
    ...args: Parameters<Collection<T, TKey>["and"]>
  ) => ObservableCollection<T, TKey>;
  public distinct: (
    ...args: Parameters<Collection<T, TKey>["distinct"]>
  ) => ObservableCollection<T, TKey>;
  public filter: (
    ...args: Parameters<Collection<T, TKey>["filter"]>
  ) => ObservableCollection<T, TKey>;
  public limit: (
    ...args: Parameters<Collection<T, TKey>["limit"]>
  ) => ObservableCollection<T, TKey>;
  public offset: (
    ...args: Parameters<Collection<T, TKey>["offset"]>
  ) => ObservableCollection<T, TKey>;
  public reverse: (
    ...args: Parameters<Collection<T, TKey>["reverse"]>
  ) => ObservableCollection<T, TKey>;
  public until: (
    ...args: Parameters<Collection<T, TKey>["until"]>
  ) => ObservableCollection<T, TKey>;

  // Remap
  public or(
    ...args: Parameters<Collection<T, TKey>["or"]>
  ): ObservableWhereClause<T, TKey> {
    const collection = this.cloneAsCollection();
    const whereClause = new (this._db
      .WhereClause as DexieExtended["WhereClause"])(
      this._table,
      ...args,
      collection
    );
    return new ObservableWhereClause(this._db, this._table, whereClause);
  }

  constructor(
    protected _db: Dexie,
    protected _table: Table<T, TKey>,
    public _collection: Collection<T, TKey>
  ) {
    // Mixin with Collection
    mixinClass(this, this._collection);
  }
}
