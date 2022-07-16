Dexie Class Addon
======

[![NPM Version](https://img.shields.io/npm/v/@pvermeer/dexie-class-addon/latest.svg)](https://www.npmjs.com/package/@pvermeer/dexie-class-addon)
[![NPM Version](https://img.shields.io/npm/v/@pvermeer/dexie-class-addon/beta.svg)](https://www.npmjs.com/package/@pvermeer/dexie-class-addon)
![master](https://github.com/pvermeer/dexie-addon-suite-monorepo/actions/workflows/test.yml/badge.svg?branch=master)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)

This addon can be used as a stand-alone addon for Dexie.js, yet is also part of dexie-addon-suite [![NPM Version](https://img.shields.io/npm/v/@pvermeer/dexie-addon-suite/latest.svg)](https://www.npmjs.com/package/@pvermeer/dexie-addon-suite)
 that combines a number of addons for Dexie. It contains code to combine some addons like populated rxjs observables.

Install over npm
----------------
```
npm install @pvermeer/dexie-class-addon
```

#### Dexie.js
Dexie Class Addon depends on Dexie.js v3. [![NPM Version](https://img.shields.io/npm/v/dexie/latest.svg)](https://www.npmjs.com/package/dexie)
```
npm install dexie
```

Documentation
----------------

### How to use
#### Addon
Add `classMap()` to your Dexie database. See below examples and https://dexie.org for more info.

This addon overwrites the save and read methods of Dexie.js and maps the record to class by calling the class constructor.
Dexie already has a method `mapToClass()` on tables for doing this, however this method does not call the constructor and does no serialization. This addon overwrites that method on the table so it will call the class constructor and also call the `serialize()` method if defined.

The `serialize()` must return an object with database keys as object keys and an arrow function for the value that returns the correct data to save to the database.

This package also export the `OnSerialize` interface for TypeScript classes. Implementing this in your database class makes sure you implement the serialize correctly.

Dexie supports nested updates with key paths `Table.update({'some.path': 'some value'})`. This addon treats these updates as raw. The addon does not run the `serialize()` method on these kind of updates.

Example (TypeScript):
```js
import { OnSerialize } from '@pvermeer/dexie-class-addon';

export class Friend implements OnSerialize {
    id?: number;
    age?: number;
    firstName: string;
    lastName: string;
    shoeSize: number;
    date: Date;

    someMethod() { return; }

    serialize() {
        return {
            id: () => this.id,
            age: () => this.age,
            firstName: () => this.firstName,
            lastName: () => this.lastName,
            shoeSize: () => this.shoeSize,
            date: () => this.date.getTime()
        };
    }

    deserialize(input: OmitMethods<Friend>) {
        Object.entries(input).forEach(([prop, value]) => this[prop] = value);
        this.date = new Date(input.date);
    }

    constructor(input: OmitMethods<Friend>) {
        this.deserialize(input);
    }
}

class FriendsDatabase extends Dexie {

    public friends: Dexie.Table<Friend, number>;

    constructor(name: string) {
        super(name);
        classMap(this);
        this.version(1).stores({
            friends: '++id, age',
        });

        this.friends.mapToClass(Friend);
    }
}
```

- On reading records, the class constructor will be called with the record as the first parameter.
- On saving records the `serialize()` method will be called if defined.


### Create Dexie database
#### ESM
```js
import Dexie from 'dexie';
import { classMap } from '@pvermeer/dexie-class-addon';

// Declare Database
const db = new Dexie("FriendDatabase", {
    addons: [classMap]
});
db.version(1).stores({
    friends: '++id, firstName, lastName, shoeSize, age'
});

db.friends.mapToClass(Friend);

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
import { classMap } from '@pvermeer/dexie-class-addon';

// Declare Database
class FriendsDatabase extends Dexie {

    public friends: Dexie.Table<Friend, number>;

    constructor(name: string) {
        super(name);

        classMap(this);

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

Bundled & minified package: <https://unpkg.com/@pvermeer/dexie-class-addon@latest/dist/dexie-class-addon.min.js>.

Addon is export as namespace DexieClassAddon

```html
<!doctype html>
<html>
    <head>
        <!-- Include Dexie -->
        <script src="https://unpkg.com/dexie@latest/dist/dexie.js"></script> 

        <!-- Include DexieClassAddon (always after Dexie, it's a dependency) -->
        <script src="https://unpkg.com/@pvermeer/dexie-class-addon@latest/dist/dexie-class-addon.min.js"></script>

        <script>
            // Define your database
            const db = new Dexie("FriendDatabase", {
                addons: [DexieClassAddon.classMap]
            });
            db.version(1).stores({
                friends: '++id, firstName, lastName, shoeSize, age'
            });

            db.friends.mapToClass(Friend);

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

#### Getting and setting a raw document
To get or set raw document, unaltered by hooks, a transaction can be used while setting `raw` to `true` on the `transaction` object:
```ts
await db.transaction('readonly', db.friends, async (transaction) => {
    transaction.raw = true;
    const friendRaw = await db.friends.get(id) as RawFriend;
});
```
All read actions in the transaction will return a raw document as saved in the db. All set actions will save the document as is. So no class mapping will be performed on the document.

API
---
The packet exposes one export:

#### classMap - addon function
```ts
function classMap(db: Dexie): void;
```

---------------------------------------------------

Dexie.js
========

Dexie.js is a wrapper library for indexedDB - the standard database in the browser. https://dexie.org
