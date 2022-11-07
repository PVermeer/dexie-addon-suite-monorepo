Dexie Boolean Null Index Addon
======

[![NPM Version](https://img.shields.io/npm/v/@pvermeer/dexie-boolean-null-index-addon/latest.svg)](https://www.npmjs.com/package/@pvermeer/dexie-boolean-null-index-addon)
[![NPM Version](https://img.shields.io/npm/v/@pvermeer/dexie-boolean-null-index-addon/beta.svg)](https://www.npmjs.com/package/@pvermeer/dexie-boolean-null-index-addon)
![master](https://github.com/pvermeer/dexie-addon-suite-monorepo/actions/workflows/ci.yml/badge.svg?branch=master)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)

This addon can be used as a stand-alone addon for Dexie.js, yet is also part of dexie-addon-suite [![NPM Version](https://img.shields.io/npm/v/@pvermeer/dexie-addon-suite/latest.svg)](https://www.npmjs.com/package/@pvermeer/dexie-addon-suite)
 that combines a number of addons for Dexie. It contains code to combine some addons like populated rxjs observables.

Install over npm
----------------
```
npm install @pvermeer/dexie-boolean-null-index-addon
```

#### Dexie.js
Dexie Null Index Addon depends on Dexie.js v3. [![NPM Version](https://img.shields.io/npm/v/dexie/latest.svg)](https://www.npmjs.com/package/dexie)
```
npm install dexie
```

Documentation
----------------

### How to use
#### Addon
Add `booleanNullIndex()` to your Dexie database. See below examples and https://dexie.org for more info.

This addon uses hooks to update read and write operations. It save `null`, `true` and `false` as a binary value (`ArrayBuffer`) that IndexedDB can index. It maps the binary value back to `null`, `true` and `false` on read.

Some methods of `Table`, `WhereClause` and `Collection` are overwritten so everything works as expected per the Dexie documentation.

#### Wait for open
Always open the database yourself. Dexie does not wait for all hooks to be subscribed (bug?).
```ts
await db.open();
```
To help with this, the option 'autoOpen' has been disabled.

### Create Dexie database
#### ESM
```js
import Dexie from 'dexie';
import { booleanNullIndex } from '@pvermeer/dexie-boolean-null-index-addon';

// Declare Database
const db = new Dexie("FriendDatabase", {
    addons: [booleanNullIndex]
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
import { booleanNullIndex } from '@pvermeer/dexie-boolean-null-index-addon';

// Declare Database
class FriendsDatabase extends Dexie {

    public friends: Dexie.Table<Friend, number>;

    constructor(name: string) {
        super(name);

        booleanNullIndex(this);

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

Bundled & minified package: <https://unpkg.com/@pvermeer/dexie-boolean-null-index-addon@latest/dist/dexie-boolean-null-index-addon.min.js>.

Addon is exported as namespace `DexieBooleanNullIndexAddon`.

```html
<!doctype html>
<html>
    <head>
        <!-- Include Dexie (@next if v3 is still in RC) -->
        <script src="https://unpkg.com/dexie@latest/dist/dexie.js"></script> 

        <!-- Include DexieBooleanNullIndexAddon (always after Dexie, it's a dependency) -->
        <script src="https://unpkg.com/@pvermeer/dexie-boolean-null-index-addon@latest/dist/dexie-boolean-null-index-addon.min.js"></script>

        <script>
            // Define your database
            const db = new Dexie("FriendDatabase", {
                addons: [DexieBooleanNullIndexAddon.booleanNullIndex]
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

#### booleanNullIndex - addon function
```ts
function booleanNullIndex(db: Dexie): void;
```

---------------------------------------------------

Dexie.js
========

Dexie.js is a wrapper library for indexedDB - the standard database in the browser. https://dexie.org
