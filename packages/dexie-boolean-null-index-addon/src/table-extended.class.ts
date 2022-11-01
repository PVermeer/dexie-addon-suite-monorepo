import { Dexie, PromiseExtended, TableSchema, ThenShortcut, Transaction } from 'dexie';
import { DexieExtended } from './types';
import { mapValuesToString } from './utils';

export function getTableExtended(db: Dexie) {

    const Table = db.Table as DexieExtended['Table'];

    return class NullIndexTable<T, TKey> extends Table<T, TKey> {

        public override get<R>(
            keyOrEqualityCriterias: TKey | { [key: string]: any; },
            thenShortcut?: ThenShortcut<T | undefined, R>
        ): PromiseExtended<T | undefined | R> {

            const newIndexOrequalityCriterias = mapValuesToString(keyOrEqualityCriterias);

            if (thenShortcut) return super.get(newIndexOrequalityCriterias, thenShortcut);
            return super.get(newIndexOrequalityCriterias);
        }

        // where(index: string | string[]): WhereClause<T, TKey>;
        // where(equalityCriterias: { [key: string]: any; }): Collection<T, TKey>;
        // public override where(
        //     indexOrequalityCriterias: string | string[] | { [key: string]: any; }
        // ): WhereClause<T, TKey> | Collection<T, TKey> {

        //     const newIndexOrequalityCriterias = mapToNullStringIndexOrequalityCriterias(indexOrequalityCriterias, nullStringValue);

        //     // No combined overload in Dexie, so strong typed
        //     return super.where(newIndexOrequalityCriterias as any) as WhereClause<T, TKey> | Collection<T, TKey>;
        // }

        constructor(
            name: string,
            tableSchema: TableSchema,
            optionalTrans?: Transaction
        ) {
            super(name, tableSchema, optionalTrans);
        }

    };
}
