export interface StoreSchemas { [tableName: string]: string | null; }

export interface RelationalKeys {
    [prop: string]: {
        targetTable: string;
        targetKey: string;
    };
}

export interface RelationalDbSchema {
    [prop: string]: RelationalKeys;
}

export class SchemaParser {

    /**
     * Extract the relationial keys from the schema.
     */
    public getRelationalKeys(): RelationalDbSchema {
        return Object.entries(this._schema).reduce<RelationalDbSchema>((acc, [table, value]) => {
            if (!value || typeof value !== 'string') { return acc; }

            const relationalKeys = value
                .split(',')
                .filter(x => x.includes('=>'))
                .reduce<RelationalKeys>((relObj, x) => {
                    const split = x.split('=>').map(y => y.trim());
                    const relationalKey = split[0]
                        .replace('*', '')
                        .replace('&', '');
                    const [targetTable, targetKey] = split[1].split('.').map(y => y.trim());
                    return { ...relObj, [relationalKey]: { targetTable, targetKey } };
                }, {});

            if (!Object.keys(relationalKeys).length) { return acc; }

            return { ...acc, [table]: relationalKeys };
        }, {});
    }

    /**
     * Create a clean schema without the added keys.
     */
    public getCleanedSchema(): StoreSchemas {
        return Object.entries(this._schema).reduce<StoreSchemas>((acc, [table, value]) => {
            if (!value || typeof value !== 'string') { return { ...acc, [table]: value }; }

            const sanitized = value
                .split(',')
                .map(x => x.split('=>')[0])
                .map(x => x.trim())
                .join(', ');

            return { ...acc, [table]: sanitized };
        }, {});
    }

    constructor(
        private _schema: StoreSchemas
    ) { }

}
