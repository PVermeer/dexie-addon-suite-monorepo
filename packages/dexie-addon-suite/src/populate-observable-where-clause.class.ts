import { PopulateOptions } from "@pvermeer/dexie-populate-addon";
import { ObservableWhereClause } from "@pvermeer/dexie-rxjs-addon";
import { Dexie, Table } from "dexie";
import { PopulateObservableCollection } from "./populate-observable-collection.class";
import { DexieExtended } from "./typings";

export { ObservableWhereClause };

export class PopulateObservableWhereClause<
  T,
  TKey,
  B extends boolean,
  K extends string
> extends ObservableWhereClause<T, TKey> {
  get Collection() {
    const dbExt = this._db as DexieExtended;
    const table = this._table;
    const keys = this.keys;
    const options = this.options;

    // Hijack Collection class getter.
    return class Callable {
      constructor(...args: ConstructorParameters<typeof dbExt.Collection>) {
        const collection = new dbExt.Collection<T, TKey>(...args);
        return new PopulateObservableCollection(
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
    _db: Dexie,
    _table: Table<T, TKey>,
    protected keys: K[] | undefined,
    protected options: PopulateOptions<B> | undefined,
    _observableWhereClause: ObservableWhereClause<T, TKey>
  ) {
    super(_db, _table, (_observableWhereClause as any)._whereClause);
  }
}
