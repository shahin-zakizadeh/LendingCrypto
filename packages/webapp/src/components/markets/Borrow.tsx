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
import Web3Button from "@/components/Web3Button";
import React, { useEffect } from "react";
import InfoDisplay from "@/components/markets/InfoDisplay";
import BNFormat from "@/components/BNFormat";
import { constants } from "ethers/lib.esm";

export interface BorrowProps {
    marketAddress: string;
    chainId: keyof ILendingClubMarkets;
    accountId?: BigNumber;
}

export default function BorrowTab(props: BorrowProps) {
    const { address } = useAccount();
    const {
        market,
        ownerOf,
        collateralAddress,
        debtTokenAddress,
        isLoading: isLoadingAccount,
        debtAmount,
        refetch: refetchAccount,
        maxDebt: maxBorrow,
        isOwner,
        healthRatio,
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
            token: debtTokenAddress ?? constants.AddressZero,
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
            props.accountId && market?.borrow(props.accountId, amount),
        {
            onSuccess: () => reset(),
            onConfirmation: () => refetch(),
        }
    );

    const onSubmit = (data: any) =>
        sendTx(parseValue(data.amount, balance.decimals));

    const estimated = estimateValues({
        newDebtAmount: debtAmount.add(amount),
    });

    const isOverMax = errors.amount?.type === ERROR_OVER_MAX;
    const isNotOwner = !isLoadingAccount && ownerOf !== address;
    return (
        <TabPanel px="0">
            <form>
                <Stack gap="1">
                    <TokenAmount
                        label={"Borrow Amount"}
                        name={"amount"}
                        onChange={() => trigger()}
                        control={control}
                        max={maxBorrow.sub(debtAmount)}
                        decimals={balance.decimals}
                        symbol={balance.symbol}
                        setValue={setValue}
                    />
                    <Web3Button
                        size="lg"
                        isDisabled={isOverMax || isNotOwner || amount.eq(0)}
                        chainId={props.chainId}
                        onClick={handleSubmit(onSubmit)}
                    >
                        {!props.accountId ? "Select Account" : "Borrow"}
                    </Web3Button>
                </Stack>
                {!isOwner && Boolean(props.accountId) && (
                    <Alert status="warning" mt="3">
                        <AlertIcon />
                        You cannot borrow from a vault you don't own.
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
                                    displayDecimals={2}
                                />,
                                ...(amount.gt(0)
                                    ? [
                                        <BNFormat
                                            value={balance.balanceOf.add(
                                                amount
                                            )}
                                            decimals={balance.decimals}
                                            displayDecimals={2}
                                        />,
                                    ]
                                    : []),
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
                                            decimals={18}
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
