# Millenium Club Lending API

This API is the [typechain for ethers with multicall](https://github.com/HOVOH/TypeChain/tree/master/packages/target-ethers-multicall) bindings 
bundled together using [EVMContractsRegistry](https://github.com/HOVOH/web3-services/tree/release/packages/EVMContractsRegistry)

## Features
- Typescript typings
- Contract addresses included
- Multichain
- Multicalls

## How to use

### install
`yarn add @mclb/lending-api ethers @hovoh/ethcall`

@hovoh/ethcall is a package for multicalls. If you're not using multicalls you don't need to install it.

### Using the api
Initialise your ProvidersRegistry from [EVMContractsRegistry](https://github.com/HOVOH/web3-services/tree/release/packages/EVMContractsRegistry)
and use the initMaiApi(providers: ProviderRegistry) to initialise the API.

```typescript
import {providers} from "@hovoh/evmcontractsregistry";
import {initLendingClubApi, LendingClubApi} from "@mclb/lending-api";

const lcApi: LendingClubApi = initLendingClubApi(providers);
```

The LendingClubApi object has two NetworkContractsRegistry: 
1. `vaults` has all the vaults
2. `peripherals` has all the other contracts. It also has the bindings to call arbitrary vaults.

**Examples:**

To query a vault (using multicalls):
```typescript
        const [symbol, closingFee] = await vaults.forNetwork(Network.OPERA_MAINNET).multiCall((get) => [
            get("WFTMVault").symbol(),
            get("WFTMVault").closingFee()
        ])
```

To query vault available funds:
```typescript
import {Network} from "@hovoh/evmcontractsregistry";
const wftmVault = lcApi.vaults.forNetwork(Network.OPERA_MAINNET)
    .getContractInstance("WFTMVault");
const maiBorrowAvailable = maiApi.peripherals.forNetwork(Network.OPERA_MAINNET).getContractInstance("mUSD").balanceOf(wftmVault.address)
```

## Publishing

Publishing is done automatically via a Github Action every time the version in the package.json is increased.