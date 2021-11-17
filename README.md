Dexie Addon Suite - Monorepo
======

[![NPM Version](https://img.shields.io/npm/v/@pvermeer/dexie-addon-suite/latest.svg)](https://www.npmjs.com/package/@pvermeer/dexie-addon-suite)
[![NPM Version](https://img.shields.io/npm/v/@pvermeer/dexie-addon-suite/beta.svg)](https://www.npmjs.com/package/@pvermeer/dexie-addon-suite)
[![Build Status](https://travis-ci.com/PVermeer/dexie-addon-suite.svg?branch=master)](https://travis-ci.com/PVermeer/dexie-addon-suite)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)

Dexie Addon Suite combines the Dexie-addons from:
- **dexie-immutable-addon**; [![NPM Version](https://img.shields.io/npm/v/@pvermeer/dexie-immutable-addon/latest.svg)](https://www.npmjs.com/package/@pvermeer/dexie-immutable-addon)
- **dexie-encrypted-addon**; [![NPM Version](https://img.shields.io/npm/v/@pvermeer/dexie-encrypted-addon/latest.svg)](https://www.npmjs.com/package/@pvermeer/dexie-encrypted-addon)
- **dexie-rxjs-addon**; [![NPM Version](https://img.shields.io/npm/v/@pvermeer/dexie-rxjs-addon/latest.svg)](https://www.npmjs.com/package/@pvermeer/dexie-rxjs-addon)
- **dexie-populate-addon**. [![NPM Version](https://img.shields.io/npm/v/@pvermeer/dexie-populate-addon/latest.svg)](https://www.npmjs.com/package/@pvermeer/dexie-populate-addon)

Adds new functionality:
- **populated rxjs observables**.

Install over npm
----------------
```
npm install @pvermeer/dexie-addon-suite rxjs
```

#### Dependencies
**rxjs**: https://rxjs-dev.firebaseapp.com/

RxJs is not bundled so you can use your own implementation.

**Dexie.js**:

Dexie Addon Suite depends on Dexie.js v3. 
```
npm install dexie
```
At the time of writing Dexie v3 is in the RC stage. To install this version you have to use the @next npm version. Current version of Dexie.js: [![NPM Version](https://img.shields.io/npm/v/dexie/latest.svg)](https://www.npmjs.com/package/dexie)
```
npm install dexie@next
```

Documentation
----------------
#### Extend your database the Dexie way!

Addon is written to be as easy to use as Dexie.js itself.


# How to use
## Added Schema Syntax
Symbol | Description
----- | ------
$   | Encrypt this value (*does not create an index*)
\#  | Only as first key: hash the original document and create an index
=>  | Relational notation: `group => groups.id`  (*group is indexed*)

## Addon
Add `addonSuite(db: Dexie)` to your Dexie database. See below examples and https://dexie.org for more info.

For individual documentation check the individual repositories / packages (*links are above*).

By default this addon will load:
- dexie-immutable-addon;
- dexie-populate-addon;
- dexie-rxjs-addon.

### Config
```ts
interface EncryptedOptions {
	secretKey?: string;
	immutable?: boolean;
}

interface Config {
	encrypted?: EncryptedOptions;
	immutable?: boolean;
}

function addonSuite(db: Dexie, config?: Config | EncryptedOptions);

// It is also possibe to provide the config using:
new Dexie("FriendDatabase", {
    addons: [addonSuite.setConfig({ immutable: false })]
});

```
- Provide `secretKey` to enable encryption. (*see below and dexie-encrypted-addon on how to use*)
- Provide `immutable: false` to disable immutability. (*not recommended in combination with encryption*)

Rxjs and Populate are mandatory, could not (yet) figure out conditional typings for these.

### Highlights of addons

#### Dexie RxJs Addon
For now only `toArray()` is usable on a returned `Collection` from a `where()` query:
```ts
class ObservableCollection {
    /**
     * Get an array of the query results.
     * @note For now RxJs operators can be used to achieve the same functionality of Dexie.Collection.
     */
    public toArray() { return this._collection$; }
}
```

#### Dexie Populate Addon
##### Ref type
```ts
import { Ref } from '@pvermeer/dexie-addon-suite';

export class Friend {
    id?: number;
    firstName: string;
    lastName: string;
    memberOf: Ref<Club[], number[]>;
    group: Ref<Group, number>;

    doSomething() { return 'done'; }

    constructor() { }
}
```
With this notation we let the typesystem know we have a property `memberOf` that can be assigned with index keys of `number[]` and a property `group` that can be assigned with the index key of `number`. When population methods are used, TypeScript now knows that this has changed to `Club[]` in `memberOf` and `Group` in `group`. If a Ref is not found it is `null`, thus the result for `memberOf` will be `(Club | null)[]` and for `group` it will be `Group | null`.

The ref type is a (fake) nominal type so the type system can differentiate this type from other assignable types.

#### Dexie Encrypted Addon
##### Encryption class
```ts
/**
 * Class with cryptic methods
 */
class Encryption {
    readonly secret: string;
    readonly secretUint8Array: Uint8Array;
    /**
     * Create a random key.
     */
    static createRandomEncryptionKey(): string;
    /**
     * Create a base64 hash string of the provided input.
     * @param input Any non-circulair value.
     */
    static hash(input: any): string;
    
    constructor(secret?: string);
}
```

### Examples

#### Populated RxJs observables:

To get populated RxJs observables that emit on changes use:
```ts
db.friends.populate().$.get(id);
```
or
```ts
db.friends.$.populate().get(id);
```
These methods are interchangeable and also detect changes in the populated records and emit accordingly.
For now, only toArray() is available on a `Collection`. (*see above*)

##### Options
```ts
db.friends.populate().$.get(1); // Fully populated;
db.friends.populate({ shallow: true }).$.get(1); // Only the record itself is populated, no deeper;
db.friends.populate(['memberOf', 'group']).$.get(1); // Only 'memberOf' and 'group' are deep populated;
```
##### Array methods
```ts
db.friends.$.populate().where(':id').anyOf([1]).toArray();
db.friends.$.populate().toArray();
```
##### Compound
```ts
db.friends.populate().$.where('[id+group]').equals([1, 2]).toArray();
db.friends.populate().$.where({ id: 1, group: 2 }).toArray()
```
And more... see https://dexie.org

##### Can be used with RxJs methods:

```ts
const friends$ = db.friends.populate().$.where(':id').anyOf([1, 2]).toArray().pipe(map(x => x));

const sub = friends$.subscribe(friends => { friends.forEach(friend => console.log(friend)); });

// Don't forget to unsubscribe when done! (many ways to handle this, see RxJs documentation and guides / blogs)
sub.unsubscribe();
```


### Create Dexie database
##### TypeScript
```ts
import Dexie from 'dexie';
import { addonSuite, Encryption, Ref } from '@pvermeer/dexie-addon-suite';

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
class Friend {
    id?: number;
    name: string;
    memberOf: Ref<Club[], number[]>;
    group: Ref<Group, number>;

    doSomething() { return 'done'; }
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

const secretKey = Encryption.createRandomEncryptionKey(); // Might wanna save this somewhere

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
type Ref<O extends object, K extends IndexableType, _N = 'Ref'> = NominalT<O> | K;

/**
 * Class with cryptic methods
 */
class Encryption {
	private readonly _secret;
	get secret(): string;
	private readonly _keyUint8Array;
	get secretUint8Array(): Uint8Array;
	/**
	 * Create a random key.
	 */
	static createRandomEncryptionKey(): string;
	/**
	 * Create a base64 hash string of the provided input.
	 * @param input Any non-circulair value.
	 */
	static hash(input: any): string;
	/**
	 * Encrypt any value.
	 * @param json Any non-circulair value.
	 * @param key Secret key to encrypt with.
	 */
	encrypt(json: any): string;
	/**
	 * Decrypt values.
	 * @param json Any non-circulair value.
	 * @param key Secret key to decrypt with.
	 */
	decrypt(messageWithNonce: string): any;
	constructor(secret?: string);
}

export as namespace DexieAddonSuite;
```

Also exports some other classes and types to support further extension. See declaration or source.

---------------------------------------------------

Dexie.js
========

Dexie.js is a wrapper library for indexedDB - the standard database in the browser. https://dexie.org
