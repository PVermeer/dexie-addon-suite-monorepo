import { Collection, Dexie, IndexableTypeArray, liveQuery, Table } from "dexie";
import cloneDeep from "lodash.clonedeep";
import { from, Observable } from "rxjs";
import { ObservableWhereClause } from "./observable-where-clause.class";
import { DexieExtended } from "./types";
import { mixinClass } from "./utils";

// Type check for when dexie would update the Collection interface
type CollectionMapObservable = Omit<
  Record<keyof Collection, (...args: any[]) => any>,
  // Only to observe so omit:
  | "db"
  | "each"
  | "eachKey"
  | "eachPrimaryKey"
  | "eachUniqueKey"
  | "clone"
  | "raw"
  | "delete"
  | "modify"
>;

export class ObservableCollection<T, TKey> implements CollectionMapObservable {
  private cloneAsCollection(): Collection<T, TKey> {
    (this._collection as any)._ctx = (this as any)._ctx;
    const collection = cloneDeep(this._collection);
    return collection;
  }

  public toArray(): Observable<T[]> {
    return from(liveQuery(() => this.cloneAsCollection().toArray()));
  }

  public sortBy(keyPath: string): Observable<T[]> {
    return from(liveQuery(() => this.cloneAsCollection().sortBy(keyPath)));
  }

  public count(): Observable<number> {
    return from(liveQuery(() => this.cloneAsCollection().count()));
  }

  public first(): Observable<T | undefined> {
    return from(liveQuery(() => this.cloneAsCollection().first()));
  }

  public last(): Observable<T | undefined> {
    return from(liveQuery(() => this.cloneAsCollection().last()));
  }

  public keys(): Observable<IndexableTypeArray> {
    return from(liveQuery(() => this.cloneAsCollection().keys()));
  }

  public primaryKeys(): Observable<TKey[]> {
    return from(liveQuery(() => this.cloneAsCollection().primaryKeys()));
  }

  public uniqueKeys(): Observable<IndexableTypeArray> {
    return from(liveQuery(() => this.cloneAsCollection().uniqueKeys()));
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
