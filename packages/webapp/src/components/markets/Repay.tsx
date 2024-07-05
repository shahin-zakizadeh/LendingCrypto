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
import TokenBalance, {
    ERROR_OVER_ALLOWANCE,
    ERROR_OVER_BALANCE,
    ERROR_OVER_MAX,
} from "../inputs/TokenBalance";
import { constants } from "ethers/lib.esm";
import Web3Button from "@/components/Web3Button";
import React, { useEffect } from "react";
import InfoDisplay from "@/components/markets/InfoDisplay";
import BNFormat from "@/components/BNFormat";

export interface RepayProps {
    marketAddress: string;
    chainId: keyof ILendingClubMarkets;
    accountId?: BigNumber;
}

export default function RepayTab(props: RepayProps) {
    const { address } = useAccount();
    const {
        market,
        debtTokenAddress,
        debtAmount,
        isLoading: isLoadingAccount,
        refetch: refetchAccount,
        isOwner,
        healthRatio,
        ltv,
        estimateValues,
    } = useLoadAccount(props);
    const {
        control,
        handleSubmit,
        formState: { errors },
        trigger,
        resetField,
        clearErrors,
        setValue,
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
            token: debtTokenAddress,
            chainId: props.chainId,
        },
        {
            enabled: Boolean(debtTokenAddress),
        }
    );

    const amountValue: number = useWatch({ name: "amount", control });
    const amount = parseValue(amountValue, balance.decimals);

    const { sendTx } = useWriteContract(
        async (amount: BigNumber) =>
            props.accountId && market?.repay(props.accountId, amount),
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
        newDebtAmount: debtAmount.sub(amount),
    });

    const overAllowance = errors.amount?.type === ERROR_OVER_ALLOWANCE;
    const overBalance = errors.amount?.type === ERROR_OVER_BALANCE;
    const overMax = errors.amount?.type === ERROR_OVER_MAX;
    return (
        <TabPanel px="0">
            <form>
                <Stack gap="1">
                    <TokenBalance
                        address={address}
                        token={debtTokenAddress}
                        chainId={props.chainId}
                        spender={market?.address}
                        label={"Repay Amount"}
                        name={"amount"}
                        onChange={() => trigger()}
                        control={control}
                        max={debtAmount}
                        setValue={setValue}
                    />
                    {token &&
                        (overAllowance ? (
                            <ApprovalButtons
                                token={token}
                                amount={amount}
                                spender={
                                    market?.address || constants.AddressZero
                                }
                                chainId={props.chainId}
                                onApproval={() => {
                                    refetchBal();
                                    clearErrors("amount");
                                }}
                            />
                        ) : (
                            <Web3Button
                                size="lg"
                                isDisabled={
                                    overBalance || overMax || amount.eq(0)
                                }
                                chainId={props.chainId}
                                onClick={handleSubmit(onSubmit)}
                            >
                                {!props.accountId ? "Select Account" : "Repay"}
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
                                    displayDecimals={2}
                                />,
                                ...(amount.gt(0)
                                    ? [
                                        <BNFormat
                                            value={balance.balanceOf.sub(
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
                                />,
                                ...[
                                    amount.gt(0) ? (
                                        <BNFormat
                                            value={estimated.healthRatio}
                                            decimals={18}
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
