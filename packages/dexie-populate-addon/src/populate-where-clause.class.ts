import { Dexie, Table, WhereClause } from "dexie";
import { PopulatedCollection } from "./populate-collection.class";
import { DexieExtended, PopulateOptions } from "./types";
import { mixinClass } from "./_utils/utils";

// Define the PopulatedWhereClause class here so we can get the keys without circulair troubles in TS 4.
// Implement it in the class
interface PopulatedWhereClauseI {
  Collection: any;
}

type WhereClauseRecordPopulate<
  T,
  TKey,
  TInsertType,
  B extends boolean,
  K extends string,
  U = Omit<WhereClause, keyof PopulatedWhereClauseI>
> = {
  [P in keyof U]: U[P] extends (...args: infer A) => any
    ? (...args: A) => PopulatedCollection<T, TKey, TInsertType, B, K>
    : U[P];
};

// Cannot extend directly because Dexie does not export the classes, only interfaces
// So interface and mixin is used
export interface PopulatedWhereClause<
  T,
  TKey,
  TInsertType,
  B extends boolean,
  K extends string
> extends WhereClauseRecordPopulate<T, TKey, TInsertType, B, K> {}
export class PopulatedWhereClause<
  T,
  TKey,
  TInsertType,
  B extends boolean,
  K extends string
> implements PopulatedWhereClauseI
{
  get Collection() {
    const dbExt = this._db as DexieExtended;
    const table = this._table;
    const keys = this._keys;
    const options = this._options;
    // Hijack Collection class getter.
    return class Callable {
      constructor(...args: ConstructorParameters<typeof dbExt.Collection>) {
        const collection = new dbExt.Collection<T, TKey, TInsertType>(...args);
        return new PopulatedCollection<T, TKey, TInsertType, B, K>(
          dbExt,
          table,
          collection,
          keys,
          options
        );
      }
    };
  }

  constructor(
    protected _db: Dexie,
    protected _table: Table<T, TKey, TInsertType>,
    protected _whereClause: WhereClause<T, TKey, TInsertType>,
    protected _keys: K[] | undefined,
    protected _options: PopulateOptions<B> | undefined
  ) {
    // Mixin with WhereClause
    mixinClass(this, this._whereClause);
  }
}
