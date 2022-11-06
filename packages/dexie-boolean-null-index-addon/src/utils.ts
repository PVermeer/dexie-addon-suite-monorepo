import cloneDeepWith from "lodash.clonedeepwith";
import isObject from "lodash.isobject";
import { IndexableTypeExtended } from "./types";

// Keep it simple
const textEncoder = new TextEncoder();

export const TRUE_STRING = '___*true*___';
export const FALSE_STRING = '___*false*___';
export const NULL_STRING = '___*null*___';

export const TRUE_TYPED_ARRAY = textEncoder.encode(TRUE_STRING);
export const FALSE_TYPED_ARRAY = textEncoder.encode(FALSE_STRING);
export const NULL_TYPED_ARRAY = textEncoder.encode(NULL_STRING);

export const TRUE_BINARY = TRUE_TYPED_ARRAY.buffer;
export const FALSE_BINARY = FALSE_TYPED_ARRAY.buffer;
export const NULL_BINARY = NULL_TYPED_ARRAY.buffer;

export const MIN_BINARY = new Uint8Array(0).buffer;

type Input = { [key: string]: any; } | IndexableTypeExtended;

export function typedArraysAreEqual(a: Uint8Array, b: Uint8Array) {

    if (a.byteLength !== b.byteLength) return false;
    return a.every((val, i) => val === b[i]);
}

export function arrayBuffersAreEqual(a: ArrayBuffer, b: ArrayBuffer) {

    if (a.byteLength !== b.byteLength) return false;

    const typedArrayA = new Uint8Array(a);
    const typedArrayB = new Uint8Array(b);

    return typedArrayA.every((value, i) => value === typedArrayB[i]);
}

function mapToBinary(value: unknown): void | ArrayBuffer {

    if (value === true) return TRUE_BINARY;
    if (value === false) return FALSE_BINARY;
    if (value === null) return NULL_BINARY;
    return;
}

function mapToValue(value: unknown): IndexableTypeExtended | void {

    if (!(value instanceof ArrayBuffer)) return;
    const typedArray = new Uint8Array(value);

    if (typedArraysAreEqual(typedArray, TRUE_TYPED_ARRAY)) return true;
    if (typedArraysAreEqual(typedArray, FALSE_TYPED_ARRAY)) return false;
    if (typedArraysAreEqual(typedArray, NULL_TYPED_ARRAY)) return null;
    return;
}

export function mapValuesToBinary<T extends Input>(input: T): T {

    const mapped = mapToBinary(input);
    if (mapped !== undefined) return mapped as unknown as T;

    if (isObject(input)) {

        return cloneDeepWith(input, (value, _key, _object, _stack) => {

            return mapToBinary(value);
        });

    }

    return input;
}

export function mapBinaryToValues<T extends Input>(input: T): T {

    const mapped = mapToValue(input);
    if (mapped !== undefined) return mapped as unknown as T;

    if (isObject(input)) {

        return cloneDeepWith(input, (value: any, _key: number | string | undefined, _object: T | undefined, _stack: any) => {

            return mapToValue(value);
        });

    }

    return input;
}
