import { booleanNullIndex } from '@pvermeer/dexie-boolean-null-index-addon';
import { classMap } from '@pvermeer/dexie-class-addon';
import { encrypted, EncryptedOptions } from '@pvermeer/dexie-encrypted-addon';
import { immutable } from '@pvermeer/dexie-immutable-addon';
import { populate } from '@pvermeer/dexie-populate-addon';
import { dexieRxjs } from '@pvermeer/dexie-rxjs-addon';
import { Dexie } from 'dexie';
import { getPopulatedObservableTable } from './table-extended.class';
import { DexieExtended } from './typings';

export interface Config {
    encrypted?: EncryptedOptions;
    immutable?: boolean;
    class?: boolean;
    booleanNullIndex?: boolean;
}

export function addonSuite(db: Dexie, config?: Config | EncryptedOptions) {

    // Register addon
    const dbExtended = db as DexieExtended;
    dbExtended.pVermeerAddonsRegistered = {
        ...dbExtended.pVermeerAddonsRegistered,
        dexieAddonSuite: true
    };

    /** Default config */
    const addons: { [prop: string]: boolean; } & Record<keyof Config, boolean> = {
        immutable: true,
        encrypted: false,
        rxjs: true,
        populate: true,
        class: true,
        booleanNullIndex: false
    };
    let secretKey: string | undefined;

    // Process config
    if (config) {
        Object.entries(config as Config).forEach(([key, value]) => {
            if (typeof value === 'boolean' && key in addons) { addons[key] = value; }
            if (key === 'encrypted') {
                addons.encrypted = true;
                secretKey = value.secretKey;
                addons.immutable = value.immutable === false ? false : true;
            }
            if ('secretKey' in config) {
                addons.encrypted = true;
                secretKey = config.secretKey;
                addons.immutable = config.immutable === false ? false : true;
            }
        });
    }

    // Load addons
    Object.entries(addons).forEach(([key, value]) => {
        if (!value) { return; }
        loadAddon(key, db as DexieExtended, addons, secretKey);
    });

    // Overwrite Table to a populated observable table
    Object.defineProperty(db, 'Table', {
        value: getPopulatedObservableTable(db)
    });

}

export const loadAddon = (
    key: string,
    db: DexieExtended,
    addons: { [prop: string]: boolean; },
    secretKey: string | undefined
) => {

    if (db.pVermeerAddonsRegistered?.[key]) return;

    switch (key) {
        case 'immutable': immutable(db); break;
        case 'encrypted': encrypted(db, { immutable: addons.immutable, secretKey }); break;
        case 'rxjs': dexieRxjs(db); break;
        case 'populate': populate(db); break;
        case 'class': classMap(db); break;
        case 'booleanNullIndex': booleanNullIndex(db); break;
    }
};

addonSuite.setConfig = (config: Config | EncryptedOptions) => (db: Dexie) => addonSuite(db, config);
