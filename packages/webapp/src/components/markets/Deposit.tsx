import { Alert, AlertIcon, Stack, TabPanel } from "@chakra-ui/react";
import { ILendingClubMarkets } from "@mclb/lending-api";
import { BigNumber } from "ethers";
import { useForm, useWatch } from "react-hook-form";
import { useAccount } from "wagmi";
import parseValue from "@/utils/parseValue";
import useBalance from "../hooks/useBalance";
import useLoadAccount from "../hooks/useLoadAccount";
import { useWriteContract } from "../hooks/useWriteContract";
import ApprovalButtons from "../inputs/ApprovalButtons";
import {
    ERROR_OVER_ALLOWANCE,
    ERROR_OVER_BALANCE,
} from "../inputs/TokenBalance";
import { constants } from "ethers/lib.esm";
import TokenBalance from "@/components/inputs/TokenBalance";
import Web3Button from "@/components/Web3Button";
import React, { useEffect } from "react";
import InfoDisplay from "@/components/markets/InfoDisplay";
import BNFormat from "@/components/BNFormat";
import { bnMax } from "@/utils/bnUtils";

interface DepositProps {
    marketAddress: string;
    chainId: keyof ILendingClubMarkets;
    accountId?: BigNumber;
}

export default function DepositTab(props: DepositProps) {
    const { address } = useAccount();
    const {
        market,
        collateralAddress,
        isLoading: isLoadingAccount,
        refetch: refetchAccount,
        healthRatio,
        collateralAmount,
        isOwner,
        ltv,
        estimateValues,
    } = useLoadAccount(props);
    const {
        control,
        setValue,
        handleSubmit,
        formState: { errors },
        trigger,
        resetField,
        clearErrors,
    } = useForm();

    const reset = () => {
        resetField("amount", { defaultValue: "0" });
    };

    useEffect(() => {
        reset();
    }, [props.accountId]);

    const {
        token,
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

    const amountValue: number = useWatch({ name: "amount", control });
    const amount = parseValue(amountValue, balance.decimals);

    const { sendTx } = useWriteContract(
        async (amount: BigNumber) =>
            props.accountId && market?.deposit(props.accountId, amount),
        {
            onSuccess: () => reset(),
            onConfirmation: () => refetch(),
        }
    );

    const refetch = () => {
        refetchAccount();
        refetchBal();
    };
    const onSubmit = (data: any) =>
        sendTx(parseValue(data.amount, balance.decimals));

    const estimated = estimateValues({
        newCollateralAmount: collateralAmount.add(amount),
    });

    const overAllowance = errors.amount?.type === ERROR_OVER_ALLOWANCE;
    const overBalance = errors.amount?.type === ERROR_OVER_BALANCE;
    return (
        <TabPanel px="0">
            <form>
                <Stack gap="1">
                    <TokenBalance
                        address={address}
                        token={collateralAddress || constants.AddressZero}
                        chainId={props.chainId}
                        spender={market?.address}
                        label={"Deposit Amount"}
                        name={"amount"}
                        onChange={() => {
                            trigger();
                        }}
                        control={control}
                        setValue={setValue}
                        showSlider
                    />
                    {token &&
                        (overAllowance ? (
                            <ApprovalButtons
                                token={token}
                                amount={amount}
                                chainId={props.chainId}
                                spender={
                                    market?.address || constants.AddressZero
                                }
                                onApproval={() => {
                                    refetchBal();
                                    clearErrors("amount");
                                }}
                            />
                        ) : (
                            <Web3Button
                                size="lg"
                                isDisabled={
                                    overBalance || amount.eq(0) || !isOwner
                                }
                                onClick={handleSubmit(onSubmit)}
                                chainId={props.chainId}
                            >
                                {!props.accountId
                                    ? "Select Account"
                                    : "Deposit"}
                            </Web3Button>
                        ))}
                </Stack>
                {!isOwner && Boolean(props.accountId) && (
                    <Alert status="warning" mt="3">
                        <AlertIcon />
                        It seems you are depositing into a vault you don't own.
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
                                                balance.balanceOf.sub(amount),
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
                                    maxValue={parseValue("100", 18)}
                                />,
                                ...[
                                    amount.gt(0) ? (
                                        <BNFormat
                                            value={estimated.healthRatio}
                                            decimals={balance.decimals}
                                            displayDecimals={3}
                                            maxValue={parseValue("100", 18)}
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
                                        maxValue={parseValue("100")}
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
                                                maxValue={parseValue("100")}
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
