import { ProvidersRegistry } from "@hovoh/evmcontractsregistry";
import { initLendingClubApi, LendingClubPeripherals, LendingClubMarkets, networkEnabled } from "@mclb/lending-api";
import { createContext, useContext } from "react";
import { useAccount, useNetwork } from "wagmi";
import { useRPCRegistry } from "./RPCProvider";

interface ILCApi {
    canRead: boolean;
    canWrite: boolean;
    peripherals: LendingClubPeripherals;
    markets: LendingClubMarkets;
    address: string;
    isConnected: boolean;
}

const defaultApi = initLendingClubApi(new ProvidersRegistry())

const LCApiProvider = createContext<ILCApi>({
    canRead: false,
    canWrite: false,
    peripherals: defaultApi.peripherals,
    markets: defaultApi.markets,
    address: "",
    isConnected: false
})

export function LCProvider(props: React.PropsWithChildren) {
    const { registry, ready } = useRPCRegistry();
    const { chain } = useNetwork();
    const { peripherals, markets } = initLendingClubApi(registry);
    const { address, isConnected } = useAccount();
    const canRead = ready;
    const canWrite = networkEnabled.includes(chain?.id ?? -1);
    return (
        <LCApiProvider.Provider value={{
            canRead,
            canWrite,
            peripherals,
            markets,
            address: (address ?? "") as string,
            isConnected
        }}>
            {props.children}
        </LCApiProvider.Provider>
    )

}

export const useLCApi = (): ILCApi => {
    return useContext(LCApiProvider)
}