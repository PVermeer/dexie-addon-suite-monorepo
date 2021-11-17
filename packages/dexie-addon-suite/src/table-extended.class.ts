import { Populated, PopulateOptions, PopulateTable, RelationalDbSchema } from '@pvermeer/dexie-populate-addon';
import { ObservableTable } from '@pvermeer/dexie-rxjs-addon';
import { Dexie, Table, TableSchema, Transaction } from 'dexie';
import { PopulateTableObservable } from './populate-table-observable.class';
import { DexieExtended } from './typings';

export class PopulatedTableObservable<T, TKey, B extends boolean, K extends string> extends PopulateTable<T, TKey, B, K> {

    public $: PopulateTableObservable<Populated<T, B, K>, TKey, B, K> = new PopulateTableObservable<Populated<T, B, K>, TKey, B, K>(
        this._db,
        this._table,
        this._keysOrOptions
    );

    constructor(
        _keysOrOptions: K[] | PopulateOptions<B> | undefined,
        _db: Dexie,
        _table: Table<T, TKey>,
        _relationalSchema: RelationalDbSchema
    ) {
        super(_keysOrOptions, _db, _table, _relationalSchema);
    }
}

export class ObservableTablePopulated<T, TKey> extends ObservableTable<T, TKey> {

    public populate<B extends boolean = false, K extends string = string>(keysOrOptions?: K[] | PopulateOptions<B>)
        : PopulateTableObservable<Populated<T, B, K>, TKey, B, K> {
        return new PopulateTableObservable<Populated<T, B, K>, TKey, B, K>(
            this._db,
            this._table,
            keysOrOptions
        );
    }

    constructor(
        _db: Dexie,
        _table: Table<T, TKey>
    ) {
        super(_db, _table);
    }
}

export interface PopulatedObservableTable<T, TKey> {
    $: ObservableTablePopulated<T, TKey>;
    populate<B extends boolean = false, K extends string = string>(
        keys: K[],
        options?: PopulateOptions<B>
    ): PopulatedTableObservable<T, TKey, B, K>;
    populate<B extends boolean = false>(options?: PopulateOptions<B>): PopulatedTableObservable<T, TKey, B, string>;
    populate<B extends boolean = false, K extends string = string>(
        keysOrOptions?: K[] | PopulateOptions<B>
    ): PopulatedTableObservable<T, TKey, B, K>;
}
/**
 * Class typing is set in the Dexie.Table interface in index.ts.
 * This will extend the Table interface of Dexie.
 */
export function getPopulatedObservableTable<T, TKey>(db: Dexie) {

    const TableClass = db.Table as DexieExtended['Table'];

    return class TableExt extends TableClass<T, TKey>  implements Table<T, TKey>{

        public $: ObservableTablePopulated<T, TKey> = new ObservableTablePopulated<T, TKey>(db, this);

        public populate<B extends boolean = false, K extends string = string>(
            keysOrOptions?: K[] | PopulateOptions<B>
        ): PopulatedTableObservable<T, TKey, B, K> {
            return new PopulatedTableObservable<T, TKey, B, K>(
                keysOrOptions,
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
