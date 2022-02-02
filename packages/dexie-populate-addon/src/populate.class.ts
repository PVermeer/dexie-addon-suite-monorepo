import { Dexie, IndexableType, Table } from 'dexie';
import cloneDeep from 'lodash.clonedeep';
import flatten from 'lodash.flatten';
import isEqual from 'lodash.isequal';
import uniqBy from 'lodash.uniqby';
import { RelationalDbSchema } from './schema-parser.class';
import { DexieExtended, Populated, PopulateOptions } from './types';


interface MappedIds {
    [targetTable: string]: {
        [targetKey: string]: {
            id: IndexableType;
            key: string;
            ref: any;
        }[];
    };
}

export interface PopulateTree {
    [targetTable: string]: {
        [targetKey: string]: {
            [value: string]: boolean;
        };
    };
}

export class Populate<T, TKey, B extends boolean, K extends string> {

    public static async populateResult<T, TKey, B extends boolean, K extends string>(
        result: T | T[],
        table: Table<T, TKey>,
        keys: K[] | undefined,
        options: PopulateOptions<B> | undefined
    ): Promise<Populated<T, B, K>[]> {
        const dbExt = table.db as DexieExtended;
        const relationalSchema = dbExt._relationalSchema;
        const populate = new Populate<T, TKey, B, K>(result, keys, options, dbExt, table, relationalSchema);
        return populate.populated;
    }

    public static async populateResultWithTree<T, TKey, B extends boolean, K extends string>(
        result: T,
        table: Table<T, TKey>,
        keys: K[] | undefined,
        options: PopulateOptions<B> | undefined
    ) {
        const dbExt = table.db as DexieExtended;
        const relationalSchema = dbExt._relationalSchema;
        const populate = new Populate(result, keys, options, dbExt, table, relationalSchema);
        const getPopulated = await populate.populated;
        const populated = Array.isArray(result) ? getPopulated : (getPopulated.length ? getPopulated[0] : undefined);
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

    /**
     * Get table and keys of documents that are populated on the result.
     * @returns Memoized results, call populateRecords() to refresh.
     */
    public get populatedTree() {
        return (async () => {
            if (!this._populated) { await this.populateRecords(); }
            return this._populatedTree;
        })();
    }

    /**
     * Get populated documents.
     * @returns Memoized results, call populateRecords() to refresh.
     */
    get populated() {
        return (async () => {
            if (!this._populated) { await this.populateRecords(); }
            return this._populated;
        })();
    }

    /**
     * Get populated documents.
     * @returns Fresh results.
     */
    public async populateRecords() {

        // Match schema with provided keys
        (this._keysToPopulate || []).forEach(key => {
            if (!Object.values(this._relationalSchema).some(x => Object.keys(x).some(y => y === key))) {
                throw new Error(`DEXIE POPULATE ADDON: Provided key '${key}' doesn't match with schema`);
            }
        });

        const tableName = this._table.name;
        const records = await this._records;
        this._populatedTree = {};

        // Update toBePopulated by assigning to references.
        const toBePopulated = cloneDeep(records);
        await this._recursivePopulate(tableName, toBePopulated);

        this._populated = toBePopulated as Populated<T, B, K>[];
        return this._populated;
    }

    /**
     * Recursively populate the provided records (ref based strategy).
     */
    private _recursivePopulate = async (tableName: string, populateRefs: T[]) => {

        const schema = this._relationalSchema[tableName];
        if (!schema) { return; }

        const keysToPopulate = this._keysToPopulate || [];
        const deepRefsToPopulate: { [table: string]: any[]; } = {};

        // Collect all target id's per target table per target key to optimise db queries.
        const mappedIds = populateRefs.reduce<MappedIds>((acc, record) => {

            if (!record) { return acc; }

            // Gather all id's per target key
            Object.entries(record).forEach(([key, entry]) => {

                if (
                    !schema[key] ||
                    (keysToPopulate.length && !keysToPopulate.some(x => x === key)) ||
                    !entry
                ) { return; }

                const { targetTable, targetKey } = schema[key];

                if (!acc[targetTable]) { acc[targetTable] = {}; }
                if (!acc[targetTable][targetKey]) { acc[targetTable][targetKey] = []; }

                const ids = (Array.isArray(entry) ? entry : [entry])
                    .filter(id => id !== undefined && id !== null);
                const mappedIdEntries = ids.map(id => ({ id, key, ref: record }));

                acc[targetTable][targetKey] = [...acc[targetTable][targetKey], ...mappedIdEntries];

                // Set mappedIds on total
                if (!this._populatedTree[targetTable]) { this._populatedTree[targetTable] = {}; }
                if (!this._populatedTree[targetTable][targetKey]) { this._populatedTree[targetTable][targetKey] = {}; }
                ids.forEach(x => this._populatedTree[targetTable][targetKey][x.toString()] = true);
            });

            return acc;
        }, {});

        // Fetch all records
        await Promise.all(Object.entries(mappedIds).reduce<Promise<any>[]>((acc, [targetTable, targetKeys]) => {

            Object.entries(targetKeys).forEach(([targetKey, entries]) => {

                const uniqueIds = [...new Set(entries.map(entry => entry.id))];
                const uniqueByRef = uniqBy(entries, value => value.ref);

                // Get results
                const promise = this._db.table(targetTable)
                    .where(targetKey)
                    .anyOf(uniqueIds)
                    .toArray()

                    // Set the result on the populated record by reference
                    .then(results => {
                        uniqueByRef.forEach(entry => {
                            const { ref, key } = entry;
                            const refKey = ref[key];

                            const newRefKey: any = Array.isArray(refKey) ?
                                refKey.map(value => results.find(x => x[targetKey] === value) || null) :
                                results.find(result => result[targetKey] === refKey) || null;

                            // Error checking
                            const isCircular = !newRefKey ? false : Array.isArray(newRefKey) && newRefKey.some(x => x ?
                                isEqual(x[key], ref[key]) : false) ||
                                isEqual(newRefKey[key], ref[key]);

                            if (isCircular) {
                                throw new Error(`DEXIE POPULATE ADDON: Circular reference detected on '${key}'. ` +
                                    `'${key}' Probably contains a reference to itself.`
                                );
                            }

                            // Update the referenced object with found record(s)
                            ref[key] = newRefKey;

                            // Push the ref for furter populating
                            if (!deepRefsToPopulate[targetTable]) { deepRefsToPopulate[targetTable] = []; }
                            deepRefsToPopulate[targetTable].push(newRefKey);
                        });
                    });

                acc.push(promise);
            });

            return acc;
        }, []));

        // Return when shallow option is provided.
        if (this._options && this._options.shallow) { return; }

        // Recursively populate refs further per table
        if (Object.keys(deepRefsToPopulate).length) {
            await Promise.all(
                Object.entries(deepRefsToPopulate)
                    .map(([table, refs]) => this._recursivePopulate(table, flatten(refs)))
            );
        }
    };

    constructor(
        _records: T[] | T | undefined,
        keys: string[] | undefined,
        options: PopulateOptions<B> | undefined,
        private _db: Dexie,
        private _table: Table<T, TKey>,
        private _relationalSchema: RelationalDbSchema
    ) {
        this._records = _records ? Array.isArray(_records) ? _records : [_records] : [];
        this._keysToPopulate = keys;
        this._options = options;
    }

}
