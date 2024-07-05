import { BigNumber, constants, Contract } from "ethers";
import { useWriteContract } from "@/components/hooks/useWriteContract";
import { useAccount, useSigner } from "wagmi";
import { useQuery, useQueryClient } from "react-query";
import {
    ERC20,
    ERC20__factory,
} from "@lenclub/lending-contracts/typechain-types";
import { useMemo, useState } from "react";

function useAllowance(token: string, spender: string, amount?: BigNumber) {
    const { data: signer } = useSigner();
    const { address } = useAccount();
    const tokenContract = useMemo(() => {
        let contract = new Contract(token, ERC20__factory.abi);
        if (signer) {
            contract = contract.connect(signer);
        }
        return contract;
    }, [signer]) as ERC20;
    const queryClient = useQueryClient();
    const [currentAmount, setCurrentAmount] = useState(constants.Zero);

    const { data: allowance } = useQuery(
        ["allowance", token],
        async () => {
            return address
                ? tokenContract.allowance(address, spender)
                : BigNumber.from(0);
        },
        {
            enabled: Boolean(signer),
        }
    );

    const setOptimistically = (amount: BigNumber) => {
        queryClient.setQueryData(["allowance", token], amount);
    };

    const approveAmount = useWriteContract(
        async () => {
            setCurrentAmount(amount ?? constants.MaxUint256);
            return tokenContract.approve(
                spender,
                amount ?? constants.MaxUint256
            );
        },
        {
            onConfirmation: () =>
                setOptimistically(currentAmount ?? constants.MaxUint256),
        }
    );
    const approveFull = useWriteContract(
        async () => tokenContract.approve(spender, constants.MaxUint256),
        { onConfirmation: () => setOptimistically(constants.MaxUint256) }
    );

    if (amount) {
        return {
            approveAmount,
            approveFull,
            allowance,
        };
    }
    return {
        approve: approveFull,
        allowance,
    };
}

export default useAllowance;
