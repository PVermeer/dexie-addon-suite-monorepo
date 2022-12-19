import cloneDeep from "lodash.clonedeep";
import isEqual from "lodash.isequal";
import { MonoTypeOperatorFunction } from "rxjs";
import { createOperatorSubscriber } from "rxjs/internal/operators/OperatorSubscriber";
import { operate } from "rxjs/internal/util/lift";

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
