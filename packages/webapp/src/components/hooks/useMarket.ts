import { useLCApi } from "../LendincClubProvider";
import { isAddress } from "ethers/lib/utils.js";
import { ILendingClubMarkets, Market } from "@mclb/lending-api";

export interface UseMarketProps {
    marketAddress: string;
    chainId: keyof ILendingClubMarkets;
}

export default function useMarket(props: UseMarketProps) {
    const { peripherals, markets: vaults, canRead, canWrite } = useLCApi();
    let market: Market | undefined;
    if (canRead) {
        market = isAddress(props.marketAddress)
            ? peripherals
                  .forNetwork(props.chainId)
                  .getContractInstance("market", props.marketAddress)
            : vaults
                  .forNetwork(props.chainId)
                  .getContractInstance(props.marketAddress);
    }

    return { market, canRead, canWrite };
}
