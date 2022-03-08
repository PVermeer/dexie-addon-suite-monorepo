import { TableExtended } from './table-extended.class';

export { classMap } from './class';
export type { TableExtended } from './table-extended.class';

declare module 'dexie' {

    /**
     * Extended Table class with class methods
     */
    interface Table<T, TKey> extends TableExtended { }

    /**
     * Extend Transaction interface
     */
    interface Transaction {
        getRaw?: boolean;
    }

}
