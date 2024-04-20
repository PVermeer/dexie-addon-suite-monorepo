import { TableExtended } from "./table-extended.class";

export { dexieRxjs } from "./dexie-rxjs";
export { ObservableCollection } from "./observable-collection.class";
export { ObservableTable } from "./observable-table.class";
export { ObservableWhereClause } from "./observable-where-clause.class";
export type { TableExtended } from "./table-extended.class";

declare module "dexie" {
  interface Table<T, TKey> extends TableExtended<T, TKey> {}
}
