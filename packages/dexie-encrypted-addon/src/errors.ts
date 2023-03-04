abstract class DexieEncryptedError extends Error {
  constructor(message: string) {
    super("DEXIE ENCRYPT ADDON: " + message);
  }
}

export class SchemaError extends DexieEncryptedError {
  constructor(message: string) {
    super(message);
  }
}

export class KeyError extends DexieEncryptedError {
  constructor(message: string) {
    super(message);
  }
}

export class EncryptionError extends DexieEncryptedError {
  constructor(message: string) {
    super(message);
  }
}
