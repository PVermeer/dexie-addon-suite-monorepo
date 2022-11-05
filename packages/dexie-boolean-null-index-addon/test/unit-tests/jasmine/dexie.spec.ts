import { Dexie as DexieImport } from 'dexie';
import { booleanNullIndex } from '../../../src';

declare interface DexieBooleanNullIndexAddon { booleanNullIndex: typeof booleanNullIndex; }

/*
 * Lib is not really meant for node but package should be able to be required in node.
 */
describe('dexie-boolean-null-index-addon dexie.spec', () => {

    describe('Dexie', () => {
        describe('Node require', () => {
            let DexieReq: typeof DexieImport;
            let DexieBooleanNullIndexAddonReq: DexieBooleanNullIndexAddon;
            beforeAll(() => {
                DexieReq = require('dexie');
                DexieBooleanNullIndexAddonReq = require('../../../dist/index');
            });
            it('should load Dexie.js', () => {
                expect(DexieReq).toBeTruthy();
            });
            it('should load DexieNullIndexAddon.js', () => {
                expect(DexieBooleanNullIndexAddonReq).toBeTruthy();
                expect(DexieBooleanNullIndexAddonReq.booleanNullIndex).toBeTruthy();
            });
            it('should be able to use addon', async () => {
                const test = DexieBooleanNullIndexAddonReq.booleanNullIndex;
                expect(typeof test === 'function').toBeTrue();
            });
        });
    });

});
