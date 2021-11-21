
export type Unpacked<T> =
    T extends (infer U)[] ? U :
    T extends (...args: any[]) => infer V ? V :
    T extends Promise<infer W> ? W :
    never;

export type OmitMethods<T> = Pick<T, { [P in keyof T]: T[P] extends (...args: any[]) => any ? never : P; }[keyof T]>;
export type PickMethods<T> = Pick<T, { [P in keyof T]: T[P] extends (...args: any[]) => any ? P : never; }[keyof T]>;

export type IsUnion<T> = [T] extends [UnionToIntersection<T>] ? false : true;

export type TypeName<T> =
    T extends string ? 'string' :
    T extends number ? 'number' :
    T extends boolean ? 'boolean' :
    T extends null ? 'null' :
    T extends undefined ? 'undefined' :
    T extends any[] ? 'array' :
    T extends (...args: any[]) => any ? 'function' :
    'object';

export type ValuesOf<T> = T[keyof T];

export type UnionToIntersection<U> =
    (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I
    : never;

export type IsObject<T, O = TypeName<T>> =
    IsUnion<O> extends true ? false :
    O extends 'object' ? true :
    false;

// ==== Flatten object ====


// Old recursive errors in TS >= 4

// type NonObjectKeysOf<T> = {
//     [K in keyof T]: IsObject<T[K]> extends false ? K : never
// }[keyof T];
// type NonObjectPropertiesOf<T> = Pick<T, NonObjectKeysOf<T>>;
// type ObjectValuesOf<T> = ValuesOf<Omit<T, NonObjectKeysOf<T>>>;

// type FlattenOnce<T> = NonObjectPropertiesOf<T> &
//     UnionToIntersection<ObjectValuesOf<T>>;

// type FlattenDeepRecursive<T, KeepOriginal> = {
//     [K in keyof T]:
//     IsObject<T[K]> extends false ? T[K] :
//     FlattenDeep<T[K], KeepOriginal>
// };
// type FlattenDeep<T, KeepOriginal = undefined> =
//     KeepOriginal extends true ?
//     // eslint-disable-next-line @typescript-eslint/ban-ts-comment
//     // @ts-ignore
//     T & FlattenOnce<FlattenDeepRecursive<T, KeepOriginal>> :
//     FlattenOnce<FlattenDeepRecursive<T, KeepOriginal>>;

// export type Flatten<T, KeepOriginal extends boolean = false> = FlattenDeep<Required<T>, KeepOriginal>;


type Primitive = string | number | boolean;

type FlattenPairs<T, KeepOriginal> = {
    [K in keyof T]: T[K] extends Primitive ?
    [K, T[K]] & KeepOriginal extends true ? T : never:
    FlattenPairs<T[K], KeepOriginal> & KeepOriginal extends true ? T : never
}[keyof T] & [PropertyKey, Primitive];

export type Flatten<T, KeepOriginal extends boolean = false> = {
    [P in FlattenPairs<T, KeepOriginal> as P[0]]: P[1];
};
// =====================


// type Primitive = string | number | boolean
// type FlattenPairs<T> = {[K in keyof T]: T[K] extends Primitive ? [K, T[K]] : FlattenPairs<T[K]>}[keyof T] & [PropertyKey, Primitive]
// export type Flatten<T> = {[P in FlattenPairs<T> as P[0]]: P[1]}
