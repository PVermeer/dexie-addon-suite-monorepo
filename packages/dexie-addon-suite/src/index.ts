import { OnSerialize } from "@pvermeer/dexie-class-addon";
import { Encryption } from "@pvermeer/dexie-encrypted-addon";
import type { PopulateOptions } from "@pvermeer/dexie-populate-addon";
import { Populated, Ref } from "@pvermeer/dexie-populate-addon";
import { IDatabaseChange } from "@pvermeer/dexie-rxjs-addon";
import type {
  ObservableTablePopulated,
  PopulatedTableObservable,
} from "./table-extended.class";

// Merge types from all packages
export type {} from "@pvermeer/dexie-class-addon";
export type {} from "@pvermeer/dexie-encrypted-addon";
export type {} from "@pvermeer/dexie-immutable-addon";
// This import / export is necessary because there is no support for ts-paths or monorepos
// See https://github.com/timocov/dts-bundle-generator/issues/93
// eslint-disable-next-line import/no-extraneous-dependencies
export type {
  DatabaseChangeType,
  ICreateChange,
  IDatabaseChange,
  IDeleteChange,
  IUpdateChange,
} from "dexie-observable/api";
export { addonSuite } from "./addon-suite";
export type {
  ObservableTablePopulated,
  PopulatedTableObservable,
} from "./table-extended.class";
export { Encryption };
export type { Ref, Populated, PopulateOptions, OnSerialize };

// ----
// Do not merge types from these packages (overwritten with new functionality by addon-suite)
// export type { } from '@pvermeer/dexie-populate-addon';
// export type { } from '@pvermeer/dexie-rxjs-addon';
// ----

declare module "dexie" {
  interface Database {
    /**
     * Get on('changes') from 'dexie-observable' as an RxJs observable and observe changes.
     * @link https://dexie.org/docs/Observable/Dexie.Observable
     */
    changes$: import("rxjs").Observable<IDatabaseChange[]>;
  }

  // DTS-bundler compiler craps out on extending the Table interface because reasons...
  // Implementing direct seems to be no problem.
  /**
   * Extended Table class with suite methods.
   */
  interface Table<T, TKey> {
    $: ObservableTablePopulated<T, TKey>;
    populate<B extends boolean = false, K extends string = string>(
      keysOrOptions?: K[] | PopulateOptions<B>,
      options?: PopulateOptions<B>
    ): PopulatedTableObservable<T, TKey, B, K>;
  }

  /**
   * Extend Transaction interface
   */
  interface Transaction {
    raw?: boolean;
  }
}
