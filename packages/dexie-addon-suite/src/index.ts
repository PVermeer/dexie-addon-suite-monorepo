import type { PopulateOptions } from '@pvermeer/dexie-populate-addon';
import type { ObservableTablePopulated, PopulatedTableObservable } from './table-extended.class';
import { Encryption } from '@pvermeer/dexie-encrypted-addon';

export { addonSuite } from './addon-suite';
export type { ObservableTablePopulated, PopulatedTableObservable } from './table-extended.class';
export { Encryption };


declare module 'dexie' {

    // DTS-bundler compiler craps out on extending the Table interface because reasons...
    // Implementing direct seems to be no problem.
    /**
     * Extended Table class with suite methods.
     */
    interface Table<T, TKey> {
        $: ObservableTablePopulated<T, TKey>;
        populate<B extends boolean = false, K extends string = string>(
            keys: K[],
            options?: PopulateOptions<B>
        ): PopulatedTableObservable<T, TKey, B, K>;
        populate<B extends boolean = false>(options?: PopulateOptions<B>): PopulatedTableObservable<T, TKey, B, string>;
        populate<B extends boolean = false, K extends string = string>(
            keysOrOptions?: K[] | PopulateOptions<B>
        ): PopulatedTableObservable<T, TKey, B, K>;
    }

}
