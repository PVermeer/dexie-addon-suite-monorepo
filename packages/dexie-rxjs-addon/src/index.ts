import { TableExtended } from "./table-extended.class";

export { dexieRxjs } from "./dexie-rxjs";
export { ObservableCollection } from "./observable-collection.class";
export { ObservableTable } from "./observable-table.class";
export { ObservableWhereClause } from "./observable-where-clause.class";
export type { TableExtended } from "./table-extended.class";

declare module "dexie" {
  interface Dexie {
    /**
     * Get on('changes') from 'dexie-observable' as an RxJs observable and observe changes.
     * @link https://dexie.org/docs/Observable/Dexie.Observable
     */
    changes$: import("rxjs").Observable<ObservabilitySet>;
  }

  interface Table<T, TKey, TInsertType>
    extends TableExtended<T, TKey, TInsertType> {}
}
