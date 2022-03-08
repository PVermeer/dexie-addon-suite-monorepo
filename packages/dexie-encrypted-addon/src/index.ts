export { encrypted } from './encrypted';
export { Encryption } from './encryption.class';
export type { EncryptedOptions } from './encrypted';

declare module 'dexie' {

    /**
     * Extend Transaction interface
     */
    interface Transaction {
        disableEncryption?: boolean;
    }
    
}
