import { immutable } from '@pvermeer/dexie-immutable-addon';
import { Dexie } from 'dexie';
import { mapStringToValueOnReading, mapToStringOnCreation, mapToStringOnUpdating } from './hooks';
import { getTableExtended } from './table.class';
import { DexieExtended } from './types';
import { getWhereClauseExtended } from './where-clause.class';

export function booleanNullIndex(db: Dexie): void {

    // Register addon
    const dbExtended = db as DexieExtended;
    dbExtended.pVermeerAddonsRegistered = {
        ...dbExtended.pVermeerAddonsRegistered,
        booleanNullIndex: true
    };

    // Disable auto open, developer must open the database manually.
    db.close();

    immutable(db);

    // Extend Dexie Classes
    Object.defineProperties(db, {
        Table: { value: getTableExtended(db) },
        WhereClause: { value: getWhereClauseExtended(db) },
        // Collection: { value: getCollectionExtended(db) }
    });

    db.on('ready', () => {

        db.tables.forEach(table => {

            const originalReadHook = table.schema.readHook;

            const readHook = (obj: any) => {
                const transaction = Dexie.currentTransaction;

                const document = transaction?.raw ?
                    obj :
                    mapStringToValueOnReading(obj);

                if (originalReadHook) return originalReadHook(document);
                return document;
            };

            if (table.schema.readHook) table.hook.reading.unsubscribe(table.schema.readHook);
            table.schema.readHook = readHook;
            table.hook('reading', readHook);

            table.hook('creating', (_primaryKey, obj) => {
                const transaction = Dexie.currentTransaction;
                if (transaction?.raw) return;

                // Must be assigned, changing reference breaks it
                Object.assign(obj, mapToStringOnCreation(obj));
            });

            table.hook('updating', (changes, _primaryKey) => {
                const transaction = Dexie.currentTransaction;
                if (transaction?.raw) return;

                const newChanges = mapToStringOnUpdating(changes as Record<string, unknown>);
                return newChanges;
            });
        });
    });
}
