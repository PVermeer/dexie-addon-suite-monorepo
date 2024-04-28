import {
  Populate,
  Populated,
  PopulateOptions,
  PopulateTree,
} from "@pvermeer/dexie-populate-addon";
import { rangesOverlap, Table, RangeSet } from "dexie";
import { Observable } from "rxjs";
import { filter, mergeMap, share, startWith, switchMap } from "rxjs/operators";

export function populateObservable<
  T,
  TKey,
  TInsertType,
  B extends boolean,
  K extends string
>(
  observable: Observable<T>,
  table: Table<T, TKey, TInsertType>,
  keys: K[] | undefined,
  options: PopulateOptions<B> | undefined
) {
  const db = table.db;

  let popResult: {
    populated: Populated<T, B, string> | Populated<T, B, string>[] | undefined;
    populatedTree: PopulateTree;
  };

  // Write new implementation using https://dexie.org/docs/Dexie/Dexie.on.storagemutated

  return observable.pipe(
    mergeMap(async (result) => {
      popResult = await Populate.populateResultWithTree<
        T,
        TKey,
        TInsertType,
        B,
        K
      >(result, table, keys, options);
      return result;
    }),
    switchMap((result) =>
      db.changes$.pipe(
        filter((changes) => {
          return Object.entries(changes).some(([key, value]) => {
            if (!("from" in value)) {
              return false;
            }

            const populatedTree = popResult.populatedTree;
            const keyParts = key.split("/");
            const tableName = keyParts[3];
            const primaryKeyPath = db._dbSchema[tableName].primKey.name;
            const propName =
              keyParts[4] === ""
                ? primaryKeyPath
                : !keyParts[4]
                ? null
                : keyParts[4];

            if (propName === null) {
              return false;
            }

            if (!populatedTree[tableName]) {
              return false;
            }

            if (!populatedTree[tableName][propName]) {
              return false;
            }

            const popKeyValues = populatedTree[tableName][propName];
            if (popKeyValues.length === 0) {
              return false;
            }

            const popRangeSet = new RangeSet();
            popRangeSet.addKeys(popKeyValues);

            const isInRange = rangesOverlap(value, popRangeSet);
            if (!isInRange) {
              return false;
            }

            return true;
          });
        }),
        startWith(null),
        mergeMap(async (_, i) => {
          if (i > 0) {
            popResult = await Populate.populateResultWithTree<
              T,
              TKey,
              TInsertType,
              B,
              K
            >(result, table, keys, options);
          }
          return popResult.populated;
        }),
        share()
      )
    )
  );
}
