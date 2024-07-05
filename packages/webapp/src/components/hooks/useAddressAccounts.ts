import { ILendingClubMarkets } from "@mclb/lending-api";
import { useQuery, useQueryClient } from "react-query";
import { useAccount } from "wagmi";
import useMarket from "./useMarket";
import { useRPCRegistry } from "../RPCProvider";
import { BigNumber } from "ethers";
import { Call } from "@hovoh/ethcall";

interface UseUserAccountsProps {
    address?: string;
    marketAddress: string;
    chainId: keyof ILendingClubMarkets;
}

export default function useAddressAccounts(props: UseUserAccountsProps) {
    const { market, canRead, canWrite } = useMarket(props);
    const { multicall } = useRPCRegistry();
    const { address } = useAccount();
    const queryClient = useQueryClient();

    const idsQueryId = [props.marketAddress, "accounts", address];
    const ids = useQuery(
        idsQueryId,
        async () => {
            if (market && address) {
                const addressBalance = await market?.balanceOf(address);
                if (addressBalance.gt(0)) {
                    const accountsCall: Call<BigNumber>[] = [];
                    for (let i = 0; addressBalance.gt(i); i++) {
                        accountsCall.push(market.multiCall.tokenOfOwnerByIndex(address, i));
                    }
                    return multicall(props.chainId).all(accountsCall)
                }

            }
            return []
        }, {
        enabled: canRead
    })

    const refetch = async () => {
        queryClient.invalidateQueries(idsQueryId);
        await ids.refetch();
    };

    return {
        market,
        canRead,
        canWrite,
        refetch,
        accountIds: ids.data ?? [],
        isLoading: ids.isLoading,
        isSuccess: ids.isSuccess,
    };
}
