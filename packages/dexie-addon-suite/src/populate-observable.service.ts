import { Populate, Populated, PopulateOptions, PopulateTree } from '@pvermeer/dexie-populate-addon';
import { Table } from 'dexie';
import isEqual from 'lodash.isequal';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, mergeMap, share, startWith, switchMap } from 'rxjs/operators';
import { DexieExtended } from './typings';

async function populateResult<T, TKey, B extends boolean, K extends string>(
    result: T,
    table: Table<T, TKey>,
    keysOrOptions: K[] | PopulateOptions<B> | undefined
) {
    const dbExt = table.db as DexieExtended;
    const relationalSchema = dbExt._relationalSchema;
    const populate = new Populate(result, keysOrOptions, dbExt, table, relationalSchema);
    const getPopulated = await populate.populated;
    const populated = Array.isArray(result) ? getPopulated : (getPopulated.length ? getPopulated[0] : undefined);
    const populatedTree = await populate.populatedTree;
    return { populated, populatedTree };
}

export function populateObservable<T, TKey, B extends boolean, K extends string>(
    observable: Observable<T>,
    table: Table<T, TKey>,
    keysOrOptions: K[] | PopulateOptions<B> | undefined
) {
    const dbExt = table.db as DexieExtended;

    let popResult: {
        populated: Populated<T, B, string> | Populated<T, B, string>[] | undefined;
        populatedTree: PopulateTree;
    };

    return observable.pipe(
        mergeMap(async (result) => {
            popResult = await populateResult<T, TKey, B, K>(result, table, keysOrOptions);
            return result;
        }),
        switchMap(result => dbExt.changes$.pipe(
            filter(changes => changes.some(change => {
                if (!popResult.populatedTree[change.table]) { return false; }
                const obj = 'obj' in change ? change.obj : change.oldObj;
                return Object.keys(obj).some(objKey =>
                    popResult.populatedTree[change.table][objKey] &&
                    popResult.populatedTree[change.table][objKey][obj[objKey]]);
            })),
            startWith(null),
            mergeMap(async (_, i) => {
                if (i > 0) { popResult = await populateResult<T, TKey, B, K>(result, table, keysOrOptions); }
                return popResult.populated;
            }),
            distinctUntilChanged<Populated<T, B, string> | Populated<T, B, string>[] | undefined>(isEqual),
            share()
        ))
    );
}
