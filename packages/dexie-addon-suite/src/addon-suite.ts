import { classMap } from '@pvermeer/dexie-class-addon';
import { encrypted, EncryptedOptions } from '@pvermeer/dexie-encrypted-addon';
import { immutable } from '@pvermeer/dexie-immutable-addon';
import { populate } from '@pvermeer/dexie-populate-addon';
import { dexieRxjs } from '@pvermeer/dexie-rxjs-addon';
import { Dexie } from 'dexie';
import { getPopulatedObservableTable } from './table-extended.class';

export interface Config {
    encrypted?: EncryptedOptions;
    immutable?: boolean;
    class?: boolean;
}

export function addonSuite(db: Dexie, config?: Config | EncryptedOptions) {

    /** Default config */
    const addons: { [prop: string]: boolean; } = {
        immutable: true,
        encrypted: false,
        rxjs: true,
        populate: true,
        class: true
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
        loadAddon(key, db, addons, secretKey);
    });

    // Overwrite Table to a populated observable table
    Object.defineProperty(db, 'Table', {
        value: getPopulatedObservableTable(db)
    });

}

export const loadAddon = (
    key: string,
    db: Dexie,
    addons: { [prop: string]: boolean; },
    secretKey: string | undefined
) => {
    switch (key) {
        case 'immutable': immutable(db); break;
        case 'encrypted': encrypted(db, { immutable: addons.immutable, secretKey }); break;
        case 'rxjs': dexieRxjs(db); break;
        case 'populate': populate(db); break;
        case 'class': classMap(db); break;
    }
};

addonSuite.setConfig = (config: Config | EncryptedOptions) => (db: Dexie) => addonSuite(db, config);
