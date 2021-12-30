import { Dexie } from 'dexie';
import { getTableExtended } from './table-extended.class';

type DexieExtended = Dexie & {
    pVermeerAddonsRegistered?: { [addon: string]: boolean; };
};

export function classMap(db: Dexie) {

    // Register addon
    const dbExtended: DexieExtended = db;
    dbExtended.pVermeerAddonsRegistered = {
        ...dbExtended.pVermeerAddonsRegistered,
        class: true
    };

    function serialize(item: { [prop: string]: any; }) {
        let itemState = item;
        if (item['serialize'] && typeof item['serialize'] === 'function') itemState = item.serialize();
        return itemState;
    }

    // Extend / override the Table class.
    Object.defineProperty(db, 'Table', {
        value: getTableExtended(db)
    });

    // =============== Add =================
    db.Table.prototype.add = Dexie.override(
        db.Table.prototype.add,
        (origFunc: Dexie.Table<any, any>['add']) =>

            function (this: any, item, key?) {
                if (this.name.startsWith('_')) return origFunc.call(this, item, key);

                const itemState = serialize(item);
                return origFunc.call(this, itemState, key);
            } as typeof origFunc
    );

    db.Table.prototype.bulkAdd = Dexie.override(
        db.Table.prototype.bulkAdd,
        (origFunc: Dexie.Table<any, any>['bulkAdd']) =>

            function (this: any, items: Parameters<typeof origFunc>[0], key?: Parameters<typeof origFunc>[1]) {
                if (this.name.startsWith('_')) return origFunc.call(this, items, key);

                const itemStates = items.map(item => serialize(item));
                return origFunc.call(this, itemStates, key);
            } as typeof origFunc
    );
    // =============== Put =================
    db.Table.prototype.put = Dexie.override(
        db.Table.prototype.put,
        (origFunc: Dexie.Table<any, any>['put']) =>

            function (this: any, item, key?) {
                if (this.name.startsWith('_')) return origFunc.call(this, item, key);

                const itemState = serialize(item);
                return origFunc.call(this, itemState, key);
            } as typeof origFunc
    );

    db.Table.prototype.bulkPut = Dexie.override(
        db.Table.prototype.bulkPut,
        (origFunc: Dexie.Table<any, any>['bulkPut']) =>

            function (this: any, items: Parameters<typeof origFunc>[0], key?: Parameters<typeof origFunc>[1]) {
                if (this.name.startsWith('_')) return origFunc.call(this, items, key);

                const itemStates = items.map(item => serialize(item));
                return origFunc.call(this, itemStates, key);
            } as typeof origFunc
    );
    // =============== Update =================
    db.Table.prototype.update = Dexie.override(
        db.Table.prototype.update,
        (origFunc: Dexie.Table<any, any>['update']) =>

            function (this: any, key, changes) {
                if (this.name.startsWith('_')) return origFunc.call(this, key, changes);

                const changesState = serialize(changes);
                return origFunc.call(this, key, changesState);
            } as typeof origFunc
    );

}
