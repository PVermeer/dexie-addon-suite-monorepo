import { Dexie, Collection, Table } from "dexie";
import { Observable } from "rxjs";
import { PopulateOptions } from "@pvermeer/dexie-populate-addon";
import { ObservableCollection } from "@pvermeer/dexie-rxjs-addon";
import { populateObservable } from "./populate-observable.service";

export class PopulateObservableCollection<
  T,
  TKey,
  B extends boolean,
  K extends string
> extends ObservableCollection<T, TKey> {
  constructor(
    _db: Dexie,
    _table: Table<T, TKey>,
    _collection: Collection<T, TKey>,
    keys: K[] | undefined,
    options: PopulateOptions<B> | undefined
  ) {
    super(_db, _table, _collection);

    // Override methods to return a populated observable
    Object.getOwnPropertyNames(ObservableCollection.prototype).forEach(
      (name) => {
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
            return populateObservable(returnValue, _table, keys, options);
          }

          return returnValue;
        };
      }
    );
  }
}
