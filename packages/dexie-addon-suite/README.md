Dexie Addon Suite
======

[![NPM Version](https://img.shields.io/npm/v/@pvermeer/dexie-addon-suite/latest.svg)](https://www.npmjs.com/package/@pvermeer/dexie-addon-suite)
[![NPM Version](https://img.shields.io/npm/v/@pvermeer/dexie-addon-suite/beta.svg)](https://www.npmjs.com/package/@pvermeer/dexie-addon-suite)
![master](https://github.com/pvermeer/dexie-addon-suite-monorepo/actions/workflows/ci.yml/badge.svg?branch=master)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)

Dexie Addon Suite combines the Dexie-addons from:
- **[dexie-immutable-addon](https://github.com/PVermeer/dexie-addon-suite-monorepo/tree/master/packages/dexie-immutable-addon)**; [![NPM Version](https://img.shields.io/npm/v/@pvermeer/dexie-immutable-addon/latest.svg)](https://www.npmjs.com/package/@pvermeer/dexie-immutable-addon)
- **[dexie-encrypted-addon](https://github.com/PVermeer/dexie-addon-suite-monorepo/tree/master/packages/dexie-encrypted-addon)**; [![NPM Version](https://img.shields.io/npm/v/@pvermeer/dexie-encrypted-addon/latest.svg)](https://www.npmjs.com/package/@pvermeer/dexie-encrypted-addon)
- **[dexie-rxjs-addon](https://github.com/PVermeer/dexie-addon-suite-monorepo/tree/master/packages/dexie-rxjs-addon)**; [![NPM Version](https://img.shields.io/npm/v/@pvermeer/dexie-rxjs-addon/latest.svg)](https://www.npmjs.com/package/@pvermeer/dexie-rxjs-addon)
- **[dexie-populate-addon](https://github.com/PVermeer/dexie-addon-suite-monorepo/tree/master/packages/dexie-populate-addon)**; [![NPM Version](https://img.shields.io/npm/v/@pvermeer/dexie-populate-addon/latest.svg)](https://www.npmjs.com/package/@pvermeer/dexie-populate-addon)
- **[dexie-class-addon](https://github.com/PVermeer/dexie-addon-suite-monorepo/tree/master/packages/dexie-class-addon)**; [![NPM Version](https://img.shields.io/npm/v/@pvermeer/dexie-class-addon/latest.svg)](https://www.npmjs.com/package/@pvermeer/dexie-class-addon)
- **[dexie-boolean-null-index-addon](https://github.com/PVermeer/dexie-addon-suite-monorepo/tree/master/packages/dexie-boolean-null-index-addon)**. [![NPM Version](https://img.shields.io/npm/v/@pvermeer/dexie-boolean-null-index-addon/latest.svg)](https://www.npmjs.com/package/@pvermeer/dexie-boolean-null-index-addon)


Adds new functionality:
- **populated rxjs observables**.

Install over npm
----------------
```
npm install @pvermeer/dexie-addon-suite rxjs
```

#### Peer dependencies
**rxjs**: https://rxjs-dev.firebaseapp.com/

RxJs is not bundled so you can use your own implementation.

**Dexie.js**:

Dexie Addon Suite depends on Dexie.js v3. [![NPM Version](https://img.shields.io/npm/v/dexie/latest.svg)](https://www.npmjs.com/package/dexie)
```
npm install dexie
```

Documentation
----------------
#### Extend your database the Dexie way!

Addon is written to be as easy to use as Dexie.js itself.


# How to use
## Added Schema Syntax
Symbol | Description
----- | ------
\$   | Encrypt this value (*does not create an index*)
\#  | Only as first key: hash the original document and create an index
=>  | Relational notation: `group => groups.id`  (*group is indexed*)

## Addon
Add `addonSuite(db: Dexie)` to your Dexie database. See below examples and https://dexie.org for more info.

For individual documentation check the individual repositories / packages (*links are above*).

By default these addons will be loaded:
- dexie-immutable-addon;
- dexie-populate-addon;
- dexie-rxjs-addon;
- dexie-class-addon.

*see individual package readme for more info*

### Config
```ts
interface EncryptedOptions {
	secretKey?: string;
	immutable?: boolean;
}

interface Config {
	encrypted?: EncryptedOptions;
	immutable?: boolean;
    class?: boolean;
    booleanNullIndex?: boolean;
}

function addonSuite(db: Dexie, config?: Config | EncryptedOptions);

// It is also possibe to provide the config using:
new Dexie("FriendDatabase", {
    addons: [addonSuite.setConfig({ immutable: false, class: false })]
});

```
- Provide `secretKey` to enable encryption. (*see below and dexie-encrypted-addon on how to use*)
- Provide `immutable: false` to disable immutability. (*not recommended in combination with encryption*)
- Provide `class: false` to disable class mapping. (*class constructor and serializer will not be called anymore*)
- Provide `booleanNullIndex: true` to disable indexing of boolean and null values. (*null and boolean values will be mapped to binary (`BufferArray`) so indexedDB can index these*)

Rxjs and Populate are mandatory, could not (yet) figure out conditional typings for these.

### Examples

#### Populated RxJs observables:

To get a populated RxJs observable that emit on changes use:
```ts
db.friends.populate().$.get(id);
```
or
```ts
db.friends.$.populate().get(id);
```
These methods are interchangeable and also detect changes in the populated records and emit accordingly.
See dexie-populate-addon and dexie-rxjs-addon for all query options.

##### Array methods
```ts
db.friends.$.populate().where(':id').anyOf([1]).toArray();
db.friends.$.populate().toArray();
```
And more... see rxjs / populate addon and https://dexie.org

##### RxJs usage:

```ts
const friends$ = db.friends.populate().$.where(':id').anyOf([1, 2]).toArray().pipe(map(x => x));

const sub = friends$.subscribe(friends => { friends.forEach(friend => console.log(friend)); });

// Don't forget to unsubscribe when done! (many ways to handle this, see RxJs documentation and guides / blogs)
sub.unsubscribe();
```

#### Getting and setting a raw document
To get or set raw document, unaltered by hooks, a transaction can be used while setting `raw` to `true` on the `transaction` object:
```ts
await db.transaction('readonly', db.friends, async (transaction) => {
    transaction.raw = true;
    const friendRaw = await db.friends.get(id) as RawFriend;
});
```
All read actions in the transaction will return a raw document as saved in the db. All set actions will save the document as is. So no Class mapping or decryption / encryption will be performed on the document.

### Create Dexie database
##### TypeScript
```ts
import Dexie from 'dexie';
import { addonSuite, Encryption, Ref, OnSerialize } from '@pvermeer/dexie-addon-suite';

// Declare classes
class Style {
    styleId?: number;
    name: string;
    color: string;
    description: string;
}
class Theme {
    id?: number;
    name: string;
    style: Ref<Style, number>;
    description: string;
}
class Club {
    id?: number;
    name: string;
    size: number;
    theme: Ref<Theme, number>;
    description: string;
}
class Group {
    id?: number;
    name: string;
    true: boolean;
    description: string;
}
class Friend implements OnSerialize {
    id?: number;
    name: string;
    memberOf: Ref<Club, number>[];
    group: Ref<Group, number>;

    doSomething() { return 'done'; }

    /*
        For dexie-class-addon (will call constructor/serialize on read/write).
        Implement OnSerialize to enable type checking for this method.
        See dexie-class-addon documentation for more info
    */
    serialize() { 
        return {
            id: () => this.id,
            name: () => this.name,
            memberOf: () => this.memberOf.map(club => club instanceof Club ? club.id : club),
            group: () => this.group instanceof Group ? this.group.id : group,
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

// Declare Database
class FriendsDatabase extends Dexie {

    public friends: Dexie.Table<Friend, number>;
    public clubs: Dexie.Table<Club, number>;
    public themes: Dexie.Table<Theme, number>;
    public groups: Dexie.Table<Group, number>;
    public styles: Dexie.Table<Style, number>;

    constructor(name: string) {
        super(name);

        const secretKey = Encryption.createRandomEncryptionKey(); // Might wanna save this somewhere
        addonSuite(this, { secretKey });

        this.version(1).stores({
            friends: '#id, $name, *memberOf => clubs.id, group => groups.id, [id+group]',
            clubs: '++id, $name, theme => themes.id',
            themes: '++id, $name, style => styles.styleId',
            styles: '++styleId, $name, color',
            groups: '++id, $name'
        });

        this.friends.mapToClass(Friend);
        this.clubs.mapToClass(Club);
        this.themes.mapToClass(Theme);
        this.groups.mapToClass(Group);
        this.styles.mapToClass(Style);
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

##### ES6
```js
import Dexie from 'dexie';
import { addonSuite, Encryption } from '@pvermeer/dexie-addon-suite';

const secretKey = Encryption.createRandomEncryptionKey(); // Might wanna store this somewhere

// Declare Database
const db = new Dexie("FriendDatabase", {
    addons: [addonSuite.setConfig({ secretKey })]
});
db.version(1).stores({
    friends: '#id, $name, *memberOf => clubs.id, group => groups.id, [id+group]',
    clubs: '++id, $name, theme => themes.id',
    themes: '++id, $name, style => styles.styleId',
    styles: '++styleId, $name, color',
    groups: '++id, $name'
});

// Open the database
db.open()
    .then(() => {
        console.log('DB loaded! :D')
        // Use Dexie
    });
```

##### HTML import

Bundled & minified package: <https://unpkg.com/@pvermeer/dexie-addon-suite@latest/dist/dexie-addon-suite.min.js>.

Addon is exported as namespace DexieAddonSuite

```html
<!doctype html>
<html>
    <head>
        <!-- Include Dexie (@next if v3 is still in RC) -->
        <script src="https://unpkg.com/dexie@latest/dist/dexie.js"></script> 

        <!-- Include DexieAddonSuite (always after Dexie, it's a dependency) -->
        <script src="https://unpkg.com/@pvermeer/dexie-addon-suite@latest/dist/dexie-addon-suite.min.js"></script>

        <script>

            const secretKey = DexieAddonSuite.Encryption.createRandomEncryptionKey(); // Might wanna save this somewhere

            // Define your database
            const db = new Dexie("FriendDatabase", {
                addons: [DexieAddonSuite.addonSuite.setConfig({ secretKey })]
            });
            db.version(1).stores({
                friends: '#id, $name, *memberOf => clubs.id, group => groups.id, [id+group]',
                clubs: '++id, $name, theme => themes.id',
                themes: '++id, $name, style => styles.styleId',
                styles: '++styleId, $name, color',
                groups: '++id, $name'
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
The package main exports:

```ts
function addonSuite(db: Dexie, config?: Config | EncryptedOptions): void;
namespace addonSuite {
	const setConfig: (config: EncryptedOptions | Config) => (db: Dexie) => string;
}

/**
 * Ref nominal type.
 * TS does not support nominal types. Fake implementation so the type system can match.
 */
export type Ref<O extends object, K extends IndexTypes, _N = "Ref"> = NominalRef<O> | K | null;

/**
 * Overwrite the return type to the type as given in the Ref type after refs are populated.
 * T = object type;
 * B = boolean if shallow populate;
 * O = union type of object keys to populate or the string type to populate all.
 */
export type Populated<T, B extends boolean = false, O extends string = string>;

/**
 * Class with cryptic methods
 */
export class Encryption { } // See dexie-encrypted-addon.

export interface OnSerialize { } // Add to database classes that use serialization. See dexie-class-addon.

export class IndexValueEncoder { }; // Boolean-null index encoder. See dexie-boolean-null-index-addon.

export as namespace DexieAddonSuite;
```

Also exports some other classes and types to support further extension. See declaration or source.

---------------------------------------------------

Dexie.js
========

Dexie.js is a wrapper library for indexedDB - the standard database in the browser. https://dexie.org
