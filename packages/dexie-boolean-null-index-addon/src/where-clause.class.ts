export {};

// import { Collection, Dexie, IndexableType, Table } from "dexie";
// import { NullKey } from "./null-key.class";
// import { DexieExtended } from "./types";
// import { increaseValueBy, lowerValueBy, nullToString, valueIsHigher } from "./utils";

// function compoundError() {
//     return new TypeError(`Dexie-Null-Index-Addon: Compound queries are not supported as these also do not work in Dexie.`);
// }

// function simpleTypeError() {
//     return new TypeError(`Dexie-Null-Index-Addon: Value must be of type 'string | number | Date'`);
// }


// export function getWhereClauseExtended(db: Dexie, nullStringValue: NullKey) {

//     const WhereClause = db.WhereClause as DexieExtended['WhereClause'];
//     // const Collection = db.Collection as DexieExtended['Collection'];

//     return class NullIndexWhereClause<T, TKey> extends WhereClause<T, TKey> {

//         public override equals(key: IndexableType): Collection<T, TKey> {

//             const newKey = nullToString(key, nullStringValue);
//             return super.equals(newKey);
//         }

//         public override above(value: string | number | Date): Collection<T, TKey> {

//             if (Array.isArray(value)) throw compoundError();
//             if (typeof value !== 'string' && typeof value !== 'number' && !(value instanceof Date)) {
//                 throw simpleTypeError();
//             }

//             const higherValue = valueIsHigher(value, nullStringValue) ? value : nullStringValue;

//             // Using indexed-db range (via Dexie) to filter out the null string value, starting from 'value'
//             const query = super.inAnyRange(
//                 [
//                     [higherValue, nullStringValue],
//                     [nullStringValue, Dexie.maxKey]
//                 ],
//                 {
//                     includeLowers: false,
//                     includeUppers: false
//                 }
//             );

//             return query;
//         }

//         public override aboveOrEqual(value: string | number | Date): Collection<T, TKey> {

//             if (Array.isArray(value)) throw compoundError();
//             if (typeof value !== 'string' && typeof value !== 'number' && !(value instanceof Date)) {
//                 throw simpleTypeError();
//             }

//             const loweredValue = lowerValueBy(value);
//             const higherValue = valueIsHigher(loweredValue, nullStringValue) ? loweredValue : nullStringValue;

//             // Using indexed-db range (via Dexie) to filter out the null string value, starting from 'value'
//             const query = super.inAnyRange(
//                 [
//                     [higherValue, nullStringValue],
//                     [nullStringValue, Dexie.maxKey]
//                 ],
//                 {
//                     includeLowers: false,
//                     includeUppers: false
//                 }
//             );

//             return query;
//         }

//         public override anyOf(..._values: (IndexableType | null)[]): Collection<T, TKey>;
//         public override anyOf(_values: readonly (IndexableType | null)[]): Collection<T, TKey>;
//         public override anyOf(_values: unknown) {

//             // eslint-disable-next-line prefer-rest-params
//             const values = <(IndexableType | null)[]>(arguments.length === 1 ? _values : [...arguments]);
//             const mappedValues = values.map(value => nullToString(value, nullStringValue));

//             return super.anyOf(mappedValues);
//         }

//         public override below(value: string | number | Date): Collection<T, TKey> {

//             if (Array.isArray(value)) throw compoundError();
//             if (typeof value !== 'string' && typeof value !== 'number' && !(value instanceof Date)) {
//                 throw simpleTypeError();
//             }

//             const higherValue = valueIsHigher(value, nullStringValue) ? value : nullStringValue;

//             // Using indexed-db range (via Dexie) to filter out the null string value, starting from 'minKey'
//             const query = super.inAnyRange(
//                 [
//                     [Dexie.minKey, higherValue],
//                     [higherValue, value],
//                 ],
//                 {
//                     includeLowers: false,
//                     includeUppers: false
//                 }
//             );

//             return query;
//         }
//         public override belowOrEqual(value: string | number | Date): Collection<T, TKey> {

//             if (Array.isArray(value)) throw compoundError();
//             if (typeof value !== 'string' && typeof value !== 'number' && !(value instanceof Date)) {
//                 throw simpleTypeError();
//             }

//             const increasedValue = increaseValueBy(value);
//             const higherValue = valueIsHigher(increasedValue, nullStringValue) ? increasedValue : nullStringValue;

//             // Using indexed-db range (via Dexie) to filter out the null string value, starting from 'minKey'
//             const query = super.inAnyRange(
//                 [
//                     [Dexie.minKey, higherValue],
//                     [higherValue, increasedValue],
//                 ],
//                 {
//                     includeLowers: false,
//                     includeUppers: false
//                 }
//             );

//             return query;
//         }

//         constructor(
//             table: Table<T, TKey>,
//             index?: string,
//             orCollection?: Collection<T, TKey>
//         ) {
//             super(table, index, orCollection);
//         }

//     };
// }
