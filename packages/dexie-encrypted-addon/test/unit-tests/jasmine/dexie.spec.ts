import { Dexie as DexieImport } from 'dexie';
import { encrypted, Encryption } from '../../../src';

declare interface DexieEncryptedAddon { encrypted: typeof encrypted; Encryption: typeof Encryption; }

/*
 * Lib is not really meant for node but package should be able to be required in node.
 */
describe('Dexie', () => {
    describe('Node require', () => {
        let DexieReq: typeof DexieImport;
        let DexieEncryptionAddonReq: DexieEncryptedAddon;
        beforeAll(() => {
            DexieReq = require('dexie');
            DexieEncryptionAddonReq = require('../../../../../dist/dexie-encrypted-addon');
        });
        it('should load Dexie.js', () => {
            expect(DexieReq).toBeTruthy();
        });
        it('should load DexieEncryptionAddon.js', () => {
            expect(DexieEncryptionAddonReq).toBeTruthy();
            expect(DexieEncryptionAddonReq.encrypted).toBeTruthy();
            expect(DexieEncryptionAddonReq.Encryption).toBeTruthy();
        });
        it('should be able to use Encryption class', async () => {
            const test = DexieEncryptionAddonReq.Encryption.createRandomEncryptionKey();
            expect(typeof test === 'string').toBeTrue();
        });
        it('should be able to use encrypted addon', async () => {
            const secret = DexieEncryptionAddonReq.Encryption.createRandomEncryptionKey();
            const test = DexieEncryptionAddonReq.encrypted.setOptions({ immutable: true, secretKey: secret });
            expect(typeof test === 'function').toBeTrue();
        });
    });
});
