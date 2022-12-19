import { MonoTypeOperatorFunction } from "rxjs";
import { operate } from "rxjs/internal/util/lift";
import { createOperatorSubscriber } from "rxjs/internal/operators/OperatorSubscriber";
import isEqual from "lodash.isequal";
import cloneDeep from "lodash.clonedeep";

export function mixinClass(target: any, source: any): void {

    function mixin(target: any, object: any): any {
        const prototype = Object.getPrototypeOf(object);
        Object.getOwnPropertyNames(prototype).forEach(name => {
            if (target[name] !== undefined) { return; }
            Object.defineProperty(
                Object.getPrototypeOf(target),
                name,
                Object.getOwnPropertyDescriptor(prototype, name)!
            );
        });
        const prototypeChain = Object.getPrototypeOf(prototype);
        if (prototypeChain) return mixin(target, prototype);
    }

    Object.keys(source).forEach(key => {
        if (key === 'constructor' || target[key] !== undefined) { return; }
        target[key] = source[key];
    });

    mixin(target, source);
}

/**
 * New implementation to fix reference issues.
 * 
 * https://github.com/ReactiveX/rxjs/blob/630d2b009b5ae4e8f2a62d9740738c1ec317c2d5/src/internal/operators/distinctUntilChanged.ts
 */
export function distinctUntilChangedIsEqual<T>(): MonoTypeOperatorFunction<T> {

    return operate((source, subscriber) => {
        let previous: T;
        let first = true;
  
        source.subscribe(
            createOperatorSubscriber(subscriber, (value) => {

                // Create new internal references
                const current = cloneDeep(value);
  
                if (first || !isEqual(previous, current)) {
                    first = false;
                    previous = current;
                    subscriber.next(value);
                }
            })
        );
    });
}
  