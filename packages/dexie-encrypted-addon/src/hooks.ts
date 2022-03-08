import { Transaction } from 'dexie';
import { Encryption } from './encryption.class';
import { ModifiedKeys } from './schema-parser';

export function encryptOnCreation(
    primaryKey: any,
    document: any,
    keysObj: ModifiedKeys,
    encryption: Encryption
) {
    // Hash the document to the primary key so it can be compared for uniqness.
    let docHash: string | null = null;
    if (keysObj.hashKey && primaryKey === undefined) {
        docHash = Encryption.hash(document);
    }

    // Encrypted the selected keys
    keysObj.keys.forEach(key => {
        if (document[key] !== undefined) document[key] = encryption.encrypt(document[key]);
    });

    // Set the hash on the id
    if (docHash && keysObj.hashKey) { document[keysObj.hashKey] = docHash; }
}

export function encryptOnUpdating(
    changes: any,
    _primaryKey: any,
    keysObj: ModifiedKeys,
    encryption: Encryption
) {
    // Dont't create new hash on the primary key when updating.
    return Object.entries(changes).reduce((acc, [key, value]) => {
        if (keysObj.keys.some(x => x === key)) {
            acc[key] = encryption.encrypt(value);
        }
        return acc;
    }, {});
}

export function decryptOnReading(
    document: any,
    keysObj: ModifiedKeys,
    encryption: Encryption,
    transaction?: Transaction | null
) {
    if (!document || transaction?.disableEncryption) { return document; }
    keysObj.keys.forEach(key => {
        if (document[key] !== undefined) { document[key] = encryption.decrypt(document[key]); }
    });
    return document;
}
