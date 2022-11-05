import { IndexableTypeExtended, IndexableTypePartExtended } from './types';

export { booleanNullIndex } from './boolean-null-index';
export type { IndexableTypeExtended, IndexableTypePartExtended };

declare module 'dexie' {

    /**
     * Extend Transaction interface
     */
    interface Transaction {
        raw?: boolean;
    }

    interface WhereClause<T = any, TKey = IndexableType> {
        anyOf(keys: ReadonlyArray<IndexableTypeExtended | IndexableTypePartExtended[]>): Collection<T, TKey>;
        anyOf(...keys: Array<IndexableTypeExtended | IndexableTypePartExtended[]>): Collection<T, TKey>;
        equals(key: IndexableTypeExtended | IndexableTypePartExtended[]): Collection<T, TKey>;
        noneOf(keys: ReadonlyArray<IndexableTypeExtended>): Collection<T, TKey>;
        notEqual(key: IndexableTypeExtended): Collection<T, TKey>;
    }

    interface Collection<T = any, TKey = IndexableType> {
        eachKey(callback: (key: IndexableTypeExtended, cursor: { key: IndexableTypeExtended; primaryKey: TKey; }) => any): PromiseExtended<void>;
        eachPrimaryKey(callback: (key: TKey, cursor: { key: IndexableTypeExtended; primaryKey: TKey; }) => any): PromiseExtended<void>;
        eachUniqueKey(callback: (key: IndexableTypeExtended, cursor: { key: IndexableTypeExtended; primaryKey: TKey; }) => any): PromiseExtended<void>;
        keys(): PromiseExtended<IndexableTypePartExtended[]>;
        keys<R>(thenShortcut: ThenShortcut<IndexableTypePartExtended[], R>): PromiseExtended<R>;
        uniqueKeys(): PromiseExtended<IndexableTypePartExtended[]>;
        uniqueKeys<R>(thenShortcut: ThenShortcut<IndexableTypePartExtended[], R>): PromiseExtended<R>;
    }

}
