import { Dexie as DexieImport } from "dexie";
import { addonSuite } from "../../../src";

declare interface DexieAddonSuiteType {
  addonSuite: typeof addonSuite;
}

/*
 * Lib is not really meant for node but package should be able to be required in node.
 */
describe("dexie-addon-suite dexie.spec", () => {
  describe("Dexie", () => {
    describe("Node require", () => {
      let DexieReq: typeof DexieImport;
      let DexieAddonSuiteReq: DexieAddonSuiteType;
      beforeAll(() => {
        DexieReq = require("dexie");
        DexieAddonSuiteReq = require("../../../dist/index");
      });
      it("should load Dexie.js", () => {
        expect(DexieReq).toBeTruthy();
      });
      it("should load DexieAddonSuiteReq.js", () => {
        expect(DexieAddonSuiteReq).toBeTruthy();
        expect(DexieAddonSuiteReq.addonSuite).toBeTruthy();
      });
      it("should be able to use the addon suite", async () => {
        expect(typeof DexieAddonSuiteReq.addonSuite === "function").toBeTrue();
      });
    });
  });
});
