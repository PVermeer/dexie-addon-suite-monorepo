import { StoreSchemas } from './encrypted';

export interface ModifiedKeys {
    keys: string[];
    hashKey: string | null;
}

export interface ModifiedKeysTable {
    [prop: string]: ModifiedKeys;
}

export class SchemaParser {

    private schema: StoreSchemas;

    /**
     * Extract the to be encrypted keys from the schema.
     */
    public getEncryptedKeys(): ModifiedKeysTable {
        return Object.entries(this.schema).reduce<ModifiedKeysTable>((acc, [table, value]) => {
            if (!value) { return acc; }

            const values = value.split(',').map(x => x.trim());
            const toBeEncryptedKeys = values
                .filter(x => x.startsWith('$'))
                .map(x => x.replace('$', ''));

            const primaryKey = values[0];
            const hashPrimary = primaryKey.includes('#');

            if (!toBeEncryptedKeys.length && !hashPrimary) { return acc; }

            const hashKey = hashPrimary ?
                primaryKey.replace('#', '').replace('++', '') :
                null;

            return {
                ...acc, [table]: {
                    keys: toBeEncryptedKeys,
                    hashKey
                }
            };
        }, {});
    }

    /**
     * Create a clean schema without the added keys.
     */
    public getCleanedSchema(): StoreSchemas {
        return Object.entries(this.schema).reduce<StoreSchemas>((acc, [table, value]) => {
            if (!value) { return acc; }

            const values = value.split(',').map(x => x.trim());
            values[0] = values[0].replace('#', '');
            const filteredKeyString = values.filter(x => !x.startsWith('$')).join(',');

            return { ...acc, [table]: filteredKeyString };
        }, {});
    }

    constructor(schema: StoreSchemas) {
        this.schema = schema;
    }

}
