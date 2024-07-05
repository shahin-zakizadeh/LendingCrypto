import { ILendingClubMarkets } from "@mclb/lending-api";
import { BigNumber, BigNumberish } from "ethers";
import { parseUnits } from "ethers/lib/utils.js";
import { useQuery } from "react-query";
import { Address } from "wagmi";
import { useRPCRegistry } from "../RPCProvider";
import useMarket from "./useMarket";

export interface UseLoadMarketProps {
    marketAddress: string;
    chainId: keyof ILendingClubMarkets;
    accountId?: BigNumberish;
}

export const MAX_LTV_DECIMALS = 4;

export default function useLoadMarket(props: UseLoadMarketProps) {
    const { multicall } = useRPCRegistry();

    let { market, canRead } = useMarket(props);

    const query = useQuery(
        ["market", props.chainId, props.marketAddress],
        () => {
            if (market) {
                return multicall(props.chainId).all([
                    market.multiCall.symbol(),
                    market.multiCall.name(),
                    market.multiCall.APR(),
                    market.multiCall.liquidationThreshold(),
                    market.multiCall.collateralToken(),
                    market.multiCall.getAvailableDebt(),
                    market.multiCall.getCollateralPrice(),
                    market.multiCall.getDebtPrice(),
                    market.multiCall.debtToken(),
                ]);
            }
        },
        { enabled: canRead }
    );

    

    const marketData = {
        symbol: query.data?.[0],
        name: query.data?.[1],
        interestRate: query.data?.[2],
        maxLtv: query.data?.[3]
            ? parseUnits("1", 22).div(query.data?.[3])
            : BigNumber.from("0"),
        collateralAddress: query.data?.[4] as Address,
        collateralTokenPrice: query.data?.[6] ?? BigNumber.from("0"),
        debtTokenAddress: query.data?.[8] as Address,
        availableDebtToken: query.data?.[5] ?? BigNumber.from("0"),
        debtTokenPrice: query.data?.[7] ?? BigNumber.from("0"),
        liquidationThreshold: query.data?.[3] ?? BigNumber.from("0"),
    };

    return {
        market,
        ...marketData,
        ...query,
    };
}
