import { Collection, Dexie, IndexableTypeArray, Table } from "dexie";
import cloneDeep from "lodash.clonedeep";
import { PopulatedWhereClause } from "./populate-where-clause.class";
import { Populate } from "./populate.class";
import { DexieExtended, Populated, PopulateOptions } from "./types";
import { mixinClass } from "./_utils/utils";

// Type check for when dexie would update the Collection interface
type CollectionMapPopulated = Omit<
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

export class PopulatedCollection<
  T,
  TKey,
  TInsertType,
  B extends boolean,
  K extends string
> implements CollectionMapPopulated
{
  private cloneAsCollection(): Collection<T, TKey, TInsertType> {
    (this._collection as any)._ctx = (this as any)._ctx;
    const collection = cloneDeep(this._collection);
    return collection;
  }

  public async toArray(): Promise<Populated<T, B, K>[]> {
    const result = await this.cloneAsCollection().toArray();
    const populated = await Populate.populateResult(
      result,
      this._table,
      this._keys,
      this._options
    );
    return populated;
  }

  public async sortBy(keyPath: string): Promise<Populated<T, B, K>[]> {
    const result = await this.cloneAsCollection().sortBy(keyPath);
    const populated = await Populate.populateResult(
      result,
      this._table,
      this._keys,
      this._options
    );
    return populated;
  }

  public async count(): Promise<number> {
    return this.cloneAsCollection().count();
  }

  public async first(): Promise<Populated<T, B, K> | undefined> {
    const result = (await this.cloneAsCollection().first()) as T; // No idea why typecast is needed...
    const [populated] = await Populate.populateResult(
      result,
      this._table,
      this._keys,
      this._options
    );
    return populated;
  }

  public async last(): Promise<Populated<T, B, K> | undefined> {
    const result = (await this.cloneAsCollection().last()) as T; // No idea why typecast is needed...
    const [populated] = await Populate.populateResult(
      result,
      this._table,
      this._keys,
      this._options
    );
    return populated;
  }

  public async keys(): Promise<IndexableTypeArray> {
    return this.cloneAsCollection().keys();
  }

  public async primaryKeys(): Promise<TKey[]> {
    return this.cloneAsCollection().primaryKeys();
  }

  public uniqueKeys(): Promise<IndexableTypeArray> {
    return this.cloneAsCollection().uniqueKeys();
  }

  // Can be exposed because returns `this`
  public and: (
    ...args: Parameters<Collection<T, TKey, TInsertType>["and"]>
  ) => PopulatedCollection<T, TKey, TInsertType, B, K>;
  public distinct: (
    ...args: Parameters<Collection<T, TKey, TInsertType>["distinct"]>
  ) => PopulatedCollection<T, TKey, TInsertType, B, K>;
  public filter: (
    ...args: Parameters<Collection<T, TKey, TInsertType>["filter"]>
  ) => PopulatedCollection<T, TKey, TInsertType, B, K>;
  public limit: (
    ...args: Parameters<Collection<T, TKey, TInsertType>["limit"]>
  ) => PopulatedCollection<T, TKey, TInsertType, B, K>;
  public offset: (
    ...args: Parameters<Collection<T, TKey, TInsertType>["offset"]>
  ) => PopulatedCollection<T, TKey, TInsertType, B, K>;
  public reverse: (
    ...args: Parameters<Collection<T, TKey, TInsertType>["reverse"]>
  ) => PopulatedCollection<T, TKey, TInsertType, B, K>;
  public until: (
    ...args: Parameters<Collection<T, TKey, TInsertType>["until"]>
  ) => PopulatedCollection<T, TKey, TInsertType, B, K>;

  // Remap
  public or(
    ...args: Parameters<Collection<T, TKey, TInsertType>["or"]>
  ): PopulatedWhereClause<T, TKey, TInsertType, B, K> {
    const collection = this.cloneAsCollection();
    const whereClause = new (this._db
      .WhereClause as DexieExtended["WhereClause"])(
      this._table,
      ...args,
      collection
    );
    return new PopulatedWhereClause(
      this._db,
      this._table,
      whereClause,
      this._keys,
      this._options
    );
  }

  constructor(
    protected _db: Dexie,
    protected _table: Table<T, TKey, TInsertType>,
    public _collection: Collection<T, TKey, TInsertType>,
    protected _keys: K[] | undefined,
    protected _options: PopulateOptions<B> | undefined
  ) {
    // Mixin with Collection
    mixinClass(this, this._collection);
  }
}
