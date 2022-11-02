import { IndexableTypeExtended } from './types';

export { booleanNullIndex } from './boolean-null-index';
export type { IndexableTypeExtended };

declare module 'dexie' {

    /**
     * Extend Transaction interface
     */
    interface Transaction {
        raw?: boolean;
    }

    interface WhereClause<T = any, TKey = IndexableType> {
        anyOf(keys: ReadonlyArray<IndexableTypeExtended>): Collection<T, TKey>;
        anyOf(...keys: Array<IndexableTypeExtended>): Collection<T, TKey>;
        equals(key: IndexableTypeExtended): Collection<T, TKey>;
    }

}
