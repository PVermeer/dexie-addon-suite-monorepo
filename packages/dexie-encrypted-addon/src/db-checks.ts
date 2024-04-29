import { Dexie, Table } from "dexie";
import { EncryptionError, KeyError } from "./errors";
import { ModifiedKeysTable } from "./schema-parser";

interface EncryptedTestDoc {
  id: "DexieEcryptedTestDoc";
  value: "This should be readable";
}

// Function because immutable-addon does not apply to internal Tables (startsWith("_"))
export const DexieEncryptedTestDoc: () => EncryptedTestDoc = () => ({
  id: "DexieEcryptedTestDoc",
  value: "This should be readable",
});

export const DbCheckTable = {
  name: "__dexie-encrypted-addon__",
  keyString: "id, $value",
} as const;

function isValidSchema(schema: ModifiedKeysTable): boolean {
  return (
    !schema ||
    !Object.keys(schema).filter((table) => table !== DbCheckTable.name).length
  );
}

async function secretKeyHasChanged(_db: Dexie): Promise<boolean> {
  const db = _db as Dexie & {
    [DbCheckTable.name]: Table<EncryptedTestDoc, string>;
  };

  const encryptedTable = db[DbCheckTable.name];
  const encryptedTestDoc = await encryptedTable
    .get(DexieEncryptedTestDoc().id)
    .catch((error) => {
      if (error instanceof EncryptionError) return null;
      throw error;
    });

  // Encryption error
  if (encryptedTestDoc === null) return true;

  // First init
  if (encryptedTestDoc === undefined) {
    await encryptedTable.add(DexieEncryptedTestDoc());
    return false;
  }

  if (DexieEncryptedTestDoc().value !== encryptedTestDoc.value) return true;

  return false;
}

export async function checkDB(
  db: Dexie,
  schema: ModifiedKeysTable
): Promise<void> {
  const schemaHasNoEncryptionKeys: boolean = isValidSchema(schema);
  const encryptionKeyHasChanged: boolean = await secretKeyHasChanged(db);

  if (schemaHasNoEncryptionKeys)
    console.warn(new EncryptionError("No encryption keys are set").message);

  if (encryptionKeyHasChanged) throw new KeyError("Encryption key has changed");
}
