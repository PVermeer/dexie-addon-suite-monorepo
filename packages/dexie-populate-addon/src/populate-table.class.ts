import { Collection, Dexie, IndexableType, Table, WhereClause } from "dexie";
import { PopulatedCollection } from "./populate-collection.class";
import { PopulatedWhereClause } from "./populate-where-clause.class";
import { Populate } from "./populate.class";
import { RelationalDbSchema } from "./schema-parser.class";
import { DexieExtended, Populated, PopulateOptions } from "./types";
import { mixinClass } from "./_utils/utils";

// Type check for when dexie would update the Table interface
type TableMapPopulate = Omit<
  Record<keyof Table, (...args: any[]) => any>,
  // Only to get records so omit put methods:
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
  | "$"
  | "populate"
>;

export class PopulateTable<T, TKey, B extends boolean, K extends string>
  implements TableMapPopulate
{
  /**
   * Create an Populated Collection of this table.
   */
  public toCollection(): PopulatedCollection<T, TKey, B, K> {
    return new PopulatedCollection(
      this._db,
      this._table,
      this._table.toCollection(),
      this._keys,
      this._options
    );
  }

  public async toArray(): Promise<Populated<T, B, K>[]> {
    const result = await this._table.toArray();
    const populated = await Populate.populateResult(
      result,
      this._table,
      this._keys,
      this._options
    );
    return populated;
  }

  get(key: TKey): Promise<Populated<T, B, K> | undefined>;
  get(equalityCriterias: {
    [key: string]: any;
  }): Promise<Populated<T, B, K> | undefined>;
  get(
    keyOrequalityCriterias: TKey | { [key: string]: any }
  ): Promise<Populated<T, B, K> | undefined>;

  public async get(keyOrequalityCriterias: TKey | { [key: string]: any }) {
    const result = await this._table.get(keyOrequalityCriterias as any);
    const [populated] = await Populate.populateResult(
      result,
      this._table,
      this._keys,
      this._options
    );
    return populated;
  }

  where(index: string | string[]): PopulatedWhereClause<T, TKey, B, K>;
  where(equalityCriterias: {
    [key: string]: IndexableType;
  }): PopulatedCollection<T, TKey, B, K>;

  public where(
    indexOrequalityCriterias: string | string[] | { [key: string]: any }
  ): PopulatedWhereClause<T, TKey, B, K> | PopulatedCollection<T, TKey, B, K> {
    const CollectionExt = this._db.Collection as DexieExtended["Collection"];

    const whereClauseOrCollection = this._table
      // No combined overload in Dexie.js, so strong typed
      .where(indexOrequalityCriterias as any) as
      | WhereClause<T, TKey>
      | Collection<T, TKey>;

    // Check what's returned.
    if (whereClauseOrCollection instanceof CollectionExt) {
      const collection = whereClauseOrCollection;
      return new PopulatedCollection(
        this._db,
        this._table,
        collection,
        this._keys,
        this._options
      );
    } else {
      const whereClause = whereClauseOrCollection;
      return new PopulatedWhereClause(
        this._db,
        this._table,
        whereClause,
        this._keys,
        this._options
      );
    }
  }

  public orderBy(index: string | string[]): PopulatedCollection<T, TKey, B, K> {
    const collection = this._table.orderBy(
      Array.isArray(index) ? `[${index.join("+")}]` : index
    );
    const populatedCollection = new PopulatedCollection(
      this._db,
      this._table,
      collection,
      this._keys,
      this._options
    );
    return populatedCollection;
  }

  public async count(): Promise<number> {
    const count = this.toCollection().count();
    return count;
  }

  // Can be exposed because returns `this.toCollection()`
  public filter: (
    ...args: Parameters<Table<T, TKey>["filter"]>
  ) => PopulatedCollection<T, TKey, B, K>;
  public offset: (
    ...args: Parameters<Table<T, TKey>["offset"]>
  ) => PopulatedCollection<T, TKey, B, K>;
  public limit: (
    ...args: Parameters<Table<T, TKey>["limit"]>
  ) => PopulatedCollection<T, TKey, B, K>;
  public reverse: (
    ...args: Parameters<Table<T, TKey>["reverse"]>
  ) => PopulatedCollection<T, TKey, B, K>;

  constructor(
    protected _keys: K[] | undefined,
    protected _options: PopulateOptions<B> | undefined,
    protected _db: Dexie,
    protected _table: Table<T, TKey>,
    protected _relationalSchema: RelationalDbSchema
  ) {
    // Mixin with Table
    mixinClass(this, this._table);
  }
}
