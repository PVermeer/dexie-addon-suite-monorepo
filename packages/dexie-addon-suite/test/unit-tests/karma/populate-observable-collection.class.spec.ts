import { ObservableCollection } from '@pvermeer/dexie-rxjs-addon';
import { Dexie } from 'dexie';
import { PopulateObservableCollection } from '../../../src/populate-observable-collection.class';
import { databasesPositive } from '../../mocks/mocks.spec';

describe('PopulateObservableCollection', () => {
    it('should only hijack methods that return an observable', async () => {
        const db = databasesPositive[0].db(Dexie);
        const collection = db.friends.where({ id: 1 });
        (ObservableCollection.prototype as any).test = () => 'something';
        const popObsClass = new PopulateObservableCollection(db, db.friends, collection, undefined, undefined);
        expect((popObsClass as any).test()).toBe('something');
        await db.delete();
    });
});
