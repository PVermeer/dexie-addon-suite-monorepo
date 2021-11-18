import { Dexie as DexieImport } from 'dexie';
import { immutable } from '../../../src';

declare interface DexieImmutableAddon { immutable: typeof immutable; }

/*
 * Lib is not really meant for node but package should be able to be required in node.
 */
describe('Dexie', () => {
    describe('Node require', () => {
        let DexieReq: typeof DexieImport;
        let DexieImmutableAddonReq: DexieImmutableAddon;
        beforeAll(() => {
            DexieReq = require('dexie');
            DexieImmutableAddonReq = require('../../../dist/index');
        });
        it('should load Dexie.js', () => {
            expect(DexieReq).toBeTruthy();
        });
        it('should load DexieImmutableAddonAddon.js', () => {
            expect(DexieImmutableAddonReq).toBeTruthy();
            expect(DexieImmutableAddonReq.immutable).toBeTruthy();
        });
        it('should be able to use immutable addon', async () => {
            expect(typeof DexieImmutableAddonReq.immutable === 'function').toBeTrue();
        });
    });
});
