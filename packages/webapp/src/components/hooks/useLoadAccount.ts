import { ILendingClubMarkets } from "@mclb/lending-api";
import { BigNumber } from "ethers";
import { useQuery } from "react-query";
import { Address, useAccount } from "wagmi";
import { useRPCRegistry } from "../RPCProvider";
import useLoadMarket, { MAX_LTV_DECIMALS } from "./useLoadMarket";
import useMarket from "./useMarket";
import parseValue from "@/utils/parseValue";
import { bnMax } from "@/utils/bnUtils";
import { parseEther, parseUnits } from "ethers/lib/utils.js";
import useBalance from "./useBalance";

export interface UseLoadAccountProps {
    marketAddress: string;
    chainId: keyof ILendingClubMarkets;
    accountId?: BigNumber;
}

const ORACLE_DECIMALS = 8;

export default function useLoadAccount(props: UseLoadAccountProps) {
    const { multicall } = useRPCRegistry();
    const { address } = useAccount();

    const { market, canRead, canWrite } = useMarket(props);

    const {
        debtTokenPrice,
        collateralTokenPrice,
        maxLtv,
        availableDebtToken,
        collateralAddress,
        debtTokenAddress,
        liquidationThreshold,
    } = useLoadMarket(props);

    const query = useQuery(
        ["market", props.chainId, props.marketAddress, props.accountId],
        () => {
            if (market && props.accountId) {
                return multicall(props.chainId).all<
                    BigNumber,
                    BigNumber,
                    BigNumber,
                    string
                >([
                    market.multiCall.principalAmount(props.accountId),
                    market.multiCall.collateralAmount(props.accountId),
                    market.multiCall.calculateHealthRatio(props.accountId),
                    market.multiCall.ownerOf(props.accountId),
                ]);
            }
        },
        { enabled: canRead }
    );

    const collateral = useBalance({
        token: collateralAddress,
        chainId: props.chainId,
    }, { enabled: Boolean(collateralAddress) });
    const principal = useBalance({
        token: debtTokenAddress,
        chainId: props.chainId,
    }, { enabled: Boolean(debtTokenAddress) });
    const [debtAmount, collateralAmount, healthRatio, ownerOf] = query.data ?? [BigNumber.from(0), BigNumber.from(0), BigNumber.from(0), ""]
    const oracleUnit = debtTokenPrice;
    const debtValue = debtAmount.mul(parseUnits("1", 18 - (principal.data.decimals ?? 18))).mul(debtTokenPrice).div(parseEther("1"));

    const collateralValue = collateralAmount.mul(parseUnits("1", 18 - (collateral.data.decimals ?? 18)))
        .mul(collateralTokenPrice)
        .div(oracleUnit);

    let maxDebt = BigNumber.from(0);
    if (debtTokenPrice.gt(0)) {
        maxDebt = collateralValue.mul(maxLtv).div(10 ** MAX_LTV_DECIMALS); //this is max borrow value
        maxDebt = maxDebt.mul(oracleUnit).div(debtTokenPrice); // convert to amount
        maxDebt = maxDebt.div(parseUnits("1", 18 - (principal.data.decimals ?? 18)))//decimal adjustment
    }

    if (availableDebtToken.lt(maxDebt)) {
        maxDebt = availableDebtToken;
    }

    let minCollateral = BigNumber.from(0);
    if (maxLtv.gt(0)) {
        minCollateral = debtValue.mul(10 ** MAX_LTV_DECIMALS).div(maxLtv);
        minCollateral = minCollateral
            .mul(oracleUnit)
            .div(collateralTokenPrice);
    }

    // estimates LTV and health ratio based on collateral and debt values
    // if collateral or debt are not provided, it will use the current values
    let estimateValues = (params: {
        newCollateralAmount?: BigNumber;
        newDebtAmount?: BigNumber;
    }) => {
        let newCollateralAmount = params.newCollateralAmount ?? collateralAmount;
        let newDebtAmount = params.newDebtAmount ?? debtAmount;
        const collateralValue = newCollateralAmount.mul(parseUnits("1", 18 - collateral.data.decimals)).mul(collateralTokenPrice)
        const principalValue = newDebtAmount.mul(parseUnits("1", 18 - principal.data.decimals)).mul(debtTokenPrice)
        let ltv = principalValue.mul(parseValue("1", 18))
            .div(bnMax("1", collateralValue));

        let healthRatio = collateralValue.div(liquidationThreshold).mul(parseUnits("1", 36)).div(bnMax("1", principalValue));

        return { ltv, healthRatio };
    };

    return {
        market,
        canRead,
        canWrite,
        ownerOf: ownerOf as Address,
        ltv: collateralValue.gt(0)
            ? debtValue.mul(10000).div(collateralValue) // percent, 2 decimals
            : BigNumber.from(0),
        healthRatio,
        debtTokenAddress,
        debtAmount,
        debtTokenPrice,
        debtValue,
        collateralAddress,
        collateralAmount,
        collateralTokenPrice,
        collateralValue,
        maxDebt,
        minCollateral,
        isOwner: Boolean(
            props?.accountId && !query.isLoading && ownerOf === address
        ),
        estimateValues,
        ...query,
    };
}
