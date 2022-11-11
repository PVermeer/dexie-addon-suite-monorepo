import { Dexie } from 'dexie';
import cloneDeep from 'lodash.clonedeep';

type DexieExtended = Dexie & {
    pVermeerAddonsRegistered?: { [addon: string]: boolean; };
};

export function immutable(db: Dexie) {

    // Register addon
    const dbExtended: DexieExtended = db;
    if (dbExtended.pVermeerAddonsRegistered?.immutable) {
        return;
    }

    dbExtended.pVermeerAddonsRegistered = {
        ...dbExtended.pVermeerAddonsRegistered,
        immutable: true
    };

    // =============== Add =================
    db.Table.prototype.add = Dexie.override(
        db.Table.prototype.add,
        (origFunc: Dexie.Table<any, any>['add']) =>

            function (this: any, item, key?) {
                if (this.name.startsWith('_')) return origFunc.call(this, item, key);

                const itemState = cloneDeep(item);
                const keyState = cloneDeep(key);
                return origFunc.call(this, itemState, keyState);
            } as typeof origFunc
    );

    db.Table.prototype.bulkAdd = Dexie.override(
        db.Table.prototype.bulkAdd,
        (origFunc: Dexie.Table<any, any>['bulkAdd']) =>

            function (this: any, items: Parameters<typeof origFunc>[0], key?: Parameters<typeof origFunc>[1]) {
                if (this.name.startsWith('_')) return origFunc.call(this, items, key);

                const itemState = cloneDeep(items);
                const keyState = cloneDeep(key);
                return origFunc.call(this, itemState, keyState);
            } as typeof origFunc
    );
    // =============== Put =================
    db.Table.prototype.put = Dexie.override(
        db.Table.prototype.put,
        (origFunc: Dexie.Table<any, any>['put']) =>

            function (this: any, items, key?) {
                if (this.name.startsWith('_')) return origFunc.call(this, items, key);

                const itemState = cloneDeep(items);
                const keyState = cloneDeep(key);
                return origFunc.call(this, itemState, keyState);
            } as typeof origFunc
    );

    db.Table.prototype.bulkPut = Dexie.override(
        db.Table.prototype.bulkPut,
        (origFunc: Dexie.Table<any, any>['bulkPut']) =>

            function (this: any, items: Parameters<typeof origFunc>[0], key?: Parameters<typeof origFunc>[1]) {
                if (this.name.startsWith('_')) return origFunc.call(this, items, key);

                const itemState = cloneDeep(items);
                const keyState = cloneDeep(key);
                return origFunc.call(this, itemState, keyState);
            } as typeof origFunc
    );
    // =============== Update =================
    db.Table.prototype.update = Dexie.override(
        db.Table.prototype.update,
        (origFunc: Dexie.Table<any, any>['update']) =>

            function (this: any, key, changes) {
                if (this.name.startsWith('_')) return origFunc.call(this, key, changes);

                const keyState = cloneDeep(key);
                const changesState = cloneDeep(changes);
                return origFunc.call(this, keyState, changesState);
            } as typeof origFunc
    );

}
