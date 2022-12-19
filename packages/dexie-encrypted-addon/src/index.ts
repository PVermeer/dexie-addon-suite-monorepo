export { encrypted } from "./encrypted";
export type { EncryptedOptions } from "./encrypted";
export { Encryption } from "./encryption.class";

declare module "dexie" {
  /**
   * Extend Transaction interface
   */
  interface Transaction {
    raw?: boolean;
  }
}
