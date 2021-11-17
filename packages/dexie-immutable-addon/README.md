Dexie Immutable Addon
======

[![NPM Version](https://img.shields.io/npm/v/@pvermeer/dexie-immutable-addon/latest.svg)](https://www.npmjs.com/package/@pvermeer/dexie-immutable-addon)
[![NPM Version](https://img.shields.io/npm/v/@pvermeer/dexie-immutable-addon/beta.svg)](https://www.npmjs.com/package/@pvermeer/dexie-immutable-addon)
[![Build Status](https://travis-ci.com/PVermeer/dexie-immutable-addon.svg?branch=master)](https://travis-ci.com/PVermeer/dexie-immutable-addon)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)

This addon can be used as a stand-alone addon for Dexie.js, yet is also part of dexie-addon-suite [![NPM Version](https://img.shields.io/npm/v/@pvermeer/dexie-addon-suite/latest.svg)](https://www.npmjs.com/package/@pvermeer/dexie-addon-suite)
 that combines a number of addons for Dexie. It contains code to combine some addons like populated rxjs observables.

Install over npm
----------------
```
npm install @pvermeer/dexie-immutable-addon
```

#### Dexie.js
Dexie Immutable Addon depends on Dexie.js v3. 
```
npm install dexie
```
At the time of writing Dexie v3 is in the RC stage. To install this version you have to use the @next npm version. Current version of Dexie.js: [![NPM Version](https://img.shields.io/npm/v/dexie/latest.svg)](https://www.npmjs.com/package/dexie)
```
npm install dexie@next
```

Documentation
----------------

### How to use
#### Addon
Add immutable() to your Dexie database. See below examples and https://dexie.org for more info.

This addon just overwrites the save methods of Dexie.js and uses the Lodash cloneDeep method before saving records to IndexedDb. This prevents the original input object to be modified by Dexie. For example: an `++id` in your Table schema and using `add()` mutates the input object to `{ id: <some number>, ...originalObject }`, while `bulkAdd()` does not mutate the input objects. In combination with other addons, that mutate input (e.g.: encryption), this could lead to some weird and unexpected behavior.

### Create Dexie database
#### ES6
```js
import Dexie from 'dexie';
import { immutable } from '@pvermeer/dexie-immutable-addon';

// Declare Database
const db = new Dexie("FriendDatabase", {
    addons: [immutable]
});
db.version(1).stores({
    friends: '++id, firstName, lastName, shoeSize, age'
});

// Open the database
db.open()
    .then(() => {
        console.log('DB loaded! :D')
        // Use Dexie
    });
```

#### Typescript
```ts
import Dexie from 'dexie';
import { immutable } from '@pvermeer/dexie-immutable-addon';

// Declare Database
class FriendsDatabase extends Dexie {

    public friends: Dexie.Table<Friend, number>;

    constructor(name: string) {
        super(name);

        immutable(this);

        this.version(1).stores({
            friends: '++id, firstName, lastName, shoeSize, age'
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

#### HTML import

Bundled & minified package: <https://unpkg.com/@pvermeer/dexie-immutable-addon@latest/dist/dexie-immutable-addon.min.js>.

Addon is export as namespace DexieImmutableAddon

```html
<!doctype html>
<html>
    <head>
        <!-- Include Dexie (@next if v3 is still in RC) -->
        <script src="https://unpkg.com/dexie@latest/dist/dexie.js"></script> 

        <!-- Include DexieImmutableAddon (always after Dexie, it's a dependency) -->
        <script src="https://unpkg.com/@pvermeer/dexie-immutable-addon@latest/dist/dexie-immutable-addon.min.js"></script>

        <script>
            // Define your database
            const db = new Dexie("FriendDatabase", {
                addons: [DexieImmutableAddon.immutable]
            });
            db.version(1).stores({
                friends: '++id, firstName, lastName, shoeSize, age'
            });

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
The packet exposes one export:

#### immutable - addon function
```ts
function immutable(db: Dexie): void;
```

---------------------------------------------------

Dexie.js
========

Dexie.js is a wrapper library for indexedDB - the standard database in the browser. https://dexie.org
