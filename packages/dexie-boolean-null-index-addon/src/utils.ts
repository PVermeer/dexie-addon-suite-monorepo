import { IndexableType } from "dexie";
import cloneDeepWith from "lodash.clonedeepwith";
import isObject from "lodash.isobject";

// Keep it simple
export const TRUE_STRING = 'true';
export const FALSE_STRING = 'false';
export const NULL_STRING = 'null';

type Value = boolean | null;
type Input = { [key: string]: any; } | IndexableType;

function mapToString(value: unknown): string | void {
    if (value === true) return TRUE_STRING;
    if (value === false) return FALSE_STRING;
    if (value === null) return NULL_STRING;
    return;
}

function mapToValue(value: unknown): Value | void {
    if (value === TRUE_STRING) return true;
    if (value === FALSE_STRING) return false;
    if (value === NULL_STRING) return null;
    return;
}

export function mapValuesToString<T extends Input>(input: T): T {

    if (isObject(input)) {

        return cloneDeepWith(input, (value, _key, _object, _stack) => {

            return mapToString(value);
        });

    }

    const mapped = mapToString(input);
    if (mapped !== undefined) return mapped as T;

    return input;
}

export function mapStringToValues<T extends Input>(input: T): T {

    if (isObject(input)) {

        return cloneDeepWith(input, (value: any, _key: number | string | undefined, _object: T | undefined, _stack: any) => {

            return mapToValue(value);
        });

    }

    const mapped = mapToValue(input);
    if (mapped !== undefined) return mapped as unknown as T;

    return input;

}
