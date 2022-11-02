import cloneDeepWith from "lodash.clonedeepwith";
import isObject from "lodash.isobject";
import { IndexableTypeExtended } from "./types";

// Keep it simple
const textEncoder = new TextEncoder();

export const TRUE_STRING = '__*true*___';
export const FALSE_STRING = '__*false*___';
export const NULL_STRING = '__*null*___';

export const TRUE_BINARY = textEncoder.encode(TRUE_STRING);
export const FALSE_BINARY = textEncoder.encode(FALSE_STRING);
export const NULL_BINARY = textEncoder.encode(NULL_STRING);

export const TRUE_CHAR_STRING = TRUE_BINARY.toString();
export const FALSE_CHAR_STRING = FALSE_BINARY.toString();
export const NULL_CHAR_STRING = NULL_BINARY.toString();

export const MIN_BINARY = new Uint8Array(0);

type Input = { [key: string]: any; } | IndexableTypeExtended;

function mapToBinary(value: unknown): void | Uint8Array {
    if (value === true) return TRUE_BINARY;
    if (value === false) return FALSE_BINARY;
    if (value === null) return NULL_BINARY;
    return;
}

function mapToValue(value: unknown): IndexableTypeExtended | void {

    if (!(value instanceof Uint8Array)) return;
    const stringValue = value.toString();
    if (stringValue === TRUE_CHAR_STRING) return true;
    if (stringValue === FALSE_CHAR_STRING) return false;
    if (stringValue === NULL_CHAR_STRING) return null;
    return;
}

export function mapValuesToBinary<T extends Input>(input: T): T {

    if (isObject(input)) {

        return cloneDeepWith(input, (value, _key, _object, _stack) => {

            return mapToBinary(value);
        });

    }

    const mapped = mapToBinary(input);
    if (mapped !== undefined) return mapped as unknown as T;

    return input;
}

export function mapBinaryToValues<T extends Input>(input: T): T {

    if (isObject(input)) {

        return cloneDeepWith(input, (value: any, _key: number | string | undefined, _object: T | undefined, _stack: any) => {

            return mapToValue(value);
        });

    }

    const mapped = mapToValue(input);
    if (mapped !== undefined) return mapped as unknown as T;

    return input;

}
