import { Dexie, TableSchema, Transaction } from "dexie";
import { ObservableTable } from "./observable-table.class";
import { DexieExtended } from "./types";

export interface TableExtended<T, TKey> {
  $: ObservableTable<T, TKey>;
}

export function getTableExtended<T, TKey>(db: Dexie) {
  const TableClass = db.Table as DexieExtended["Table"];

  return class TableExt
    extends TableClass<T, TKey>
    implements TableExtended<T, TKey>
  {
    constructor(
      _name: string,
      _tableSchema: TableSchema,
      _optionalTrans: Transaction | undefined
    ) {
      super(_name, _tableSchema, _optionalTrans);

      // Need any because of bundling issues with dexie-addon-suite retyping the $ property.
      const self = this as any;
      (this.$ as any) = new ObservableTable<T, TKey>(db, self) as any;
    }
  };
}
