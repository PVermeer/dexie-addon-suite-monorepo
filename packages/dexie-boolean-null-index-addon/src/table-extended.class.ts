import { Collection, Dexie, PromiseExtended, TableSchema, ThenShortcut, Transaction, WhereClause } from 'dexie';
import { DexieExtended } from './types';
import { mapValuesToBinary } from './utils';

export function getTableExtended(db: Dexie) {

    const Table = db.Table as DexieExtended['Table'];

    return class NullIndexTable<T, TKey> extends Table<T, TKey> {

        /* 
            get({ [keyPath]: any }) In Dexie is calling this.where().equals() internally so this might not be needed at all.
            Since not all where methods are implemented in this addon and it's uncertain for now, and future updates of Dexie,
            whether this is necessary, it's barely any overheid to do this anyways.
        */
        public override get<R>(
            keyOrEqualityCriterias: TKey | { [key: string]: any; },
            thenShortcut?: ThenShortcut<T | undefined, R>
        ): PromiseExtended<T | undefined | R> {

            const newIndexOrequalityCriterias = mapValuesToBinary(keyOrEqualityCriterias);

            if (thenShortcut) return super.get(newIndexOrequalityCriterias, thenShortcut);
            return super.get(newIndexOrequalityCriterias);
        }

        /* 
            where({ [keyPath]: any }) In Dexie is calling where().equals() internally so this might not be needed at all.
            Since not all where methods are implemented in this addon and it's uncertain for now, and future updates of Dexie,
            whether this is necessary, it's barely any overheid to do this anyways.
        */
        where(index: string | string[]): WhereClause<T, TKey>;
        where(equalityCriterias: { [key: string]: any; }): Collection<T, TKey>;
        public override where(
            indexOrequalityCriterias: string | string[] | { [key: string]: any; }
        ): WhereClause<T, TKey> | Collection<T, TKey> {

            const newIndexOrequalityCriterias = mapValuesToBinary(indexOrequalityCriterias);

            // No combined overload in Dexie, so strong typed
            return super.where(newIndexOrequalityCriterias as any) as WhereClause<T, TKey> | Collection<T, TKey>;
        }

        constructor(
            name: string,
            tableSchema: TableSchema,
            optionalTrans?: Transaction
        ) {
            super(name, tableSchema, optionalTrans);
        }

    };
}
