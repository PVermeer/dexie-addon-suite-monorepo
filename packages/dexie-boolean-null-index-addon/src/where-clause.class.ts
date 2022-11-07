import { Collection, Dexie, IndexableType, Table, WhereClause } from "dexie";
import { DexieExtended } from "./types";
import { mapValuesToBinary, MIN_BINARY } from "./utils";

function compoundError() {
    return new TypeError(`Dexie-Boolean-Null-Index-Addon: Compound queries are not supported as these also do not work in Dexie.`);
}

function simpleTypeError() {
    return new TypeError(`Dexie-Boolean-Null-Index-Addon: Value must be of type 'string | number | Date'`);
}

function checkForSimpleValue(value: unknown) {

    if (Array.isArray(value)) throw compoundError();
    if (typeof value !== 'string' && typeof value !== 'number' && !(value instanceof Date)) {
        throw simpleTypeError();
    }
}

export function getWhereClauseExtended(db: Dexie) {

    const WhereClause = db.WhereClause as DexieExtended['WhereClause'];

    return class WhereClauseExtended<T, TKey> extends WhereClause<T, TKey> {

        public override above(key: Parameters<WhereClause['above']>['0']): Collection<T, TKey> {

            checkForSimpleValue(key);

            return this.between(key, MIN_BINARY, false, false);
        }

        public override aboveOrEqual(key: Parameters<WhereClause['aboveOrEqual']>['0']): Collection<T, TKey> {

            checkForSimpleValue(key);

            return this.between(key, MIN_BINARY, true, false);
        }

        public override anyOf(_values: unknown): Collection<T, TKey> {

            // eslint-disable-next-line prefer-rest-params
            const values = <(IndexableType | null)[]>(arguments.length === 1 ? _values : [...arguments]);
            const mappedValues = mapValuesToBinary(values);

            return super.anyOf(mappedValues);
        }

        public override equals(key: Parameters<WhereClause['equals']>['0']): Collection<T, TKey> {

            const newKey = mapValuesToBinary(key);
            return super.equals(newKey);
        }

        public override noneOf(keys: Parameters<WhereClause['noneOf']>['0']): Collection<T, TKey> {

            const newKeys = mapValuesToBinary(keys);
            return super.noneOf(newKeys);
        }

        public override notEqual(key: Parameters<WhereClause['notEqual']>['0']): Collection<T, TKey> {

            const newKey = mapValuesToBinary(key);
            return super.notEqual(newKey);
        }


        constructor(
            table: Table<T, TKey>,
            index?: string,
            orCollection?: Collection<T, TKey>
        ) {
            super(table, index, orCollection);
        }

    };
}
