import { Call } from "@hovoh/ethcall";
import { BigNumber } from "ethers";
import { formatUnits } from "ethers/lib/utils.js";
import {
    QueryKey,
    useQuery,
    useQueryClient,
    UseQueryOptions,
} from "react-query";
import { Address } from "wagmi";
import { useLCApi } from "../LendincClubProvider";
import { useRPCRegistry } from "../RPCProvider";

export interface UseBalanceProps {
    address?: string | Address;
    token: string | Address;
    chainId: number;
    spender?: string;
}

export default function useBalance(
    props: UseBalanceProps,
    options?: Omit<
        UseQueryOptions<any, unknown, any, QueryKey>,
        "queryKey" | "queryFn"
    >
) {
    const { multicall } = useRPCRegistry();
    const { peripherals } = useLCApi();
    const queryClient = useQueryClient();

    const token = props.token
        ? peripherals
              .forNetwork(props.chainId)
              .getContractInstance("ERC20", props.token)
        : null;
    const queryId = ["balance", props.token, props.address, props.spender];
    const query = useQuery(
        queryId,
        () => {
            if (token) {
                const calls: Call<string | number | BigNumber>[] = [
                    token.multiCall.symbol(),
                    token.multiCall.name(),
                    token.multiCall.decimals(),
                ];
                if (props.address) {
                    calls.push(token.multiCall.balanceOf(props.address));
                }
                if (props.address && props.spender) {
                    calls.push(
                        token.multiCall.allowance(props.address, props.spender)
                    );
                }
                return multicall(props.chainId).all(calls);
            }
        },
        options
    );

    const refetch = () => {
        queryClient.invalidateQueries(queryId);
        query.refetch();
    };

    const decimals = query.data?.[2] as number;
    const balanceOf =
        (query.data?.length ?? 0) > 3
            ? (query.data?.[3] as BigNumber)
            : BigNumber.from(0);

    const data = {
        symbol: query.data?.[0] as string,
        name: query.data?.[1] as string,
        decimals,
        balanceOf,
        allowance:
            (query.data?.length ?? 0) > 4
                ? (query.data?.[4] as BigNumber)
                : BigNumber.from(0),
        formatted: formatUnits(balanceOf, decimals),
    };
    return {
        ...query,
        refetch,
        token,
        data,
    };
}
