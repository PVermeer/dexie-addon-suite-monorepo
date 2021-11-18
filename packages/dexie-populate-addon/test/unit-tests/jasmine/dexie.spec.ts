import { Dexie as DexieImport } from 'dexie';
import { populate } from '../../../src/index';

declare interface DexiePopulateAddon { populate: typeof populate; }

/*
 * Lib is not really meant for node but package should be able to be required in node.
 */
describe('Dexie', () => {
    describe('Node require', () => {
        let DexieReq: typeof DexieImport;
        let PopulateReq: DexiePopulateAddon;
        beforeAll(() => {
            DexieReq = require('dexie');
            PopulateReq = require('../../../dist/index');
        });
        it('should be able to require Dexie.js', () => {
            expect(DexieReq).toBeTruthy();
        });
        it('should be able to require PopulateAddon', () => {
            expect(PopulateReq).toBeTruthy();
        });
        it('should be able to use the PopulateAddon', () => {
            expect(PopulateReq.populate).toBeTruthy();
        });
    });
});
