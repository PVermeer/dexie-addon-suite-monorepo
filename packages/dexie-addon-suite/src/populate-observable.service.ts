import { Populate, PopulateOptions } from "@pvermeer/dexie-populate-addon";
import { PopulatedWithTree } from "@pvermeer/dexie-populate-addon/src/populate.class";
import { RangeSet, rangesOverlap, Table } from "dexie";
import cloneDeep from "lodash.clonedeep";
import { Observable } from "rxjs";
import {
  concatMap,
  debounceTime,
  filter,
  map,
  share,
  startWith,
  switchMap,
} from "rxjs/operators";

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

  // Memoize populate results
  let popResult: PopulatedWithTree<T, B, K>;

  return observable.pipe(
    // Switch to changes for updates on populated changes
    switchMap((result) =>
      db.changes$.pipe(
        // Force a first populate on owner
        startWith(null),

        // Filter for changes that apply
        filter((changes) => {
          // Run populate on subscribe (startWith())
          if (!popResult || !changes) {
            return true;
          }

          // Check changes object if changes apply
          return Object.entries(changes).some(([key, value]) => {
            if (!("from" in value)) {
              return false;
            }

            const ownerTableName = table.name;
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

            // Check if owner property is changed since this will trigger a new source emit
            if (ownerTableName === tableName && result[propName]) {
              const ownerRangeSet = new RangeSet();
              ownerRangeSet.addKey(result[propName]);
              const ownerInRange = rangesOverlap(value, ownerRangeSet);

              if (ownerInRange) {
                return false;
              }
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
        map(() => result)
      )
    ),

    // Throttle changes a bit so populate doesn't run that much on bursts
    debounceTime(50),

    // Run populate
    concatMap(async (result) => {
      popResult = await Populate.populateResultWithTree<
        T,
        TKey,
        TInsertType,
        B,
        K
      >(result, table, keys, options);

      return cloneDeep(popResult.populated);
    }),
    // Share to returned observable with multiple subscribers (hot)
    share()
  );
}
