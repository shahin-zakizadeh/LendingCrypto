import { IMulticallProvider } from "@hovoh/ethcall";
import { NetworkID, ProvidersRegistry } from "@hovoh/evmcontractsregistry";
import { FetchSignerResult } from "@wagmi/core";
import { providers, Signer } from "ethers";
import { createContext, useContext } from "react";
import { Chain, useNetwork, useSigner } from "wagmi";
import { chainList } from "../connectors";

class FallbackProvidersRegistry extends ProvidersRegistry {
    constructor(
        private chainId: NetworkID,
        private provider: FetchSignerResult<Signer> | undefined,
        chains: Chain[]
    ) {
        super();
        chains.forEach((chain) => {
            this.addNetwork(chain.id, {
                httpRpc: chain.rpcUrls.default.http,
                wsRpc: chain.rpcUrls.default.webSocket ?? [],
            });
        });
    }

    public forNetwork(nid: NetworkID) {
        if (this.provider && nid === this.chainId) {
            return this.provider as unknown as providers.JsonRpcProvider;
        }
        return super.forNetwork(nid);
    }
}

interface IRPCProviders {
    ready: boolean;
    canWrite: boolean;
    registry: FallbackProvidersRegistry;
    multicall(network: number): IMulticallProvider;
}

const defaultProvider = new FallbackProvidersRegistry(-1, null, []);

const RPCContext = createContext<IRPCProviders>({
    ready: false,
    registry: defaultProvider,
    canWrite: false,
    multicall: (network: number) =>
        defaultProvider.multicallForNetwork(network),
});

export default function RPCProvidersProvider(props: React.PropsWithChildren) {
    const { chain } = useNetwork();
    const { data: signer } = useSigner();
    console.log("RPC SETUP");
    const providersRegistry = new FallbackProvidersRegistry(
        chain?.id ?? -1,
        signer,
        chainList
    );
    return (
        <RPCContext.Provider
            value={{
                ready: true,
                canWrite: Boolean(signer),
                registry: providersRegistry,
                multicall: (network: number) =>
                    providersRegistry.multicallForNetwork(network),
            }}
        >
            {props.children}
        </RPCContext.Provider>
    );
}

export const useRPCRegistry = () => {
    return useContext(RPCContext);
};
