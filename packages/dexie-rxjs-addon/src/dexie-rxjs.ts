import type { Dexie } from 'dexie';
import dexieObservable from 'dexie-observable';
import type { IDatabaseChange } from 'dexie-observable/api';
import { fromEventPattern } from 'rxjs';
import { map, share } from 'rxjs/operators';
import { getTableExtended } from './table-extended.class';
import type { DexieExtended } from './types';

export function dexieRxjs(db: Dexie) {

    // Register addon
    const dbExtended = db as DexieExtended;
    dbExtended.pVermeerAddonsRegistered = {
        ...dbExtended.pVermeerAddonsRegistered,
        rxjs: true
    };

    /* Check if dexie-observable is loaded, if not load it.
       This is needed because the HTML script tag import tries to load it while
       the Dexie class is constructing. This is sometimes too late */
    if (!(db.on as any).changes) {
        (dexieObservable as any)(db);
    }

    // Extend the DB class
    type ChangeCb = [IDatabaseChange[], boolean];
    Object.defineProperty(db, 'changes$', {
        value: fromEventPattern<ChangeCb>(handler => db.on('changes', handler)).pipe(
            map(x => x[0]),
            share()
        )
    });

    // Extend the Table class.
    Object.defineProperty(db, 'Table', {
        value: getTableExtended(db)
    });

}
