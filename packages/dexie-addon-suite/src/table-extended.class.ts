import {
  PopulateOptions,
  PopulateTable,
  RelationalDbSchema,
} from "@pvermeer/dexie-populate-addon";
import { ObservableTable } from "@pvermeer/dexie-rxjs-addon";
import { Dexie, Table, TableSchema, Transaction } from "dexie";
import { PopulateTableObservable } from "./populate-table-observable.class";
import { DexieExtended } from "./typings";

export class PopulatedTableObservable<
  T,
  TKey,
  TInsertType,
  B extends boolean,
  K extends string
> extends PopulateTable<T, TKey, TInsertType, B, K> {
  public $: PopulateTableObservable<T, TKey, TInsertType, B, K> =
    new PopulateTableObservable<T, TKey, TInsertType, B, K>(
      this._db,
      this._table,
      this._keys,
      this._options
    );

  constructor(
    _keys: K[] | undefined,
    _options: PopulateOptions<B> | undefined,
    _db: Dexie,
    _table: Table<T, TKey, TInsertType>,
    _relationalSchema: RelationalDbSchema
  ) {
    super(_keys, _options, _db, _table, _relationalSchema);
  }
}

export class ObservableTablePopulated<
  T,
  TKey,
  TInsertType
> extends ObservableTable<T, TKey, TInsertType> {
  public populate<B extends boolean = false, K extends string = string>(
    keysOrOptions?: K[] | PopulateOptions<B>,
    options?: PopulateOptions<B>
  ): PopulateTableObservable<T, TKey, TInsertType, B, K> {
    const _keys = Array.isArray(keysOrOptions) ? keysOrOptions : undefined;
    const _options =
      options ||
      (keysOrOptions && "shallow" in keysOrOptions ? keysOrOptions : undefined);

    return new PopulateTableObservable<T, TKey, TInsertType, B, K>(
      this._db,
      this._table,
      _keys,
      _options
    );
  }

  constructor(_db: Dexie, _table: Table<T, TKey, TInsertType>) {
    super(_db, _table);
  }
}

export interface PopulatedObservableTable<T, TKey, TInsertType> {
  $: ObservableTablePopulated<T, TKey, TInsertType>;
  populate<B extends boolean = false, K extends string = string>(
    keysOrOptions?: K[] | PopulateOptions<B>,
    options?: PopulateOptions<B>
  ): PopulatedTableObservable<T, TKey, TInsertType, B, K>;
}
/**
 * Class typing is set in the Dexie.Table interface in index.ts.
 * This will extend the Table interface of Dexie.
 */
export function getPopulatedObservableTable<T, TKey, TInsertType>(db: Dexie) {
  const TableClass = db.Table as DexieExtended["Table"];

  return class TableExt
    extends TableClass<T, TKey, TInsertType>
    implements Table<T, TKey, TInsertType>
  {
    public $: ObservableTablePopulated<T, TKey, TInsertType> =
      new ObservableTablePopulated<T, TKey, TInsertType>(db, this);

    public populate<B extends boolean = false, K extends string = string>(
      keysOrOptions?: K[] | PopulateOptions<B>,
      options?: PopulateOptions<B>
    ): PopulatedTableObservable<T, TKey, TInsertType, B, K> {
      const _keys = Array.isArray(keysOrOptions) ? keysOrOptions : undefined;
      const _options =
        options ||
        (keysOrOptions && "shallow" in keysOrOptions
          ? keysOrOptions
          : undefined);
      return new PopulatedTableObservable<T, TKey, TInsertType, B, K>(
        _keys,
        _options,
        db,
        this,
        (this.db as DexieExtended)._relationalSchema
      );
    }

    /* istanbul ignore next */ // Some weird bug in istanbul coverage
    constructor(
      _name: string,
      _tableSchema: TableSchema,
      _optionalTrans?: Transaction
    ) {
      super(_name, _tableSchema, _optionalTrans);
    }
  };
}
