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

export class ObservableCollection<T, TKey, TInsertType>
  implements CollectionMapObservable
{
  private cloneAsCollection(): Collection<T, TKey, TInsertType> {
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
    ...args: Parameters<Collection<T, TKey, TInsertType>["and"]>
  ) => ObservableCollection<T, TKey, TInsertType>;
  public distinct: (
    ...args: Parameters<Collection<T, TKey, TInsertType>["distinct"]>
  ) => ObservableCollection<T, TKey, TInsertType>;
  public filter: (
    ...args: Parameters<Collection<T, TKey, TInsertType>["filter"]>
  ) => ObservableCollection<T, TKey, TInsertType>;
  public limit: (
    ...args: Parameters<Collection<T, TKey, TInsertType>["limit"]>
  ) => ObservableCollection<T, TKey, TInsertType>;
  public offset: (
    ...args: Parameters<Collection<T, TKey>["offset"]>
  ) => ObservableCollection<T, TKey, TInsertType>;
  public reverse: (
    ...args: Parameters<Collection<T, TKey, TInsertType>["reverse"]>
  ) => ObservableCollection<T, TKey, TInsertType>;
  public until: (
    ...args: Parameters<Collection<T, TKey, TInsertType>["until"]>
  ) => ObservableCollection<T, TKey, TInsertType>;

  // Remap
  public or(
    ...args: Parameters<Collection<T, TKey, TInsertType>["or"]>
  ): ObservableWhereClause<T, TKey, TInsertType> {
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
    protected _table: Table<T, TKey, TInsertType>,
    public _collection: Collection<T, TKey, TInsertType>
  ) {
    // Mixin with Collection
    mixinClass(this, this._collection);
  }
}
