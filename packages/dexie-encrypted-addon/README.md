Dexie Encrypted Addon
======

[![NPM Version](https://img.shields.io/npm/v/@pvermeer/dexie-encrypted-addon/latest.svg)](https://www.npmjs.com/package/@pvermeer/dexie-encrypted-addon)
[![NPM Version](https://img.shields.io/npm/v/@pvermeer/dexie-encrypted-addon/beta.svg)](https://www.npmjs.com/package/@pvermeer/dexie-encrypted-addon)
[![Build Status](https://travis-ci.com/PVermeer/dexie-encrypted-addon.svg?branch=master)](https://travis-ci.com/PVermeer/dexie-encrypted-addon)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)

This addon can be used as a stand-alone addon for Dexie.js yet is also part of dexie-addon-suite [![NPM Version](https://img.shields.io/npm/v/@pvermeer/dexie-addon-suite/latest.svg)](https://www.npmjs.com/package/@pvermeer/dexie-addon-suite)
 that combines a number of addons for Dexie. It contains code to combine some addons like populated rxjs observables.

Install over npm
----------------
```
npm install @pvermeer/dexie-encrypted-addon
```

#### Dexie.js
Dexie Encrypted Addon depends on Dexie.js v3. 
```
npm install dexie
```

Angular > 10
----------------
Angular now checks for CommonJS or AMD dependencies optimazations. This will give to following warning:
```
WARNING in /<your path>/node_modules/@pvermeer/dexie-encrypted-addon/dist/esm-es5/encryption.class.js depends on 'tweetnacl'. CommonJS or AMD dependencies can cause optimization bailouts.
For more info see: https://angular.io/guide/build#configuring-commonjs-dependencies
```
As mentioned in the provided link add:
```
"build": {
  "builder": "@angular-devkit/build-angular:browser",
  "options": {
     "allowedCommonJsDependencies": [
        "tweetnacl"
     ]
     ...
   }
   ...
}
```
to your angular.json file.
The [tweetnacl package](https://www.npmjs.com/package/tweetnacl) handles te encryption and is not bundled in the main npm package (it is bundled in the min version) so it will be updated on patches.

Documentation
----------------
#### Encrypt your data the Dexie way!

Addon is written to be as easy to use as Dexie.js itself.

#### Added Schema Syntax
Symbol | Description
----- | ------
$ | Encrypt this value (does not create an index)
\# | Only as first key: Hash the original document and create an index

```ts
const friend = '#id, $name, age';
{
    id: 'hashed id', // Indexed
    name: 'some encryption string', // Not indexed
    age: 34, // Indexed
    shoeSize: 42 // Not indexed
}
```
Using **$** on your keys will encrypt these keys.

Using **#** on the first key will hash this key with the document on creation.
This will create an unique primary key based on the document itself and will update or create the key on the document itself.

#### Wait for open
Always open the database yourself. Dexie does not wait for all hooks to be subscribed (bug?).
```ts
await db.open();
```
To help with this, the option 'autoOpen' has been disabled.

#### Indices
Encrypted values will not be indexed. IndexedDB does not support index based on encryption.
Doing where() calls would mean the whole collection has to be read and decrypted (unless someone has a better idea? PR's are always welcome :D).
Implementing this yourself would be more performend when also modeling the database to support this.

#### Immutable
Dexie does not do immutability by default.
This is recommended so your original input object does not change after encrypting values or hashing the primary index key.

By default immutablity is applied to all creation and update methods via overrides via ![npm (prod) dependency version (scoped)](https://img.shields.io/npm/dependency-version/@pvermeer/dexie-encrypted-addon/@pvermeer/dexie-immutable-addon).
The immutable addon is loaded with this addon so you don't have to add it.

This behavior can be disabled via the options object provided to the addon:
```ts
interface EncryptedOptions {
    secretKey?: string;
    immutable?: boolean; // Default true
}
```
*Setting this to false can lead to unexpected / weird behavior in your application*

#### Example (ES6)
```js
import Dexie from 'dexie';
import { encrypted, Encryption } from '@pvermeer/dexie-encrypted-addon';

// Generate a random key
const secret = Encryption.createRandomEncryptionKey();

// Declare Database
const db = new Dexie("FriendDatabase", {
    addons: [encrypted.setOptions({ secretKey: secret })]
});
db.version(1).stores({ friends: "#id, $name, $shoeSize, age" });

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
import { encrypted, Encryption } from '@pvermeer/dexie-encrypted-addon';

interface Friend {
    id?: number;
    name?: string;
    shoeSize?: number;
    age?: number;
}

// Generate a random key
const secret = Encryption.createRandomEncryptionKey();

// Declare Database
class FriendsDatabase extends Dexie {
    public friends: Dexie.Table<Friend, string>;
    constructor(name: string, secret?: string) {
        super(name);
        encrypted(this, { secretKey: secret });
        this.version(1).stores({
            friends: '#id, $name, $shoeSize, age'
        });
    }
}

const db = new FriendDatabase('FriendsDatabase', secret);

// Open the database
db.open()
    .then(() => {
        console.log('DB loaded! :D')
        // Use Dexie
    });
```

#### Example (HTML import)

Bundled & minified package: <https://unpkg.com/@pvermeer/dexie-encrypted-addon@latest/dist/dexie-encrypted-addon.min.js>.

Addon is export as namespace DexieEncryptedAddon

```html
<!doctype html>
<html>
    <head>
        <!-- Include Dexie -->
        <script src="https://unpkg.com/dexie@latest/dist/dexie.js"></script>

        <!-- Include DexieEncryptedAddon (always after Dexie, it's a dependency) -->
        <script src="https://unpkg.com/@pvermeer/dexie-encrypted-addon@latest/dist/dexie-encrypted-addon.min.js"></script>

        <script>
            // Generate a random key
            const secret = Encryption.createRandomEncryptionKey();

            // Define your database
            const db = new Dexie("FriendDatabase", {
                addons: [DexieEncryptedAddon.encrypted.setOptions({ secretKey: secret })]
            });
            db.version(1).stores({ friends: "#id, $name, $shoeSize, age" });

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
The packet exposes two exports:

#### encrypted - addon function
```ts
/**
 * @secretKey Your previously saved secret.
 * @immutable Set to false to disable immutable state on document creation and updates.
 */
interface EncryptedOptions {
    secretKey?: string;
    immutable?: boolean;
}
/** 
 * @method setOptions(string) Set options and return the addon.
 * @param options Set secret key and / or immutable create methods.
 * @returns The secret key (provided or generated)
 */ 
function encrypted(db: Dexie, options?: EncryptedOptions): string;
/**
 * Namespace to set options and return the addon function when used in (ES2016 / ES7)
 */ 
namespace encrypted {
    function setOptions(options: EncryptedOptions): string;
}
```

#### Encryption - class
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
---------------------------------------------------

Dexie.js
========

Dexie.js is a wrapper library for indexedDB - the standard database in the browser. http://dexie.org
