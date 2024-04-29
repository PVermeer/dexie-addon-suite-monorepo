import { Dexie as DexieImport } from "dexie";
import { dexieRxjs } from "../../../src";

declare interface DexieRxjsAddonType {
  dexieRxjs: typeof dexieRxjs;
}

/*
 * Lib is not really meant for node but package should be able to be required in node.
 */
describe("dexie-rxjs-addon dexie.spec", () => {
  describe("Dexie", () => {
    describe("Node require", () => {
      let DexieReq: typeof DexieImport;
      let DexieRxjsAddonReq: DexieRxjsAddonType;
      beforeAll(() => {
        DexieReq = require("dexie");
        DexieRxjsAddonReq = require("../../../dist/index");
      });
      it("should load Dexie.js", () => {
        expect(DexieReq).toBeTruthy();
      });
      it("should load DexieRxjsAddonAddon.js", () => {
        expect(DexieRxjsAddonReq).toBeTruthy();
        expect(DexieRxjsAddonReq.dexieRxjs).toBeTruthy();
      });
      it("should be able to use rxjs addon", async () => {
        expect(typeof DexieRxjsAddonReq.dexieRxjs === "function").toBeTrue();
      });
    });
  });
});
