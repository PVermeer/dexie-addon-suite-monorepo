Dexie RxJs Addon
======

[![NPM Version](https://img.shields.io/npm/v/@pvermeer/dexie-rxjs-addon/latest.svg)](https://www.npmjs.com/package/@pvermeer/dexie-rxjs-addon)
[![Build Status](https://travis-ci.com/PVermeer/dexie-rxjs-addon.svg?branch=master)](https://travis-ci.com/PVermeer/dexie-rxjs-addon)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)

This addon can be used as a stand-alone addon for Dexie.js yet is also part of dexie-addon-suite [![NPM Version](https://img.shields.io/npm/v/@pvermeer/dexie-addon-suite/latest.svg)](https://www.npmjs.com/package/@pvermeer/dexie-addon-suite)
 that combines a number of addons for Dexie. It contains code to combine some addons like populated rxjs observables.

Install over npm
----------------
```
npm install @pvermeer/dexie-rxjs-addon rxjs
```

#### Dependencies
**rxjs**: https://rxjs-dev.firebaseapp.com/

**Dexie.js**: 
Dexie Populate Addon depends on Dexie.js v3. 
```
npm install dexie
```
At the time of writing Dexie v3 is in the RC stage. To install this version you have to use the @next npm version. Current version of Dexie.js: [![NPM Version](https://img.shields.io/npm/v/dexie/latest.svg)](https://www.npmjs.com/package/dexie)
```
npm install dexie@next
```

Documentation
----------------

#### Extend RxJs to your Dexie Database!

Plugin is written to extend Dexie.js with your own RxJs by adding methods and properties to the Dexie classes.
RxJs is not bundled so you can use your own implementation.

This addon implements the [Dexie.Observable](https://dexie.org/docs/Observable/Dexie.Observable) addon to detect changes.

### How to use
#### Addon
Add dexieRxjs() to your Dexie database. See below examples and https://dexie.org for more info.

#### changes$
On the Dexie database itself you can get an observable for all changes. It reflects the [Dexie.Observable](https://dexie.org/docs/Observable/Dexie.Observable) addon. See https://dexie.org/docs/Observable/Dexie.Observable for more info.

```ts
interface Database {
    /**
     * Get on('changes') from 'dexie-observable' as an RxJs observable and observe changes.
     * @link https://dexie.org/docs/Observable/Dexie.Observable
     */
    changes$: Observable<(import('dexie-observable/api').IDatabaseChange[])>;
}
```

#### Table.$
The Dexie Tables are extended with `$` property. This returns a `ObservableTable` with many normal Table methods but now they return `Observable` instead of a `DexiePromise`.

```ts
interface TableExtended<T, TKey> {
	$: ObservableTable<T, TKey>;
}
```

#### ObservableTable
Instead of the `Dexie.Table` an `ObservableTable` is returned after using `$`.

```ts
class ObservableTable<T, TKey> {
	/**
	 * Observable stream of the complete Table.
	 * Emits updated Table array on changes.
	 * @note Stays open so unsubscribe.
	 */
	toArray(): Observable<T[]>;
	/**
	 * Observable stream of a get request.
	 * Emits updated value on changes.
	 * @note Stays open so unsubscribe.
	 */
	get(keyOrequalityCriterias: TKey | {
		[key: string]: any;
	}): Observable<T | undefined>;
    /**
     * Observable stream of a where query.
     * Emits updated values on changes, including new or updated records that are in range.
     * @return ObservableWhereClause that behaves like a normal Dexie where-clause or an ObservableCollection.
     * ObservableCollection has one method: `toArray()`, since RxJs operators can be used.
     * Will be exanded on for convenience in the future.
     * @note Stays open so unsubscribe.
     */
	where(index: string | string[]): ObservableWhereClause<T, TKey>;
	where(equalityCriterias: { [key: string]: IndexableType; }): ObservableCollection<T, TKey>;
}
```

#### Example
```ts
import { Subscription } from 'rxjs';

const subs = new Subscription();

const friends = get20Friends(); // Array of 20 friends
await db.friends.bulkAdd(Friends); 

const friend$ = await db.friends.$.get(1);
const table$ = await db.friends.$.toArray();
const friends$ = await db.friends.$.where(':id').anyOf([1, 13]).toArray();

const noFriends$ = await db.friends.$.where(':id').equals(99).toArray();
const lateFriend$ = await db.friends.$.where('customId').equals(4556).toArray();

// All observables emit on subscribe
subs.add(
     // Logs friend with id 1
    friend$.subscribe(friend => { console.log(friend); })
);
subs.add(
    // Logs all 20 friends []
    table$.subscribe(friends => { console.log(friends); })
);
subs.add(
    // Logs only friends with id 1 and 13 []
    friends$.subscribe(friends => { console.log(friends); })
);
subs.add(
    // Logs empty array, does not emit until a friend with id 99 is added to the table
    noFriends$.subscribe(friends => { console.log(friends); })
);
subs.add(
    // Logs empty array, does not emit until a friend with customId 4556 is added to the table
    lateFriend$.subscribe(friends => { console.log(friends); })
);

await db.friends.update(1, { name: 'Testie' });
// Expect only friend$, table$, friends$ to log their updated results.

await db.friends.add({ customId: 4556 });
// Expect only table$ and lateFriend$ to log their results.

// Don't forget to unsubscribe when done! (many ways to handle this, see RxJs documentation and guides / blogs)
subs.unsubscribe();
```

### Load the addon
#### Example (ES6)
```js
import Dexie from 'dexie';
import { dexieRxjs } from '@pvermeer/dexie-rxjs-addon';

// Declare Database
const db = new Dexie("FriendDatabase", {
    addons: [dexieRxjs]
});
db.version(1).stores({ friends: "++id, name, shoeSize, age" });

// Open the database
db.open()
    .then(() => {
        console.log('DB loaded! :D')
        // Use Dexie
    });
```

#### Example (Typescript)
```ts
import Dexie from 'dexie';
import { dexieRxjs } from '@pvermeer/dexie-rxjs-addon';

interface Friend {
    id?: number;
    name?: string;
    shoeSize?: number;
    age?: number;
}

// Declare Database
class FriendsDatabase extends Dexie {
    public friends: Dexie.Table<Friend, string>;
    constructor(name: string) {
        super(name);
        dexieRxjs(this);
        this.version(1).stores({
            friends: '++id, name, shoeSize, age'
        });
    }
}

const db = new FriendDatabase('FriendsDatabase');

// Open the database
db.open()
    .then(() => {
        console.log('DB loaded! :D')
        // Use Dexie
    });
```

#### Example (HTML import)

Bundled & minified package: <https://unpkg.com/@pvermeer/dexie-rxjs-addon@latest/dist/dexie-rxjs-addon.min.js>.

Addon is export as namespace DexieRxjsAddon

```html
<!doctype html>
<html>
    <head>
        <!-- Include Dexie -->
        <script src="https://unpkg.com/dexie@latest/dist/dexie.js"></script>

        <!-- Include RxJs -->
        <script src="https://unpkg.com/rxjs/dist/bundles/rxjs.umd.min.js"></script>

        <!-- Include DexieRxjsAddon (always after dependencies) -->
        <script src="https://unpkg.com/@pvermeer/dexie-rxjs-addon@latest/dist/dexie-rxjs-addon.min.js"></script>

        <script>

            // Define your database
            const db = new Dexie("FriendDatabase", {
                addons: [DexieRxjsAddon.dexieRxjs]
            });
            db.version(1).stores({ friends: "++id, name, shoeSize, age" });

            // Open the database
            db.open()
                .then(() => {
                    console.log('DB loaded! :D')
                    // Do Dexie stuff
                });
        </script>
    </head>
</html>

```

API
---
The packet exposes a single export:

```ts
function dexieRxjs(db: Dexie): void;
```

Also exports some other classes and types to support further extension. See declaration or source.

---------------------------------------------------

Dexie.js
========

Dexie.js is a wrapper library for indexedDB - the standard database in the browser. http://dexie.org
