import { TableExtended } from "./table-extended.class";

export { populate } from "./populate";
export { PopulateTable } from "./populate-table.class";
export { Populate } from "./populate.class";
export type { PopulateTree } from "./populate.class";
export type { RelationalDbSchema } from "./schema-parser.class";
export type { TableExtended } from "./table-extended.class";
export type { Populated, PopulateOptions, Ref } from "./types";

declare module "dexie" {
  /**
   * Extended Table class with populate methods
   */
  interface Table<T, TKey> extends TableExtended<T, TKey> {}
}
