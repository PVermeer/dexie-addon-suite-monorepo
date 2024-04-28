import { Dexie } from "dexie";
import { DexieExtended } from "./types";

// @ts-expect-error // Unused type parameters, these must match with Dexie.Table
export interface TableExtended<T, TKey, TInsertType> {
  /**
        Override mapToClass method to actually call the class constructor
     */
  // eslint-disable-next-line @typescript-eslint/ban-types
  mapToClass(constructor: Function): Function; // Dexie is using Function type, must match
}

export function getTableExtended<T, TKey, TInsertType>(db: Dexie) {
  const dbExt = db as DexieExtended;
  const TableClass = dbExt.Table;

  return class TableExt
    extends TableClass<T, TKey, TInsertType>
    implements TableExtended<T, TKey, TInsertType>
  {
    public override mapToClass<T extends new (args: any) => any>(
      constructor: T
    ): T {
      super.mapToClass(constructor);

      // Override the readhook and just call the constructor
      const readHook = (obj: any) => {
        const transaction = Dexie.currentTransaction;
        if (!obj || transaction?.raw) return obj;

        const res = new constructor(obj);
        return res;
      };

      if (this.schema.readHook)
        this.hook.reading.unsubscribe(this.schema.readHook);
      this.schema.readHook = readHook;
      this.hook("reading", readHook);
      return constructor;
    }
  };
}
