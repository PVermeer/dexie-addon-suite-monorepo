import { Dexie } from 'dexie';
import { SchemaParser, StoreSchemas } from './schema-parser.class';
import { getTableExtended } from './table-extended.class';
import { DexieExtended } from './types';

export function populate(db: Dexie) {

    const dbExt = db as DexieExtended;

    // Register addon
    dbExt.pVermeerAddonsRegistered = {
        ...dbExt.pVermeerAddonsRegistered,
        populate: true
    };

    // Get the relational keys from the schema and return the function with a clean schema.
    (db.Version.prototype as any)._parseStoresSpec = Dexie.override(
        (db.Version.prototype as any)._parseStoresSpec,
        (origFunc) =>

            function (this: any, storesSpec: StoreSchemas, outSchema: any) {
                const parser = new SchemaParser(storesSpec);
                const relationalKeys = parser.getRelationalKeys();
                const cleanedSchema = parser.getCleanedSchema();

                dbExt._relationalSchema = relationalKeys;
                dbExt._storesSpec = storesSpec;

                // Return the original function with cleaned schema.
                return origFunc.apply(this, [cleanedSchema, outSchema]);
            });

    // Extend the Table class.
    Object.defineProperty(db, 'Table', {
        value: getTableExtended(db)
    });

    db.on('ready', () => {

        if (!dbExt._relationalSchema || !Object.keys(dbExt._relationalSchema).length) {
            console.warn('DEXIE POPULATE ADDON: No relational keys are set');
        }

        if (Object.values(dbExt._relationalSchema).some(table => Object.values(table).some(x => !db[x.targetTable]))) {
            throw new Error('DEXIE POPULATE ADDON: Relation schema does not match the db tables, now closing database');
        }

    });

}
