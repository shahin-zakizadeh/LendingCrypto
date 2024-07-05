import { Chain, configureChains, createClient } from "wagmi";
import { InjectedConnector } from "wagmi/connectors/injected";
import { publicProvider } from "wagmi/providers/public";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";

const hardhat: Chain = {
    id: 31337,
    name: "Hardhat",
    network: "hardhat",
    nativeCurrency: {
        decimals: 18,
        name: "Ethereum",
        symbol: "ETH",
    },
    rpcUrls: {
        public: { http: ["http://127.0.0.1:8545"] },
        default: { http: ["http://127.0.0.1:8545"] },
    },
};
const fantom: Chain = {
    id: 250,
    name: "Fantom",
    network: "fantom",
    nativeCurrency: {
        decimals: 18,
        name: "Fantom",
        symbol: "FTM",
    },
    rpcUrls: {
        public: { http: ["https://rpc.ftm.tools"] },
        default: { http: ["https://rpc.ftm.tools"] },
    },
}

const fantom_testnet: Chain = {
    id: 4002,
    name: "Fantom Testnet",
    network: "fantom_testnet",
    nativeCurrency: {
        decimals: 18,
        name: "Fantom",
        symbol: "FTM",
    },
    rpcUrls: {
        public: { http: ["https://rpc.testnet.fantom.network/"] },
        default: { http: ["https://rpc.testnet.fantom.network/"] },
    },
}

export const chainList = [hardhat, fantom, fantom_testnet];

const { chains, provider, webSocketProvider } = configureChains(chainList, [
    jsonRpcProvider({
        rpc: (chain) => ({
            http: hardhat.rpcUrls.default.http[0],
        }),
    }),
    publicProvider(),
]);

export const client = createClient({
    autoConnect: true,
    connectors: [new InjectedConnector({ chains })],
    provider,
    webSocketProvider,
});
