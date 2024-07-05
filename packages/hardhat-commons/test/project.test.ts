// tslint:disable-next-line no-implicit-dependencies
import { assert } from "chai";
import path from "path";

import { Hardon } from "../src/Hardon";

import { useEnvironment } from "./helpers";

describe("Integration tests examples", function () {
  describe("Hardhat Runtime Environment extension", function () {
    useEnvironment("hardhat-project");

    it("Should add the example field", function () {
      assert.instanceOf(
        this.hre.hardon,
        Hardon
      );
    });

    it("The example field should say hello", function () {
      assert.equal(this.hre.hardon.getChainId(), 31377);
    });
  });

  describe("HardhatConfig extension", function () {
    useEnvironment("hardhat-project");

    it("Should add the newPath to the config", function () {
      assert.equal(
        this.hre.config.paths.mnemonicsDir,
        path.join(process.cwd(), "asd")
      );
    });
  });
});


