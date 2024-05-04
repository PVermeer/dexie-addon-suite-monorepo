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

interface DeepRefsPopulate {
  [table: string]: {
    refs: Set<Record<string, unknown> | (Record<string, unknown> | null)[]>;
    circularRefs: Set<Record<string, unknown>>;
  };
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

  private _records: T[];

  private _populated: Populated<T, B, K>[];

  /**
   * Provided selection of keys to populate in populate([]).
   */
  private _keysToPopulate: string[] | undefined;

  /**
   * Provided options in populate({}).
   */
  private _options: PopulateOptions<B> | undefined;

  /**
   * Table and keys of documents that are populated on the result.
   */
  private _populatedTree: PopulateTree;

  /** Set's circular refs on referenced object
   * @returns 'true' if circular refs where found
   */
  private setCircularRefs(
    ownerRef: Record<string, unknown>,
    sourceTable: string,
    targetKey: string,
    targetTable: string,
    newRef: Record<string, unknown> | (Record<string, unknown> | null)[] | null,
    popKey: string,
    deepRefsToPopulate: DeepRefsPopulate
  ): boolean {
    const ownerTargetKeyValue = ownerRef[targetKey];
    const ownerPopValue = ownerRef[popKey];

    if (sourceTable !== targetTable) {
      return false;
    }

    if (
      ownerPopValue === null ||
      ownerPopValue === undefined ||
      newRef === null ||
      newRef === undefined
    ) {
      return false;
    }

    if (Array.isArray(ownerPopValue) && Array.isArray(newRef)) {
      let isCircular = false;

      newRef.forEach((newRefKeyValue) => {
        if (newRefKeyValue === null) {
          return;
        }
        const popValue = newRefKeyValue[popKey];

        // Check for second level array
        if (Array.isArray(popValue)) {
          popValue.forEach((popValueItem, i) => {
            const targetIsOwner = popValueItem === ownerTargetKeyValue;
            if (!targetIsOwner) {
              return;
            }

            popValue[i] = ownerRef;
            deepRefsToPopulate[sourceTable].circularRefs.add(ownerRef);
            isCircular = true;
          });
        }

        const targetIsOwner = popValue === ownerTargetKeyValue;
        if (targetIsOwner) {
          newRefKeyValue[popKey] = ownerRef;
          deepRefsToPopulate[sourceTable].circularRefs.add(ownerRef);
          isCircular = true;
        }
      });

      return isCircular;
    }

    const targetIsOwner = newRef[popKey][targetKey] === ownerTargetKeyValue;
    if (targetIsOwner) {
      newRef[popKey][targetKey] === ownerRef;
      deepRefsToPopulate[sourceTable].circularRefs.add(ownerRef);

      return true;
    }

    return false;
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
  get populated() {
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
    await this._recursivePopulate(tableName, toBePopulated, []);

    this._populated = toBePopulated as Populated<T, B, K>[];
    return this._populated;
  }

  private keyIsValidDbKey(key: unknown): boolean {
    try {
      IDBKeyRange.only(key);
    } catch {
      return false;
    }
    return true;
  }

  /**
   * Recursively populate the provided records (ref based strategy).
   */
  private _recursivePopulate = async (
    sourceTable: string,
    populateRefs: (Record<string, unknown> | null)[],
    circularRefs: Record<string, unknown>[],
    deepRecursive = false
  ) => {
    const schema = this._relationalSchema[sourceTable];
    if (!schema) {
      return;
    }

    const keysToPopulate = this._keysToPopulate || [];
    const deepRefsToPopulate: DeepRefsPopulate = {};

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
            const uniqueIds = [...new Set(entries.map((entry) => entry.id))];
            if (!uniqueIds.length) {
              return;
            }

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
              .then((_results: Record<string, unknown>[]) => {
                // Merge result with already found circular refs since these are not queried again
                const results = [..._results, ...circularRefs];

                if (!deepRefsToPopulate[targetTable]) {
                  deepRefsToPopulate[targetTable] = {
                    refs: new Set(),
                    circularRefs: new Set(),
                  };
                }

                mergeByRef.forEach((entry) => {
                  const { ownerRef, popKeys } = entry;
                  if (typeof ownerRef !== "object" || ownerRef === null) return;

                  popKeys.forEach((popKey) => {
                    const refKey = ownerRef[popKey];

                    const newRef = Array.isArray(refKey)
                      ? refKey.map(
                          (value) =>
                            results.find(
                              (result) =>
                                result[targetKey] === value || result === value
                            ) || null
                        )
                      : results.find(
                          (result) =>
                            result[targetKey] === refKey || result === refKey
                        ) || null;

                    // Update the referenced record with found record(s)
                    ownerRef[popKey] = newRef;
                    if (newRef === null) return;

                    this.setCircularRefs(
                      ownerRef,
                      sourceTable,
                      targetKey,
                      targetTable,
                      newRef,
                      popKey,
                      deepRefsToPopulate
                    );

                    // Push the ref for furter populating
                    deepRefsToPopulate[targetTable].refs.add(newRef);
                  });
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
    if (this._options && this._options.shallow) {
      return;
    }

    // Recursively populate refs further per table
    if (Object.keys(deepRefsToPopulate).length) {
      await Promise.all(
        Object.entries(deepRefsToPopulate).map(([table, refs]) => {
          return this._recursivePopulate(
            table,
            [...refs.refs.values()].flat(),
            [...refs.circularRefs.values()].flat(),
            true
          );
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
