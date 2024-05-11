# Dexie Populate Addon

[![NPM Version](https://img.shields.io/npm/v/@pvermeer/dexie-populate-addon/latest.svg)](https://www.npmjs.com/package/@pvermeer/dexie-populate-addon)
[![NPM Version](https://img.shields.io/npm/v/@pvermeer/dexie-populate-addon/beta.svg)](https://www.npmjs.com/package/@pvermeer/dexie-populate-addon)
![master](https://github.com/pvermeer/dexie-addon-suite-monorepo/actions/workflows/ci.yml/badge.svg?branch=master)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)

This addon can be used as a stand-alone addon for Dexie.js yet is also part of dexie-addon-suite [![NPM Version](https://img.shields.io/npm/v/@pvermeer/dexie-addon-suite/latest.svg)](https://www.npmjs.com/package/@pvermeer/dexie-addon-suite)
that combines a number of addons for Dexie. It contains code to combine some addons like populated rxjs observables.

## Install over npm

```
npm install @pvermeer/dexie-populate-addon
```

#### Dexie.js

Dexie Populate Addon depends on Dexie.js v4. Latest dexie version: [![NPM Version](https://img.shields.io/npm/v/dexie/latest.svg)](https://www.npmjs.com/package/dexie)

```
npm install dexie
```

## Documentation

#### Populate your data the Dexie way!

Addon is written to be as easy to use as Dexie.js itself.

### Added Schema Syntax

The [dexie schema](https://dexie.org/docs/API-Reference#quick-reference) is extended with:

| Symbol | Description                                                    |
| ------ | -------------------------------------------------------------- |
| =>     | Relational notation: `group => groups.id` (_group is indexed_) |

#### Explanation

`group` Is the property on the record and will create an index on the database.
`groups.id` Groups is the referenced table and `id` is the key to query for on this table.

Multi-entry index is supported:

- `++id, *group => group.id`

Compound poplulation is supported:

- `++id, group => groups.id, [id+group]`

Queries for `[id+group]` (e.g.`where()`) will have populated results

[#35](https://github.com/PVermeer/dexie-addon-suite-monorepo/issues/35) A compound key as primary key on a referenced table is not supported. It's recommoneded to always use a single primary key (e.g. auto-incremented) for the referenced table key.

### How to use

#### Addon

Add populate() to your Dexie database. See below examples and https://dexie.org for more info.

#### Ref type (TypeScript)

For typescript there is a special `Ref` type for your Classes and Interfaces so the type system knows id this propery is populated or not:

```ts
import { Ref } from "@pvermeer/dexie-populate-addon";

class Club {
  id?: number;
  name: string;
  size: number;
  description: string;
}

export class Friend {
  id?: number;
  firstName: string;
  lastName: string;
  memberOf: Ref<Club, number>[];

  doSomething() {}
}
```

With `memberOf: Ref<Club, number>[]` the typesystem now knows we have a property `memberOf` that can be assigned with an array of `number` keys. When population methods are used, TypeScript now understands that this has changed to the type `Club[]` in `memberOf`. If one of the referenced records is not found it will be `null`, thus the type for `memberOf` will be `(Club | null)[]`.

The `Ref` type is a (fake) nominal type so the type system can differentiate this type from other assignable types.

#### Populate method

The `Table` class of Dexie is extended with the `populate()` method:

```ts
interface PopulateOptions {
    shallow: boolean;
}

populate(keysOrOptions?: string[] | PopulateOptions): PopulateTable;
```

It returns a new `PopulateTable` with the available `Dexie.Table` methods that support population. Dexie `Table` methods can then be used as normal.

When no options are provided, the return is a deep populated record. Since this is not always wanted and to speed up the database lookup, options can be provided:

- Limit population by providing `string[]`. `string[]` Expects population keys as provided in the table schema. Only thoses properties will be populated .
- Providing `{ shallow: true }` disables deep population. Only one layer of population is applied.

##### References

All references are internally cached for the duration of the population. This means that the same record will never be queried twice and instead a reference from the cache is set on the populated record.

This allows for circular references to be resolved.

##### Examples:

Options:

```ts
db.friends.populate().get(1); // Fully populated;
db.friends.populate({ shallow: true }).get(1); // Only the record itself is populated, no deeper;
db.friends.populate(["memberOf", "group"]).get(1); // Only 'memberOf' and 'group' are deep populated;
db.friends.populate(["memberOf", "group"], { shallow: true }).get(1); // Only 'memberOf' and 'group' are shallow populated;
```

Array methods:

```ts
db.friends.populate().where(":id").equals(1).first();
db.friends.populate().toArray();
```

Compound:

```ts
db.friends.populate().where("[id+group]").equals([1, 2]).first();
db.friends.populate().where({ id: 1, group: 2 }).first();
```

And more... see https://dexie.org

### Create Dexie database

#### ESM

```js
import Dexie from "dexie";
import { populate } from "@pvermeer/dexie-populate-addon";

// Declare Database
const db = new Dexie("FriendDatabase", {
  addons: [populate],
});
db.version(1).stores({
  friends: "++id, name, *memberOf => clubs.id, group => groups.id, [id+group]",
  clubs: "++id, name, theme => themes.id",
  themes: "++id, name, style => styles.styleId",
  styles: "++styleId, name, color",
  groups: "++id, name",
});

// Open the database
db.open().then(() => {
  console.log("DB loaded! :D");
  // Use Dexie
});
```

#### Typescript

```ts
import Dexie from "dexie";
import { populate, Ref } from "@pvermeer/dexie-populate-addon";

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
  memberOf: Ref<Club, number>[];
  group: Ref<Group, number>;

  doSomething() {
    return "done";
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

    populate(this);

    this.version(1).stores({
      friends:
        "++id, name, *memberOf => clubs.id, group => groups.id, [id+group]",
      clubs: "++id, name, theme => themes.id",
      themes: "++id, name, style => styles.styleId",
      styles: "++styleId, name, color",
      groups: "++id, name",
    });

    this.friends.mapToClass(Friend);
    this.clubs.mapToClass(Club);
    this.themes.mapToClass(Theme);
    this.groups.mapToClass(Group);
    this.styles.mapToClass(Style);
  }
}

const db = new FriendDatabase("FriendsDatabase");

// Open the database
db.open().then(() => {
  console.log("DB loaded! :D");
  // Use Dexie
});
```

#### HTML import

Bundled & minified package: <https://unpkg.com/@pvermeer/dexie-populate-addon@latest/dist/dexie-populate-addon.min.js>.

Addon is export as namespace DexiePopulateAddon

```html
<!DOCTYPE html>
<html>
  <head>
    <!-- Include Dexie -->
    <script src="https://unpkg.com/dexie@4/dist/dexie.js"></script>

    <!-- Include DexiePopulateAddon (always after Dexie, it's a dependency) -->
    <script src="https://unpkg.com/@pvermeer/dexie-populate-addon@latest/dist/dexie-populate-addon.min.js"></script>

    <script>
      // Define your database
      const db = new Dexie("FriendDatabase", {
        addons: [DexiePopulateAddon.populate],
      });
      db.version(1).stores({
        friends:
          "++id, name, *memberOf => clubs.id, group => groups.id, [id+group]",
        clubs: "++id, name, theme => themes.id",
        themes: "++id, name, style => styles.styleId",
        styles: "++styleId, name, color",
        groups: "++id, name",
      });

      // Open the database
      db.open().then(() => {
        console.log("DB loaded! :D");
        // Do Dexie stuff
      });
    </script>
  </head>
</html>
```

## API

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
export declare type Ref<O extends object, K extends IndexTypes, _N = "Ref"> =
  | NominalRef<O>
  | K
  | null;
```

### Populated - type

```ts
/**
 * Overwrite the return type to the type as given in the Ref type after refs are populated.
 * T = object type;
 * B = boolean if shallow populate;
 * O = union type of object keys to populate or the string type to populate all.
 */
type Populated<T, B extends boolean = false, O extends string = string>;
```

Also exports some other classes and types to support further extension. See declaration or source.

---

# Dexie.js

Dexie.js is a wrapper library for indexedDB - the standard database in the browser. https://dexie.org
