import { Dexie, TableSchema, Transaction } from 'dexie';
import { PopulateTable } from './populate-table.class';
import { DexieExtended, PopulateOptions } from './types';

export interface TableExtended<T, TKey> {
    /**
     * Use Table populate methods
     *
     * Uses Table.methods with populate options.
     */
    populate<B extends boolean = false, K extends string = string>(keys: K[], options?: PopulateOptions<B>): PopulateTable<T, TKey, B, K>;
    populate<B extends boolean = false>(options?: PopulateOptions<B>): PopulateTable<T, TKey, B, string>;
    populate<B extends boolean = false, K extends string = string>(keysOrOptions?: K[] | PopulateOptions<B>): PopulateTable<T, TKey, B, K>;
}

export function getTableExtended<T, TKey>(db: Dexie) {

    const dbExt = db as DexieExtended;
    const TableClass = dbExt.Table;

    return class TableExt extends TableClass<T, TKey> implements TableExtended<T, TKey> {

        public _relationalSchema = dbExt._relationalSchema;

        public populate<B extends boolean = false, K extends string = string>(
            keysOrOptions?: K[] | PopulateOptions<B>
        ): any {
            return new PopulateTable<T, TKey, B, K>(keysOrOptions, db, this as any, this._relationalSchema);
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
