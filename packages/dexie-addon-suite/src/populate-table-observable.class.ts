import { Populated, PopulateOptions } from "@pvermeer/dexie-populate-addon";
import {
  ObservableCollection,
  ObservableTable,
  ObservableWhereClause,
} from "@pvermeer/dexie-rxjs-addon";
import { Dexie, Table } from "dexie";
import { Observable } from "rxjs";
import { PopulateObservableCollection } from "./populate-observable-collection.class";
import { PopulateObservableWhereClause } from "./populate-observable-where-clause.class";
import { populateObservable } from "./populate-observable.service";

/**
 * Extended ObservableTable class that overwrites the methods to return a populated observable.
 */
export class PopulateTableObservable<
  T,
  TKey,
  TInsertType,
  B extends boolean,
  K extends string,
  P = Populated<T, B, K>
> extends ObservableTable<P, TKey, TInsertType> {
  constructor(
    _db: Dexie,
    _table: Table<T, TKey, TInsertType>,
    _keys: K[] | undefined,
    _options: PopulateOptions<B> | undefined
  ) {
    super(_db, _table as any);

    // Override methods to return a populated observable
    Object.getOwnPropertyNames(ObservableTable.prototype).forEach((name) => {
      if (
        typeof super[name] !== "function" ||
        name === "constructor" ||
        name.startsWith("_")
      ) {
        return;
      }

      // Hijack method
      this[name] = (...args: any[]) => {
        const returnValue = super[name](...args);

        if (returnValue instanceof Observable) {
          return populateObservable(returnValue, _table, _keys, _options);
        }

        if (returnValue instanceof ObservableWhereClause) {
          const observableWhereClause = returnValue;
          return new PopulateObservableWhereClause(
            this._db,
            this._table,
            _keys,
            _options,
            observableWhereClause
          );
        }

        if (returnValue instanceof ObservableCollection) {
          const observableCollection = returnValue;
          return new PopulateObservableCollection(
            this._db,
            this._table,
            observableCollection._collection,
            _keys,
            _options
          );
        }

        return returnValue;
      };
    });
  }
}
