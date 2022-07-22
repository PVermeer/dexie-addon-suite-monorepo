import { Dexie as DexieImport } from 'dexie';
import { classMap } from '../../../src';

declare interface DexieClassAddon { classMap: typeof classMap; }

/*
 * Lib is not really meant for node but package should be able to be required in node.
 */
describe('dexie-class-addon dexie.spec', () => {

    describe('Dexie', () => {
        describe('Node require', () => {
            let DexieReq: typeof DexieImport;
            let DexieClassAddonReq: DexieClassAddon;
            beforeAll(() => {
                DexieReq = require('dexie');
                DexieClassAddonReq = require('../../../dist/index');
            });
            it('should load Dexie.js', () => {
                expect(DexieReq).toBeTruthy();
            });
            it('should load DexieImmutableAddonAddon.js', () => {
                expect(DexieClassAddonReq).toBeTruthy();
                expect(DexieClassAddonReq.classMap).toBeTruthy();
            });
            it('should be able to use immutable addon', async () => {
                expect(typeof DexieClassAddonReq.classMap === 'function').toBeTrue();
            });
        });
    });

});
