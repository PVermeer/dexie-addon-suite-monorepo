import {
  Collection,
  Dexie,
  IndexableType,
  liveQuery,
  Table,
  WhereClause,
} from "dexie";
import { from, Observable } from "rxjs";
import { ObservableCollection } from "./observable-collection.class";
import { ObservableWhereClause } from "./observable-where-clause.class";
import { DexieExtended } from "./types";
import { mixinClass } from "./utils";

// Type check for when dexie would update the Table interface
type TableMapObservable = Omit<
  Record<keyof Table, (...args: any[]) => any>,
  // Only to observe so omit:
  | "db"
  | "name"
  | "schema"
  | "hook"
  | "core"
  | "each"
  | "mapToClass"
  | "add"
  | "update"
  | "put"
  | "delete"
  | "clear"
  | "bulkAdd"
  | "bulkGet"
  | "bulkPut"
  | "bulkDelete"
  | "bulkUpdate"
  | "$"
  | "populate"
>;

export class ObservableTable<T, TKey, TInsertType>
  implements TableMapObservable
{
  /**
   * Create an Observable Collection of this table.
   */
  public toCollection(): ObservableCollection<T, TKey, TInsertType> {
    return new ObservableCollection(
      this._db,
      this._table,
      this._table.toCollection()
    );
  }

  /**
   * liveQuery() observable from dexie.
   * @note Stays open so unsubscribe.
   */
  public toArray(): Observable<T[]> {
    return from(liveQuery(() => this._table.toArray()));
  }

  /**
   * liveQuery() observable from dexie.
   * @note Stays open so unsubscribe.
   */
  get(key: TKey): Observable<T | undefined>;
  get(equalityCriterias: { [key: string]: any }): Observable<T | undefined>;
  get(
    keyOrequalityCriterias: TKey | { [key: string]: any }
  ): Observable<T | undefined>;

  public get(
    keyOrequalityCriterias: TKey | { [key: string]: any }
  ): Observable<T | undefined> {
    return from(
      liveQuery(() => this._table.get(keyOrequalityCriterias as any))
    );
  }

  /**
   * liveQuery() observable from dexie.
   * @return ObservableWhereClause.
   * @note Stays open so unsubscribe.
   */
  where(index: string | string[]): ObservableWhereClause<T, TKey, TInsertType>;
  where(equalityCriterias: {
    [key: string]: IndexableType;
  }): ObservableCollection<T, TKey, TInsertType>;

  public where(
    indexOrequalityCriterias: string | string[] | { [key: string]: any }
  ):
    | ObservableWhereClause<T, TKey, TInsertType>
    | ObservableCollection<T, TKey, TInsertType> {
    const CollectionExt = this._db.Collection as DexieExtended["Collection"];

    const whereClauseOrCollection = this._table
      // No combined overload in Dexie.js, so strong typed
      .where(indexOrequalityCriterias as any) as
      | WhereClause<T, TKey, TInsertType>
      | Collection<T, TKey, TInsertType>;

    // Check what's returned.
    if (whereClauseOrCollection instanceof CollectionExt) {
      const collection = whereClauseOrCollection;
      return new ObservableCollection(this._db, this._table, collection);
    } else {
      const whereClause = whereClauseOrCollection;
      return new ObservableWhereClause<T, TKey, TInsertType>(
        this._db,
        this._table,
        whereClause
      );
    }
  }

  /**
   * liveQuery() observable from dexie.
   * @return ObservableCollection.
   * @note Stays open so unsubscribe.
   */
  public orderBy(
    index: string | string[]
  ): ObservableCollection<T, TKey, TInsertType> {
    const collection = this._table.orderBy(
      Array.isArray(index) ? `[${index.join("+")}]` : index
    );
    const observableCollection = new ObservableCollection(
      this._db,
      this._table,
      collection
    );
    return observableCollection;
  }

  /**
   * liveQuery() observable from dexie.
   * @note Stays open so unsubscribe.
   */
  public count(): Observable<number> {
    return this.toCollection().count();
  }

  // Can be exposed because returns `this.toCollection()`
  public filter: (
    ...args: Parameters<Table<T, TKey, TInsertType>["filter"]>
  ) => ObservableCollection<T, TKey, TInsertType>;
  public offset: (
    ...args: Parameters<Table<T, TKey, TInsertType>["offset"]>
  ) => ObservableCollection<T, TKey, TInsertType>;
  public limit: (
    ...args: Parameters<Table<T, TKey, TInsertType>["limit"]>
  ) => ObservableCollection<T, TKey, TInsertType>;
  public reverse: (
    ...args: Parameters<Table<T, TKey, TInsertType>["reverse"]>
  ) => ObservableCollection<T, TKey, TInsertType>;

  constructor(
    protected _db: Dexie,
    protected _table: Table<T, TKey, TInsertType>
  ) {
    // Mixin with Table
    mixinClass(this, this._table);
  }
}
