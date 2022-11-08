import cloneDeepWith from "lodash.clonedeepwith";
import isObject from "lodash.isobject";
import { IndexableTypeExtended } from "./types";

type Input = { [key: string]: any; } | IndexableTypeExtended;

export class IndexValueEncoder {

    private static readonly IndexValueEncoderInstance = new IndexValueEncoder();
    private static readonly TEXT_ENCODER = new TextEncoder();

    public static readonly TRUE_STRING = '___*true*___';
    public static readonly FALSE_STRING = '___*false*___';
    public static readonly NULL_STRING = '___*null*___';

    public static readonly TRUE_TYPED_ARRAY = this.TEXT_ENCODER.encode(this.TRUE_STRING);
    public static readonly FALSE_TYPED_ARRAY = this.TEXT_ENCODER.encode(this.FALSE_STRING);
    public static readonly NULL_TYPED_ARRAY = this.TEXT_ENCODER.encode(this.NULL_STRING);

    public static readonly TRUE_BINARY = this.TRUE_TYPED_ARRAY.buffer;
    public static readonly FALSE_BINARY = this.FALSE_TYPED_ARRAY.buffer;
    public static readonly NULL_BINARY = this.NULL_TYPED_ARRAY.buffer;

    public static readonly MIN_BINARY = new Uint8Array(0).buffer;

    public static Get(): IndexValueEncoder {

        return IndexValueEncoder.IndexValueEncoderInstance;
    }

    private typedArraysAreEqual(a: Uint8Array, b: Uint8Array) {

        if (a.byteLength !== b.byteLength) return false;
        return a.every((val, i) => val === b[i]);
    }

    private arrayBuffersAreEqual(a: ArrayBuffer, b: ArrayBuffer) {

        if (a.byteLength !== b.byteLength) return false;

        const typedArrayA = new Uint8Array(a);
        const typedArrayB = new Uint8Array(b);

        return typedArrayA.every((value, i) => value === typedArrayB[i]);
    }


    public mapToBinary(value: unknown): void | ArrayBuffer {

        if (value === true) return IndexValueEncoder.TRUE_BINARY;
        if (value === false) return IndexValueEncoder.FALSE_BINARY;
        if (value === null) return IndexValueEncoder.NULL_BINARY;
        return;
    }

    public mapToValue(value: unknown): IndexableTypeExtended | void {

        if (!(value instanceof ArrayBuffer)) return;
        const typedArray = new Uint8Array(value);

        if (this.typedArraysAreEqual(typedArray, IndexValueEncoder.TRUE_TYPED_ARRAY)) return true;
        if (this.typedArraysAreEqual(typedArray, IndexValueEncoder.FALSE_TYPED_ARRAY)) return false;
        if (this.typedArraysAreEqual(typedArray, IndexValueEncoder.NULL_TYPED_ARRAY)) return null;
        return;
    }

    public mapValuesToBinary<T extends Input>(input: T): T {

        const mapped = this.mapToBinary(input);
        if (mapped !== undefined) return mapped as unknown as T;

        if (isObject(input)) {

            return cloneDeepWith(input, (value, _key, _object, _stack) => {

                return this.mapToBinary(value);
            });

        }

        return input;
    }

    public mapBinaryToValues<T extends Input>(input: T): T {

        const mapped = this.mapToValue(input);
        if (mapped !== undefined) return mapped as unknown as T;

        if (isObject(input)) {

            return cloneDeepWith(input, (value: any, _key: number | string | undefined, _object: T | undefined, _stack: any) => {

                return this.mapToValue(value);
            });

        }

        return input;
    }

    public isTrueBinary(buffer: ArrayBuffer): boolean {

        return this.arrayBuffersAreEqual(buffer, IndexValueEncoder.TRUE_BINARY);
    }

    public isFalseBinary(buffer: ArrayBuffer): boolean {

        return this.arrayBuffersAreEqual(buffer, IndexValueEncoder.FALSE_BINARY);
    }

    public isNullBinary(buffer: ArrayBuffer): boolean {

        return this.arrayBuffersAreEqual(buffer, IndexValueEncoder.NULL_BINARY);
    }

}
