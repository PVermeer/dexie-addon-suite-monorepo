Dexie Populate Addon
======

[![NPM Version](https://img.shields.io/npm/v/@pvermeer/dexie-populate-addon/latest.svg)](https://www.npmjs.com/package/@pvermeer/dexie-populate-addon)
[![NPM Version](https://img.shields.io/npm/v/@pvermeer/dexie-populate-addon/beta.svg)](https://www.npmjs.com/package/@pvermeer/dexie-populate-addon)
[![Build Status](https://travis-ci.com/PVermeer/dexie-populate-addon.svg?branch=master)](https://travis-ci.com/PVermeer/dexie-populate-addon)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)

This addon can be used as a stand-alone addon for Dexie.js yet is also part of dexie-addon-suite [![NPM Version](https://img.shields.io/npm/v/@pvermeer/dexie-addon-suite/latest.svg)](https://www.npmjs.com/package/@pvermeer/dexie-addon-suite)
 that combines a number of addons for Dexie. It contains code to combine some addons like populated rxjs observables.

Install over npm
----------------
```
npm install @pvermeer/dexie-populate-addon
```

#### Dexie.js
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
#### Populate your data the Dexie way!

Addon is written to be as easy to use as Dexie.js itself.

### Added Schema Syntax
Symbol | Description
----- | ------
=> | Relational notation: `group => groups.id`  (*group is indexed*)

#### Population
Index keys of `group` may be an array of keys `[1, 2, 3]` or a single key `1`.

#### Indices
Relational keys will be indexed. Multi-index `*groups` and compound indices can be used `++id, group => groups.id, [id+group]`.

### How to use
#### Addon
Add populate() to your Dexie database. See below examples and https://dexie.org for more info.

#### Ref type (TypeScript)
For typescript there is a special `Ref` type for your Classes and Interfaces to let the typesystem know that this is a potentially populated property:

```ts
import { Ref } from '@pvermeer/dexie-populate-addon';

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

#### Populate method
The `Table` class of Dexie is extended with the `populate()` method:

```ts
interface PopulateOptions {
    shallow: boolean;
}

populate(keysOrOptions?: string[] | PopulateOptions): PopulateTable;
```

It returns a new `PopulateTable` with the available `Dexie.Table` methods that support population. Dexie `Table` methods can then be used as normal.

When no parameters are provided, the return is a deep populated record. Since this is not always wanted and to speed up the database lookup, parameters can be provided:
- Providing `string[]` expects population keys as provided in the table schema. Only thoses properties will be populated (deep).
- Providing `{ shallow: true }` disables deep population. Only one layer of population is applied.

They cannot be used in conjunction (yet :D).

##### Examples:
Options:
```ts
db.friends.populate().get(1); // Fully populated;
db.friends.populate({ shallow: true }).get(1); // Only the record itself is populated, no deeper;
db.friends.populate(['memberOf', 'group']).get(1); // Only 'memberOf' and 'group' are deep populated;
```
Array methods:
```ts
db.friends.populate().where(':id').equals(1).first();
db.friends.populate().toArray();
db.friends.populate().each(x => x); // Not recommendend, can be very slow
```
Compound:
```ts
db.friends.populate().where('[id+group]').equals([1, 2]).first();
db.friends.populate().where({ id: 1, group: 2 }).first()
```
And more... see https://dexie.org


### Create Dexie database
#### ES6
```js
import Dexie from 'dexie';
import { populate } from '@pvermeer/dexie-populate-addon';

// Declare Database
const db = new Dexie("FriendDatabase", {
    addons: [populate]
});
db.version(1).stores({
    friends: '++id, name, *memberOf => clubs.id, group => groups.id, [id+group]',
    clubs: '++id, name, theme => themes.id',
    themes: '++id, name, style => styles.styleId',
    styles: '++styleId, name, color',
    groups: '++id, name'
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
import { populate, Ref } from '@pvermeer/dexie-populate-addon';

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

        populate(this);

        this.version(1).stores({
            friends: '++id, name, *memberOf => clubs.id, group => groups.id, [id+group]',
            clubs: '++id, name, theme => themes.id',
            themes: '++id, name, style => styles.styleId',
            styles: '++styleId, name, color',
            groups: '++id, name'
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

#### HTML import

Bundled & minified package: <https://unpkg.com/@pvermeer/dexie-populate-addon@latest/dist/dexie-populate-addon.min.js>.

Addon is export as namespace DexiePopulateAddon

```html
<!doctype html>
<html>
    <head>
        <!-- Include Dexie (@next if v3 is still in RC) -->
        <script src="https://unpkg.com/dexie@latest/dist/dexie.js"></script> 

        <!-- Include DexiePopulateAddon (always after Dexie, it's a dependency) -->
        <script src="https://unpkg.com/@pvermeer/dexie-populate-addon@latest/dist/dexie-populate-addon.min.js"></script>

        <script>
            // Define your database
            const db = new Dexie("FriendDatabase", {
                addons: [DexiePopulateAddon.populate]
            });
            db.version(1).stores({
                friends: '++id, name, *memberOf => clubs.id, group => groups.id, [id+group]',
                clubs: '++id, name, theme => themes.id',
                themes: '++id, name, style => styles.styleId',
                styles: '++styleId, name, color',
                groups: '++id, name'
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
The packet exposes two main exports:

#### populate - addon function
```ts
function populate(db: Dexie): void;
```

#### Ref - type
```ts
/**
 * Ref nominal type.
 * TS does not support nominal types. Fake implementation so the type system can match.
 */
type Ref<O extends object, K extends IndexableType, _N = 'Ref'> = NominalT<O> | K;
```

Also exports some other classes and types to support further extension. See declaration or source.

---------------------------------------------------

Dexie.js
========

Dexie.js is a wrapper library for indexedDB - the standard database in the browser. https://dexie.org
