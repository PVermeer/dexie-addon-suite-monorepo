import { Dexie, IndexableType, Table } from "dexie";
import cloneDeep from "lodash.clonedeep";
import { RelationalDbSchema } from "./schema-parser.class";
import { DexieExtended, Populated, PopulateOptions } from "./types";

interface MappedIds {
  [targetTable: string]: {
    [targetKey: string]: {
      id: IndexableType;
      popKey: string;
      ownerRef: Record<string, unknown>;
    }[];
  };
}

interface MergeRef {
  id: IndexableType;
  popKeys: string[];
  ownerRef: Record<string, unknown>;
}

class DeepReferences extends Map<string, Set<Record<string, unknown>>> {
  getReferencesArray() {
    return [...(this.entries() || [])].reduce((acc, [table, refSet]) => {
      const refs = [...refSet.values()];
      acc.push([table, refs]);

      return acc;
    }, [] as [string, Record<string, unknown>[]][]);
  }

  getReferences(table: string) {
    return this.get(table) || null;
  }

  setReference(
    table: string,
    references: Record<string, unknown> | Record<string, unknown>[]
  ) {
    if (!this.has(table)) {
      this.set(table, new Set());
    }
    const tableRefs = this.get(table)!;

    if (Array.isArray(references)) {
      references.forEach((ref) => tableRefs.add(ref));
    } else {
      this.get(table)?.add(references);
    }
  }
}

class ReferenceCache extends Map<
  string,
  Map<IndexableType, Record<string, unknown> | null>
> {
  hasReference(table: string, key: IndexableType) {
    return this.get(table)?.has(key) || false;
  }

  getReference(table: string, key: IndexableType) {
    return this.get(table)?.get(key) || null;
  }

  setReference(
    table: string,
    key: IndexableType,
    reference: Record<string, unknown> | null
  ) {
    if (!this.has(table)) {
      this.set(table, new Map());
    }
    const tableRefs = this.get(table)!;
    tableRefs.set(key, reference);
  }
}

export interface PopulateTree {
  [targetTable: string]: {
    [targetKey: string]: IndexableType[];
  };
}

export interface PopulatedWithTree<T, B extends boolean, K extends string> {
  populated: Populated<T, B, K> | Populated<T, B, K>[] | undefined;
  populatedTree: PopulateTree;
}

export class Populate<
  T,
  TKey,
  TInsertType,
  B extends boolean,
  K extends string
> {
  public static async populateResult<
    T,
    TKey,
    TInsertType,
    B extends boolean,
    K extends string
  >(
    result: T | T[],
    table: Table<T, TKey, TInsertType>,
    keys: K[] | undefined,
    options: PopulateOptions<B> | undefined
  ): Promise<Populated<T, B, K>[]> {
    const dbExt = table.db as DexieExtended;
    const relationalSchema = dbExt._relationalSchema;
    const populate = new Populate<T, TKey, TInsertType, B, K>(
      result,
      keys,
      options,
      dbExt,
      table,
      relationalSchema
    );
    return populate.populated;
  }

  public static async populateResultWithTree<
    T,
    TKey,
    TInsertType,
    B extends boolean,
    K extends string
  >(
    result: T,
    table: Table<T, TKey, TInsertType>,
    keys: K[] | undefined,
    options: PopulateOptions<B> | undefined
  ): Promise<PopulatedWithTree<T, B, K>> {
    const dbExt = table.db as DexieExtended;
    const relationalSchema = dbExt._relationalSchema;
    const populate = new Populate<T, TKey, TInsertType, B, K>(
      result,
      keys,
      options,
      dbExt,
      table,
      relationalSchema
    );
    const getPopulated = await populate.populated;
    const populated = Array.isArray(result)
      ? getPopulated
      : getPopulated.length
      ? getPopulated[0]
      : undefined;
    const populatedTree = await populate.populatedTree;
    return { populated, populatedTree };
  }

  /**
   * Get table and keys of documents that are populated on the result.
   * @returns Memoized results, call populateRecords() to refresh.
   */
  public get populatedTree() {
    return (async () => {
      if (!this._populated) {
        await this.populateRecords();
      }
      return this._populatedTree;
    })();
  }

  /**
   * Get populated documents.
   * @returns Memoized results, call populateRecords() to refresh.
   */
  public get populated() {
    return (async () => {
      if (!this._populated) {
        await this.populateRecords();
      }
      return this._populated;
    })();
  }

  /**
   * Get populated documents.
   * @returns Fresh results.
   */
  public async populateRecords() {
    // Match schema with provided keys
    (this._keysToPopulate || []).forEach((key) => {
      if (
        !Object.values(this._relationalSchema).some((x) =>
          Object.keys(x).some((y) => y === key)
        )
      ) {
        throw new Error(
          `DEXIE POPULATE ADDON: Provided key '${key}' doesn't match with schema`
        );
      }
    });

    const tableName = this._table.name;
    const records = this._records;
    this._populatedTree = {};

    // Update toBePopulated by assigning to references.
    const toBePopulated = cloneDeep(records) as Record<string, unknown>[];
    await this.recursivePopulate(tableName, toBePopulated);

    this._populated = toBePopulated as Populated<T, B, K>[];
    return this._populated;
  }

  private _records: T[];
  private _populated: Populated<T, B, K>[];
  /** Provided selection of keys to populate in populate([]).*/
  private _keysToPopulate: string[] | undefined;
  /** Provided options in populate({}). */
  private _options: PopulateOptions<B> | undefined;
  /** Table and keys of documents that are populated on the result.*/
  private _populatedTree: PopulateTree;

  /** Check for valid key with IndexedDb */
  private keyIsValidDbKey(key: unknown): boolean {
    try {
      IDBKeyRange.only(key);
    } catch {
      return false;
    }
    return true;
  }

  /** Set's circular refs on referenced object */
  private setReferences(
    ownerRef: Record<string, unknown>,
    sourceTable: string,
    targetKey: string,
    targetTable: string,
    results: Record<string, unknown>[],
    popKeys: string[],
    referenceCache: ReferenceCache,
    deepReferences: DeepReferences,
    disableCache = false
  ): void {
    if (typeof ownerRef !== "object" || ownerRef === null) {
      return;
    }
    if (sourceTable === targetTable && !disableCache) {
      const ownerId = ownerRef[targetKey] as IndexableType;
      referenceCache.setReference(sourceTable, ownerId, ownerRef);
    }

    popKeys.forEach((popKey) => {
      const ownerRefPopValue = ownerRef[popKey] as
        | IndexableType
        | IndexableType[];

      const result: Record<string, unknown>[] = [];

      if (!Array.isArray(ownerRefPopValue)) {
        const cachedReference = referenceCache.getReference(
          targetTable,
          ownerRefPopValue
        );

        if (cachedReference) {
          ownerRef[popKey] = cachedReference;
          result.push(cachedReference);
        } else {
          const resultRef =
            results.find((result) => result[targetKey] === ownerRefPopValue) ||
            null;

          ownerRef[popKey] = resultRef;

          if (!disableCache) {
            referenceCache.setReference(
              targetTable,
              ownerRefPopValue,
              resultRef
            );
          }
          if (resultRef) {
            result.push(resultRef);
          }
        }
      } else {
        ownerRefPopValue.forEach((_popValueKey, i) => {
          const popValueKey = _popValueKey as IndexableType;

          const cachedReference = referenceCache.getReference(
            targetTable,
            popValueKey
          );

          if (cachedReference) {
            ownerRef[popKey]![i] = cachedReference;
            result.push(cachedReference);
          } else {
            const resultRef =
              results.find((result) => result[targetKey] === popValueKey) ||
              null;

            ownerRef[popKey]![i] = resultRef;

            if (!disableCache) {
              referenceCache.setReference(targetTable, popValueKey, resultRef);
            }
            if (resultRef) {
              result.push(resultRef);
            }
          }
        });
      }

      if (result!) {
        deepReferences.setReference(targetTable, result);
      }
    });
  }

  /**
   * Recursively populate the provided records (ref based strategy).
   */
  private recursivePopulate = async (
    sourceTable: string,
    populateRefs: (Record<string, unknown> | null)[],
    circularRefs: ReferenceCache = new ReferenceCache(),
    deepRecursive = false
  ) => {
    const schema = this._relationalSchema[sourceTable];
    if (!schema) {
      return;
    }

    const keysToPopulate = this._keysToPopulate || [];
    const deepReferences = new DeepReferences();
    const shallowPopulate = this._options && this._options.shallow;

    // Collect all target id's per target table per target key to optimise db queries.
    const mappedIds = populateRefs.reduce<MappedIds>((acc, record) => {
      if (!record) {
        return acc;
      }

      // Gather all id's per target key
      Object.entries(record).forEach(([key, value]) => {
        if (
          !schema[key] ||
          (!deepRecursive &&
            keysToPopulate.length &&
            !keysToPopulate.some((popKey) => popKey === key)) ||
          !value
        ) {
          return;
        }

        const { targetTable, targetKey } = schema[key];

        if (!acc[targetTable]) {
          acc[targetTable] = {};
        }
        if (!acc[targetTable][targetKey]) {
          acc[targetTable][targetKey] = [];
        }

        // Filter for IndexableType
        const keyValues = (Array.isArray(value) ? value : [value]).filter(
          (id) => id !== undefined && id !== null && this.keyIsValidDbKey(id)
        );

        const mappedIdEntries = keyValues.map((id) => ({
          id,
          popKey: key,
          ownerRef: record,
        }));

        acc[targetTable][targetKey] = [
          ...acc[targetTable][targetKey],
          ...mappedIdEntries,
        ];

        // Set mappedIds on total
        if (!this._populatedTree[targetTable]) {
          this._populatedTree[targetTable] = {};
        }
        if (!this._populatedTree[targetTable][targetKey]) {
          this._populatedTree[targetTable][targetKey] = [];
        }
        const uniqueIds = new Set(this._populatedTree[targetTable][targetKey]);
        keyValues.forEach((id) => uniqueIds.add(id));

        // Merge unique values
        this._populatedTree[targetTable][targetKey] = [...uniqueIds.values()];
      });

      return acc;
    }, {});

    // Fetch all records
    await Promise.all(
      Object.entries(mappedIds).reduce<Promise<void>[]>(
        (acc, [targetTable, targetKeys]) => {
          Object.entries(targetKeys).forEach(([targetKey, entries]) => {
            let uniqueIds = [...new Set(entries.map((entry) => entry.id))];

            if (!uniqueIds.length) {
              return;
            }

            // Speed up query when record is already cached
            uniqueIds = uniqueIds.filter(
              (id) => !circularRefs.hasReference(targetTable, id)
            );

            const mergeByRef: MergeRef[] = entries.reduce((acc, entry) => {
              let refEntry = acc.find(
                (accEntry) => accEntry.ownerRef === entry.ownerRef
              );

              if (!refEntry) {
                refEntry = {
                  id: entry.id,
                  popKeys: [],
                  ownerRef: entry.ownerRef,
                };

                acc.push(refEntry);
              }

              if (!refEntry.popKeys.some((popKey) => popKey === entry.popKey))
                refEntry.popKeys.push(entry.popKey);

              return acc;
            }, [] as MergeRef[]);

            // Get results
            const promise = this._db
              .table(targetTable)
              .where(targetKey)
              .anyOf(uniqueIds)
              .toArray()

              // Set the result on the populated record by reference
              .then((results: Record<string, unknown>[]) => {
                mergeByRef.forEach((entry) => {
                  const { ownerRef, popKeys } = entry;
                  this.setReferences(
                    ownerRef,
                    sourceTable,
                    targetKey,
                    targetTable,
                    results,
                    popKeys,
                    circularRefs,
                    deepReferences,
                    shallowPopulate
                  );
                });
              });

            acc.push(promise);
          });

          return acc;
        },
        []
      )
    );

    // Return when shallow option is provided.
    if (shallowPopulate) {
      return;
    }

    // Recursively populate refs further per table
    if (deepReferences.size) {
      await Promise.all(
        deepReferences.getReferencesArray().map(([table, refs]) => {
          return this.recursivePopulate(table, refs, circularRefs, true);
        })
      );
    }
  };

  constructor(
    _records: T[] | T | undefined,
    keys: string[] | undefined,
    options: PopulateOptions<B> | undefined,
    private _db: Dexie,
    private _table: Table<T, TKey, TInsertType>,
    private _relationalSchema: RelationalDbSchema
  ) {
    this._records = _records
      ? Array.isArray(_records)
        ? _records
        : [_records]
      : [];
    this._keysToPopulate = keys;
    this._options = options;
  }
}
