import { secretbox } from "tweetnacl";
import { Encryption } from "../../../src/encryption.class";

describe("dexie-encrypted-addon encryption-class.spec", () => {
  describe("Encryption class", () => {
    it("should throw when document failes to decrypt", () => {
      spyOn(secretbox, "open").and.callFake(() => null);
      const encryption = new Encryption(Encryption.createRandomEncryptionKey());
      const messageEncrypted = encryption.encrypt("sdhfuisdfsdf");
      expect(() => encryption.decrypt(messageEncrypted)).toThrowError(
        "Could not decrypt message!"
      );
    });
    it("should encrypt / decrypt all falsy values except undefined", () => {
      const encryption = new Encryption(Encryption.createRandomEncryptionKey());
      [null, 0, "", {}, false].forEach((x, i, array) => {
        const encrypted = encryption.encrypt(x);
        expect(typeof encrypted === "string").toBeTrue();
        expect(encrypted.length > 0).toBeTrue();

        const decrypted = encryption.decrypt(encrypted);
        if (i === 3) expect(Object.keys(decrypted).length === 0).toBeTrue();
        else expect(decrypted === array[i]).toBeTrue();
      });
      const encrypted = encryption.encrypt(undefined);
      expect(encrypted === undefined).toBeTrue();
    });
  });
});
