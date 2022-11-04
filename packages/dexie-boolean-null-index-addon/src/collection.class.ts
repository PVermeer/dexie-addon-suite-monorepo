
import { Collection, DBCoreKeyRange, Dexie, IndexableType, IndexableTypeArray, PromiseExtended, ThenShortcut, WhereClause } from 'dexie';
import { DexieExtended } from './types';
import { mapBinaryToValues } from './utils';

export interface NullIndexCollection<T, TKey> extends Collection<T, TKey> { }

export function getCollectionExtended(db: Dexie) {

    const Collection = db.Collection as DexieExtended['Collection'];

    return class NullIndexCollection<T, TKey> extends Collection<T, TKey> {


        public override and(filter: (x: T) => boolean): Collection<T, TKey> {

            return super.and(value => {
                const mappedValue = mapBinaryToValues(value);
                return filter(mappedValue);
            });
        }

        public override eachKey(callback: (key: IndexableType, cursor: { key: IndexableType; primaryKey: TKey; }) => any)
            : PromiseExtended<void> {

            return super.eachKey((key, cursor) => {
                const mappedKey = mapBinaryToValues(key);
                const mappedCursor = mapBinaryToValues(cursor);
                return callback(mappedKey as IndexableType, mappedCursor as any);
            });
        }

        public override eachPrimaryKey(callback: (key: TKey, cursor: { key: IndexableType; primaryKey: TKey; }) => any)
            : PromiseExtended<void> {

            return super.eachPrimaryKey((key, cursor) => {
                const mappedKey = mapBinaryToValues(key);
                const mappedCursor = mapBinaryToValues(cursor);
                return callback(mappedKey, mappedCursor as any);
            });
        }

        public override eachUniqueKey(callback: (key: IndexableType, cursor: { key: IndexableType; primaryKey: TKey; }) => any)
            : PromiseExtended<void> {

            return super.eachUniqueKey((key, cursor) => {
                const mappedKey = mapBinaryToValues(key);
                const mappedCursor = mapBinaryToValues(cursor);
                return callback(mappedKey as IndexableType, mappedCursor as any);
            });
        }

        public override filter(filter: (x: T) => boolean): Collection<T, TKey> {

            return super.filter(value => {
                const mappedValue = mapBinaryToValues(value);
                return filter(mappedValue);
            });
        }

        public override keys<R>(thenShortcut?: ThenShortcut<IndexableTypeArray, R>)
            : PromiseExtended<R> | PromiseExtended<IndexableTypeArray> {

            if (thenShortcut) return super.keys(keys => {
                const mappedKeys = mapBinaryToValues(keys);
                return thenShortcut(mappedKeys as any);
            });
            return super.keys().then(keys => {
                const mappedKeys = mapBinaryToValues(keys);
                return mappedKeys as any;
            });
        }

        public override until(filter: (value: T) => boolean, includeStopEntry?: boolean): Collection<T, TKey> {

            return super.until(value => {
                const mappedValue = mapBinaryToValues(value);
                return filter(mappedValue);
            }, includeStopEntry);
        }


        constructor(
            whereClause: WhereClause | null,
            keyRangeGenerator?: () => DBCoreKeyRange
        ) {
            super(whereClause, keyRangeGenerator);
        }

    };
}
