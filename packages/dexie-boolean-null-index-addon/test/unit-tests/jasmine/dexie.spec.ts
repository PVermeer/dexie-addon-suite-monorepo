import { Dexie as DexieImport } from 'dexie';
import { nullIndex } from '../../../src';

declare interface DexieNullIndexAddon { nullIndex: typeof nullIndex; }

/*
 * Lib is not really meant for node but package should be able to be required in node.
 */
describe('dexie-null-index-addon dexie.spec', () => {

    describe('Dexie', () => {
        describe('Node require', () => {
            let DexieReq: typeof DexieImport;
            let DexieNullIndexAddonReq: DexieNullIndexAddon;
            beforeAll(() => {
                DexieReq = require('dexie');
                DexieNullIndexAddonReq = require('../../../dist/index');
            });
            it('should load Dexie.js', () => {
                expect(DexieReq).toBeTruthy();
            });
            it('should load DexieNullIndexAddon.js', () => {
                expect(DexieNullIndexAddonReq).toBeTruthy();
                expect(DexieNullIndexAddonReq.nullIndex).toBeTruthy();
            });
            it('should be able to use null index addon', async () => {
                const test = DexieNullIndexAddonReq.nullIndex.setOptions({ nullStringValue: 'some null string' });
                expect(typeof test === 'function').toBeTrue();
            });
        });
    });

});
