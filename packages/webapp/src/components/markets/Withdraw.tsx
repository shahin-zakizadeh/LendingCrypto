import { Alert, AlertIcon, Stack, TabPanel } from "@chakra-ui/react";
import { ILendingClubMarkets } from "@mclb/lending-api";
import { BigNumber } from "ethers";
import { useForm, useWatch } from "react-hook-form";
import { useAccount } from "wagmi";
import parseValue from "@/utils/parseValue";
import useBalance from "../hooks/useBalance";
import useLoadAccount from "../hooks/useLoadAccount";
import { useWriteContract } from "../hooks/useWriteContract";
import TokenAmount, { ERROR_OVER_MAX } from "../inputs/TokenAmount";
import { constants } from "ethers/lib.esm";
import Web3Button from "@/components/Web3Button";
import React, { useEffect } from "react";
import InfoDisplay from "@/components/markets/InfoDisplay";
import BNFormat from "@/components/BNFormat";
import { bnMax } from "@/utils/bnUtils";

export interface WithdrawProps {
    marketAddress: string;
    chainId: keyof ILendingClubMarkets;
    accountId?: BigNumber;
}

export default function WithdrawTab(props: WithdrawProps) {
    const { address } = useAccount();
    const {
        market,
        collateralAddress,
        isLoading: isLoadingAccount,
        collateralAmount,
        minCollateral,
        healthRatio,
        refetch: refetchAccount,
        isOwner,
        ltv,
        estimateValues,
    } = useLoadAccount(props);
    const {
        data: balance,
        isLoading: isLoadingBalance,
        refetch: refetchBal,
    } = useBalance(
        {
            address,
            token: collateralAddress || constants.AddressZero,
            chainId: props.chainId,
        },
        {
            enabled: Boolean(collateralAddress),
        }
    );
    const {
        control,
        handleSubmit,
        formState: { errors },
        trigger,
        resetField,
        setValue,
    } = useForm();
    const reset = () => {
        resetField("amount", { defaultValue: "0" });
    };

    useEffect(() => {
        reset();
    }, [props.accountId]);

    const amountValue: number = useWatch({ name: "amount", control });

    const amount = parseValue(amountValue, balance.decimals);

    const refetch = () => {
        refetchAccount();
        refetchBal();
    };

    const { sendTx } = useWriteContract(
        async (amount: BigNumber) =>
            props.accountId && market?.withdraw(props.accountId, amount),
        {
            onSuccess: () => reset(),
            onConfirmation: () => refetch(),
        }
    );

    const onSubmit = (data: any) =>
        sendTx(parseValue(data.amount, balance.decimals));

    const estimated = estimateValues({
        newCollateralAmount: collateralAmount.sub(amount),
    });

    const isOverMax = errors.amount?.type === ERROR_OVER_MAX;
    return (
        <TabPanel px="0">
            <form>
                <Stack gap="1">
                    <TokenAmount
                        label={"Withdraw Amount"}
                        name={"amount"}
                        onChange={() => trigger()}
                        control={control}
                        max={collateralAmount.sub(minCollateral)}
                        decimals={balance.decimals}
                        symbol={balance.symbol}
                        setValue={setValue}
                    />
                    <Web3Button
                        size="lg"
                        isDisabled={isOverMax || !isOwner || amount.eq(0)}
                        chainId={props.chainId}
                        onClick={handleSubmit(onSubmit)}
                    >
                        {!props.accountId ? "Select Account" : "Withdraw"}
                    </Web3Button>
                </Stack>
                {!isOwner && (
                    <Alert status="warning" mt="3">
                        <AlertIcon />
                        You cannot withdraw from a vault you don't own.
                    </Alert>
                )}
                <InfoDisplay
                    data={[
                        {
                            label: "Balance",
                            values: [
                                <BNFormat
                                    value={balance.balanceOf}
                                    decimals={balance.decimals}
                                    displayDecimals={3}
                                />,
                                ...[
                                    amount.gt(0) ? (
                                        <BNFormat
                                            value={bnMax(
                                                balance.balanceOf.add(amount),
                                                0
                                            )}
                                            decimals={balance.decimals}
                                            displayDecimals={3}
                                        />
                                    ) : null,
                                ],
                            ],
                        },
                        {
                            label: "Health Factor",
                            values: [
                                <BNFormat
                                    value={healthRatio ?? constants.MaxUint256}
                                    decimals={18}
                                    displayDecimals={3}
                                    maxValue={parseValue("100")}
                                />,
                                ...[
                                    amount.gt(0) ? (
                                        <BNFormat
                                            value={estimated.healthRatio}
                                            decimals={balance.decimals}
                                            displayDecimals={3}
                                            maxValue={parseValue("100")}
                                        />
                                    ) : null,
                                ],
                            ],
                        },
                        {
                            label: "LTV",
                            values: [
                                <>
                                    <BNFormat
                                        value={ltv ?? constants.MaxUint256}
                                        decimals={2}
                                        displayDecimals={2}
                                    />
                                    %
                                </>,
                                ...[
                                    amount.gt(0) ? (
                                        <>
                                            <BNFormat
                                                value={estimated.ltv}
                                                decimals={16}
                                                displayDecimals={2}
                                            />
                                            %
                                        </>
                                    ) : null,
                                ],
                            ],
                        },
                    ]}
                />
            </form>
        </TabPanel>
    );
}
