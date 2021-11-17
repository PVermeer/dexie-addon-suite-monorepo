import { Dexie, Table, WhereClause } from 'dexie';
import { ObservableCollection } from './observable-collection.class';
import { DexieExtended } from './types';

// Define the ObservableWhereClause class here so we can get the keys without circulair troubles in TS 4.
// Implement it in the class
interface ObservableWhereClauseI {
    Collection: any;
}

type WhereClauseRecord<T, TKey, U = Omit<WhereClause, keyof ObservableWhereClauseI>> = {
    [P in keyof U]: U[P] extends (...args: infer A) => any ?
    (...args: A) => ObservableCollection<T, TKey> : U[P]
};

// Cannot extend directly because Dexie does not export the classes, only interfaces
// So interface and mixin is used
export interface ObservableWhereClause<T, TKey> extends WhereClauseRecord<T, TKey> { }
export class ObservableWhereClause<T, TKey> implements ObservableWhereClauseI {

    get Collection() {
        const dbExt = this._db as DexieExtended;
        const table = this._table;
        // Hijack Collection class getter.
        return class Callable {
            constructor(...args: ConstructorParameters<typeof dbExt.Collection>) {
                const collection = new dbExt.Collection<T, TKey>(...args);
                return new ObservableCollection<T, TKey>(dbExt, table, collection);
            }
        };
    }

    constructor(
        protected _db: Dexie,
        protected _table: Table<T, TKey>,
        protected _whereClause: WhereClause<T, TKey>
    ) {

        // Mixin with WhereClause
        Object.keys(_whereClause).forEach(key => {
            if (key === 'constructor' || this[key] !== undefined) { return; }
            this[key] = _whereClause[key];
        });

        const prototype = Object.getPrototypeOf(_db.WhereClause.prototype);
        Object.getOwnPropertyNames(prototype).forEach(name => {
            if (this[name] !== undefined) { return; }
            Object.defineProperty(
                ObservableWhereClause.prototype,
                name,
                Object.getOwnPropertyDescriptor(prototype, name) as any
            );
        });

    }

}
