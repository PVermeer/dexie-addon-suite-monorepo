import { TableExtended } from "./table-extended.class";

export { dexieRxjs } from "./dexie-rxjs";
export { ObservableCollection } from "./observable-collection.class";
export { ObservableTable } from "./observable-table.class";
export { ObservableWhereClause } from "./observable-where-clause.class";
export type { TableExtended } from "./table-extended.class";

declare module "dexie" {
  interface Dexie {
    /**
     * Get on('storagemutated') from 'Dexie' as an RxJs observable and observe changes in this database.
     * @link https://dexie.org/docs/Dexie/Dexie.on.storagemutated
     */
    changes$: import("rxjs").Observable<ObservabilitySet>;
  }

  interface Table<T, TKey, TInsertType>
    extends TableExtended<T, TKey, TInsertType> {}
}
