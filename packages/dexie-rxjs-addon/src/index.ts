import { IDatabaseChange } from "dexie-observable/api";
import { TableExtended } from "./table-extended.class";

export { DatabaseChangeType } from "dexie-observable/api";
export type {
  ICreateChange,
  IDatabaseChange,
  IDeleteChange,
  IUpdateChange,
} from "dexie-observable/api";
export { dexieRxjs } from "./dexie-rxjs";
export { ObservableCollection } from "./observable-collection.class";
export { ObservableTable } from "./observable-table.class";
export { ObservableWhereClause } from "./observable-where-clause.class";
export type { TableExtended } from "./table-extended.class";

declare module "dexie" {
  interface Database {
    /**
     * Get on('changes') from 'dexie-observable' as an RxJs observable and observe changes.
     * @link https://dexie.org/docs/Observable/Dexie.Observable
     */
    changes$: import("rxjs").Observable<IDatabaseChange[]>;
  }
  interface Table<T, TKey> extends TableExtended<T, TKey> {}
}

declare module "dexie-observable/api" {
  interface IUpdateChange {
    oldObj: any;
    obj: any;
  }

  interface IDeleteChange {
    oldObj: any;
  }
}
