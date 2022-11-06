/* eslint-disable @typescript-eslint/no-explicit-any */
import { PromiseExtended } from 'dexie';

export type ReturnTypeDexiePromise_rxjs<P extends (...args: any[]) => any> = ReturnType<P> extends PromiseExtended<infer T> ? T : ReturnType<P>;
