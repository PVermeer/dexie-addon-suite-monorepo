import { immutable } from "@pvermeer/dexie-immutable-addon";
import { Dexie } from "dexie";
import { Encryption } from "./encryption.class";
import {
  decryptOnReading,
  encryptOnCreation,
  encryptOnUpdating,
} from "./hooks";
import { ModifiedKeysTable, SchemaParser } from "./schema-parser";

export interface StoreSchemas {
  [tableName: string]: string | null;
}

type DexieExtended = Dexie & {
  pVermeerAddonsRegistered?: { [addon: string]: boolean };
};

/**
 * @secretKey Your previously saved secret
 * @immutable Set to false to disable immutable state on document creation and updates
 */
export interface EncryptedOptions {
  secretKey: string;
  immutable?: boolean;
}

/**
 * Register addon on a Dexie database.
 *
 * *Example TypeScript:*
 * ```
 *  const secret = Encryption.createRandomEncryptionKey();
 *  const db = class FriendsDatabase extends Dexie {
 *      public friends: Dexie.Table<Friend, string>;
 *      constructor(name: string, secret?: string) {
 *          super(name);
 *          encrypted(this, { secretKey: secret });
 *          this.version(1).stores({
 *              friends: '#id, $name, $shoeSize, age'
 *          });
 *      }
 *  }
 *  await db.open()
 * ```
 *
 * *Example JavaScript:*
 * ```
 *  const secret = Encryption.createRandomEncryptionKey();
 *  const db = new Dexie('FriendsDatabase', {
 *      addons: [encrypted.setOptions({ secretKey: secret })]
 *  });
 *  db.version(1).stores({
 *      friends: '#id, $name, $shoeSize, age'
 *  });
 *  await db.open()
 * ```
 * @method setOptions(string) Set options and return the addon.
 * @param options Set secret key and / or immutable create methods.
 * @returns The secret key (provided or generated)
 */
export function encrypted(db: Dexie, options: EncryptedOptions) {
  // Register addon
  const dbExtended: DexieExtended = db;
  dbExtended.pVermeerAddonsRegistered = {
    ...dbExtended.pVermeerAddonsRegistered,
    encrypted: true,
  };

  // Disable auto open, developer must open the database manually.
  db.close();

  let secret: string | undefined;
  let useImmutable = true;

  if (options) {
    if (options.secretKey) {
      secret = options.secretKey;
    }
    if (options.immutable !== undefined) {
      useImmutable = options.immutable;
    }
  }

  if (useImmutable && !dbExtended.pVermeerAddonsRegistered.immutable) {
    immutable(db);
  }

  let encryptSchema: ModifiedKeysTable | undefined;

  if (!secret) {
    throw new Error("DEXIE ENCRYPT ADDON: Secret key is not provided");
  }
  const encryption = new Encryption(secret);

  // Get the encryption keys from the schema and return the function with a clean schema.
  (db.Version.prototype as any)._parseStoresSpec = Dexie.override(
    (db.Version.prototype as any)._parseStoresSpec,
    (origFunc) =>
      function (this: any, storesSpec: StoreSchemas, outSchema: any) {
        const parser = new SchemaParser(storesSpec);
        const encryptedKeys = parser.getEncryptedKeys();
        const cleanedSchema = parser.getCleanedSchema();

        encryptSchema = encryptedKeys;

        // Return the original function with cleaned schema.
        return origFunc.apply(this, [cleanedSchema, outSchema]);
      }
  );

  db.on("ready", () => {
    if (!encryptSchema || !Object.keys(encryptSchema).length) {
      console.warn("DEXIE ENCRYPT ADDON: No encryption keys are set");
    } else {
      // Set encryption on the tables via the read, create and update hook.
      Object.entries(encryptSchema).forEach(([table, keysObj]) => {
        const dexieTable = db.table(table);
        const originalReadHook = dexieTable.schema.readHook;

        const readHook = (obj: any) => {
          const transaction = Dexie.currentTransaction;

          const document = transaction?.raw
            ? obj
            : decryptOnReading(obj, keysObj, encryption);

          if (originalReadHook) return originalReadHook(document);
          return document;
        };
        if (dexieTable.schema.readHook)
          dexieTable.hook.reading.unsubscribe(dexieTable.schema.readHook);
        dexieTable.schema.readHook = readHook;
        dexieTable.hook("reading", readHook);

        dexieTable.hook("creating", (primaryKey, obj) => {
          const transaction = Dexie.currentTransaction;

          const document = transaction?.raw
            ? obj
            : encryptOnCreation(primaryKey, obj, keysObj, encryption);

          return document;
        });

        dexieTable.hook("updating", (changes, _primaryKey) => {
          const transaction = Dexie.currentTransaction;

          const document = transaction?.raw
            ? changes
            : encryptOnUpdating(changes, _primaryKey, keysObj, encryption);

          return document;
        });
      });
    }
  });

  return encryption.secret;
}

/**
 * Set options for Encryption addon.
 *
 * *Example*:
 *
 * ```
 *  Dexie.addons.push(encrypted({
 *      secrectKey: string;
 *      immutable: boolean;
 *  }))
 * ```
 */
encrypted.setOptions = (options: EncryptedOptions) => (db: Dexie) =>
  encrypted(db, options);
