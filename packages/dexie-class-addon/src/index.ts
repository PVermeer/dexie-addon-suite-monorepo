import { TableExtended } from "./table-extended.class";

export { classMap } from "./class";
export type { TableExtended } from "./table-extended.class";
export type { OnSerialize } from "./class";

declare module "dexie" {
  /**
   * Extended Table class with class methods
   */
  interface Table<T, TKey, TInsertType>
    extends TableExtended<T, TKey, TInsertType> {}

  /**
   * Extend Transaction interface
   */
  interface Transaction {
    raw?: boolean;
  }
}
