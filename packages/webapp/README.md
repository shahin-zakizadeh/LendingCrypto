# Millenium Lending Club App

Front end writtent in Typescript to interact with the lending contract package.

## Stack
### UI
This app is built using React with Chakra UI. 

### Contract Interactions
It uses the [@mclb/lending-api]() package to interact with contracts. The API is initialised in `src/components/LendingClubProvider.tsx`. Lots of logic is implemented in `src/component/hooks/` folder.

When querying a contract use the useQuery hook from [@react-query](https://react-query-v3.tanstack.com/overview) package to handle the query.

For writing to the blockchain, you should use the useWriteContract hook available in `src/components/useWriteContract.ts`


### Forms

To handle forms, use [@react-hook-form](https://react-hook-form.com/)

Everytime you submit a tx to the blockchain, the data it changes should be refetch using the function provided by the `useQuery` hook from @react-query.

## Get started
Please follow the install instructions in the root directory before doing those steps.

1. `yarn chain:start` launch the Hardhat(HH) node which will automatically deploy the smart contracts. 

Once that is done, the @mclb/lending-api needs to be rebuilt to include the newly deployed contracts on the HH node. 

2. In another terminal, start the dev server with `yarn dev`. 

It automatically builds the api, but it can be build again with the `yarn api:build` command.


## Paths

Dev pages to facilitate testing

### /dev/mint
Mint page for the mock tokens deployed

### /dev/oracles
Page to change the oracle for the wBTC mock token

