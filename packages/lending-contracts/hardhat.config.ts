import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";


import "@nomicfoundation/hardhat-toolbox"
import "hardhat-deploy"
import "@lenclub/hardon"
import "hardhat-abi-exporter"

import * as dotenv from 'dotenv'
import { getMnemonic } from "@lenclub/hardon";
import { externalAddresses, FANTOM_CHAIN_ID } from "./external-addresses";

dotenv.config()

const config: HardhatUserConfig = {
    networks: {
        hardhat: {
            accounts: {
                mnemonic: getMnemonic()
            },
        },
        fantom: {
            chainId: FANTOM_CHAIN_ID,
            url: "https://rpc.ankr.com/fantom",
            accounts: {
                mnemonic: getMnemonic()
            },
            verify: {
                etherscan: {
                    apiUrl: 'https://api.ftmscan.com',
                    apiKey: process.env.FTMSCAN_API_KEY
                }
            }
        },
        fantom_testnet: {
            chainId: 4002,
            url: "https://rpc.testnet.fantom.network/",
            accounts: {
                mnemonic: getMnemonic()
            },
            // Programmatic verification does not work.
            // Flatten the contracts and verify manually
            verify: {
                etherscan: {
                    apiUrl: 'https://testnet.ftmscan.com',
                    apiKey: process.env.FTMSCAN_API_KEY
                }
            }
        }
    },
    namedAccounts: {
        deployer: {
            default: 0
        }
    },
    solidity: {
        compilers: [
            {
                version: '0.8.10',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 250,
                    },
                    outputSelection: {
                        '*': {
                            '*': ['storageLayout'],
                        },
                    },
                },
            },
            {
                version: '0.8.11',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 250,
                    },
                    outputSelection: {
                        '*': {
                            '*': ['storageLayout'],
                        },
                    },
                },
            },
            {
                version: '0.8.17',
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 250,
                    },
                    outputSelection: {
                        '*': {
                            '*': ['storageLayout'],
                        },
                    },
                },
            },
        ],
    },
    abiExporter: {
        runOnCompile: true,
        clear: true,
        path: "./generated/abis"
    },
    externalAddresses
};

export default config;
