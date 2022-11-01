export { booleanNullIndex } from './boolean-null-index';

declare module 'dexie' {

    /**
     * Extend Transaction interface
     */
    interface Transaction {
        raw?: boolean;
    }

}
