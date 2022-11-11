import { TableExtended } from './table-extended.class';

export { dexieRxjs } from './dexie-rxjs';
export { ObservableCollection } from './observable-collection.class';
export { ObservableTable } from './observable-table.class';
export { ObservableWhereClause } from './observable-where-clause.class';
export type { TableExtended } from './table-extended.class';
export * from 'dexie-observable/api';

declare module 'dexie' {
    interface Database {
        /**
         * Get on('changes') from 'dexie-observable' as an RxJs observable and observe changes.
         * @link https://dexie.org/docs/Observable/Dexie.Observable
         */
        changes$: import('rxjs').Observable<(import('dexie-observable/api').IDatabaseChange[]) >;
    }
    interface Table<T, TKey> extends TableExtended<T, TKey> { }
}

declare module 'dexie-observable/api' {
    interface IUpdateChange {
        oldObj: any;
        obj: any;
    }

    interface IDeleteChange {
        oldObj: any;
    }
}
