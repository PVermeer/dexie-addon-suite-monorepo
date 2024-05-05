export type SerializeObject = { [prop: string]: () => unknown };

export class Serializer {
  constructor(input: SerializeObject, keyFilter?: string[]) {
    Object.entries(input).forEach(([key, value]) => {
      try {
        if (!keyFilter || keyFilter.some((x) => x === key)) this[key] = value();
      } catch {
        throw new Error(
          `DEXIE CLASS ADDON: SerializeObject value is not callable: { ${key}: ${value} }. ` +
            `Use an arrow function to capture context (this): { ${key}: () => 'serialized value' }`
        );
      }
    });
  }
}

export interface OnSerialize {
  serialize(): Partial<SerializeObject>;
}
