export { };

// import { Collection, DBCoreKeyRange, Dexie, WhereClause } from 'dexie';
// import { NullKey } from './null-key.class';
// import { DexieExtended } from './types';

// export interface NullIndexCollection<T, TKey> extends Collection<T, TKey> { }

// export function getCollectionExtended(db: Dexie, _nullStringValue: NullKey) {

//     const Collection = db.Collection as DexieExtended['Collection'];

//     return class NullIndexCollection<T, TKey> extends Collection<T, TKey> {


//         // Remap
//         public or(...args: Parameters<Collection<T, TKey>['or']>): WhereClause<T, TKey> {

//             return super.or(...args);
//         }


//         constructor(
//             whereClause: WhereClause | null,
//             keyRangeGenerator?: () => DBCoreKeyRange
//         ) {
//             super(whereClause, keyRangeGenerator);
//         }

//     };
// }
