
# Lending Crypto Repo

Monorepo for all the code regarding the Crypto lending platform.

## Set up
VSCode with the Hardhat extension enabled is recommended

**Dependencies:**
- Node 16-18
- Yarn
If yarn is not installed, run the following command in terminal:
```bash
$ npm install --global yarn
```
For more information follow the link below:
https://yarnpkg.com/
- Docker (for the monitoring service)
**Install**
1. Clone the repo
2. cd into the root folder
3. `yarn install`
4. `yarn w:contracts setup` will build the hardhat-commons package and generate an account mnemonic stored in `packages/lending-contracts/mnemonics/default.secret`. This command will also print out the secret key which you can use to import in your wallet. You can print the secret key again using `yarn w:contracts secret`. 

## Packages

### Docs

Docusaurus set up with documentation.
Bring up the platform documentation by going into the directory and running the following commands:
1. `yarn install`
2. `yarn start`

### hardhat-commons (@lenclub/hardon)

Hardhat librairies for helper functions

### lending-contracts (@lenclub/lending-contracts)

Main Solidity contracts for the lending platform

### monitoring-service

NestJs app to monitor data and run the liquidation

### webapp

React app using Chakra UI

### api (@your name/lending-api)

Api to bundle contract typings with addresses automatically

## Issues

### Metamask wrong nonce

When relaunching your hardhat node it always start with a fresh state, so your Metamask's nonce and the Hardhat node nonce will get out of sync. 
**Solution 1**:
Follow the step in  [this article](https://blog.chronologic.network/how-to-change-and-reset-your-nonce-in-metamask-f7ca52f480e5) and set your nonce manually every time.

**Solution 2**:
Go to Setting > Advanced and click "Reset Account". It will delete your past transactions from history for all accounts.
