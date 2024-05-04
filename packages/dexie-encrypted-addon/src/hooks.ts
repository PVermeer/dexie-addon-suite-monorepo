import cloneDeep from "lodash.clonedeep";
import { Encryption } from "./encryption.class";
import { ModifiedKeys } from "./schema-parser";

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
  keysObj.keys.forEach((key) => {
    if (document[key] !== undefined)
      document[key] = encryption.encrypt(document[key]);
  });

  // Set the hash on the id
  if (docHash && keysObj.hashKey) {
    document[keysObj.hashKey] = docHash;
  }
}

export function encryptOnUpdating(
  changes: any,
  _primaryKey: any,
  keysObj: ModifiedKeys,
  encryption: Encryption
) {
  // Dont't create new hash on the primary key when updating.
  return Object.entries(changes).reduce((acc, [key, value]) => {
    if (keysObj.keys.some((x) => x === key)) {
      acc[key] = encryption.encrypt(value);
    }
    return acc;
  }, {});
}

export function decryptOnReading(
  document: any,
  keysObj: ModifiedKeys,
  encryption: Encryption
) {
  if (!document) {
    return document;
  }
  // Need to clone because of the new caching mechanism of dexie 4.
  // Currently there is no way to detect if we get a cached, and thus already encrypted document.
  // Cloning removes the internal reference and ensures the document is still encrypted.
  const clonedDocument = cloneDeep(document);

  keysObj.keys.forEach((key) => {
    if (clonedDocument[key] !== undefined) {
      clonedDocument[key] = encryption.decrypt(clonedDocument[key]);
    }
  });
  return clonedDocument;
}
