import { Dexie, TableSchema, Transaction } from "dexie";
import { PopulateTable } from "./populate-table.class";
import { DexieExtended, PopulateOptions } from "./types";

export interface TableExtended<T, TKey, TInsertType = T> {
  /**
   * Use Table populate methods
   *
   * Uses Table.methods with populate options.
   */
  populate<B extends boolean = false, K extends string = string>(
    keysOrOptions?: K[] | PopulateOptions<B>,
    options?: PopulateOptions<B>
  ): PopulateTable<T, TKey, TInsertType, B, K>;
}

export function getTableExtended<T, TKey, TInsertType>(db: Dexie) {
  const dbExt = db as DexieExtended;
  const TableClass = dbExt.Table;

  return class TableExt
    extends TableClass<T, TKey, TInsertType>
    implements TableExtended<T, TKey, TInsertType>
  {
    public _relationalSchema = dbExt._relationalSchema;

    public populate<B extends boolean = false, K extends string = string>(
      keysOrOptions?: K[] | PopulateOptions<B>,
      options?: PopulateOptions<B>
    ): any {
      const _keys = Array.isArray(keysOrOptions) ? keysOrOptions : undefined;
      const _options =
        options ||
        (keysOrOptions && "shallow" in keysOrOptions
          ? keysOrOptions
          : undefined);
      return new PopulateTable<T, TKey, TInsertType, B, K>(
        _keys,
        _options,
        db,
        this as any,
        this._relationalSchema
      );
    }

    constructor(
      _name: string,
      _tableSchema: TableSchema,
      _optionalTrans?: Transaction
    ) {
      super(_name, _tableSchema, _optionalTrans);
    }
  };
}
