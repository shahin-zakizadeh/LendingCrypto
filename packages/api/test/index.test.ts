import { initLendingClubApi } from "../src/";
import { providers } from "@hovoh/evmcontractsregistry";

describe('API', () => {
  it("Should initialize api", () => {
    const api = initLendingClubApi(providers);
  })
});
