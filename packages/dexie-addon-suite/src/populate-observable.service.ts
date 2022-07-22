import { Populate, Populated, PopulateOptions, PopulateTree } from '@pvermeer/dexie-populate-addon';
import { Table } from 'dexie';
import isEqual from 'lodash.isequal';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, mergeMap, share, startWith, switchMap } from 'rxjs/operators';
import { DexieExtended } from './typings';

export function populateObservable<T, TKey, B extends boolean, K extends string>(
    observable: Observable<T>,
    table: Table<T, TKey>,
    keys: K[] | undefined,
    options: PopulateOptions<B> | undefined
) {
    const dbExt = table.db as DexieExtended;

    let popResult: {
        populated: Populated<T, B, string> | Populated<T, B, string>[] | undefined;
        populatedTree: PopulateTree;
    };

    return observable.pipe(
        mergeMap(async (result) => {
            popResult = await Populate.populateResultWithTree<T, TKey, B, K>(result, table, keys, options);
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
                if (i > 0) { popResult = await Populate.populateResultWithTree<T, TKey, B, K>(result, table, keys, options); }
                return popResult.populated;
            }),
            distinctUntilChanged<Populated<T, B, string> | Populated<T, B, string>[] | undefined>(isEqual),
            share()
        ))
    );
}
