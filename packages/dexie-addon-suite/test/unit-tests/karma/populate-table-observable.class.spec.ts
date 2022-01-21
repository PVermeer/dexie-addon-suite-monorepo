import { ObservableTable } from '@pvermeer/dexie-rxjs-addon';
import { Dexie } from 'dexie';
import { PopulateTableObservable } from '../../../src/populate-table-observable.class';
import { databasesPositive } from '../../mocks/mocks.spec';

describe('PopulateTableObservable', () => {
    it('should only hijack methods that return an observable', async () => {
        const db = databasesPositive[0].db(Dexie);
        (ObservableTable.prototype as any).test = () => 'something';
        const popTableObsClass = new PopulateTableObservable(db, db.friends, undefined, undefined);
        expect((popTableObsClass as any).test()).toBe('something');
        await db.delete();
    });
});
