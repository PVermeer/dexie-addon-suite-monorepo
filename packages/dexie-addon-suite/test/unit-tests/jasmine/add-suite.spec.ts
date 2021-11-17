import { Dexie as DexieImport } from 'dexie';
import * as Rxjs from 'rxjs';

/*
 * Lib is not really meant for node but package should be able to be required in node.
 */
describe('Dexie', () => {
    describe('Node require', () => {
        let DexieReq: typeof DexieImport;
        let rxjs: typeof Rxjs;
        beforeAll(() => {
            DexieReq = require('dexie');
            rxjs = require('rxjs');
        });
        it('should be able to require Dexie.js', () => {
            expect(DexieReq).toBeTruthy();
        });
        it('should be able to require rxjs', () => {
            expect(rxjs).toBeTruthy();
        });
        it('should throw when trying to require', () => {
            let addon: any;
            // Addon throws because window.self is not defined.
            // Dependency 'dexie-observable' relies on this.
            try {
                addon = require('../../../dist/index');
            } catch (error) {
                expect(error instanceof Error).toBeTrue();
            }
            expect(addon).toBeUndefined();
        });
    });
});
