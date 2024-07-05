import { MutationFunction, useMutation, UseMutationOptions } from "react-query";
import { ContractTransaction, ContractReceipt } from "ethers";
import { useEffect, useState } from "react";

type OptionnalContractTransaction = ContractTransaction | undefined | null

interface UseWriteContractOptions<TError = unknown, TVariables = void, TContext = unknown> extends Omit<UseMutationOptions<OptionnalContractTransaction, TError, TVariables, TContext>, 'mutationFn'> {
    onConfirmation?: (data: ContractReceipt) => Promise<unknown> | void
}

export function useWriteContract<TError = unknown, TVariables = void, TContext = unknown>(
    mutationFn: (input: TVariables) => Promise<OptionnalContractTransaction> | null | undefined,
    options?: UseWriteContractOptions<TError, TVariables, TContext>
) {
    const mutationFnWrapped = (input: TVariables) => {
        const mutationOutput = mutationFn(input);
        if (!mutationOutput) {
            throw new Error("Mutation result is null. Expected TransactionReceipt")
        }
        return mutationOutput;
    }
    const mutation = useMutation(mutationFnWrapped, options);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [isReverted, setIsReverted] = useState(false);
    const [revertedWith, setRevertedWith] = useState<any | null>(null);

    const wrappedMutate = (input: TVariables) => {
        setIsConfirmed(false);
        setIsReverted(false);
        setRevertedWith(null);
        mutation.mutate(input);
    };

    useEffect(() => {
        if (mutation.data) {
            mutation.data.wait(1)
                .then((receipt) => {
                    setIsConfirmed(true);
                    if (options?.onConfirmation) {
                        Promise.resolve(options.onConfirmation(receipt))
                    }

                })
                .catch((e) => setRevertedWith(e));
        }

    }, [mutation.data]);

    return {
        ...mutation,
        sendTx: wrappedMutate,
        isWaitingOnInput: mutation.isLoading,
        isSubmitted: mutation.isSuccess,
        isConfirmed,
        isReverted,
        revertedWith,
        isPending: mutation.isLoading || !isConfirmed,
    };
}