import { BigNumber } from "ethers";
import {
    Button,
    Flex,
    FormControl,
    FormHelperText,
    forwardRef,
    Input,
    InputGroup,
    InputLeftAddon,
    InputRightElement,
    Stack,
    Tooltip,
} from "@chakra-ui/react";
import React, { useMemo } from "react";
import { formatUnits, parseUnits } from "ethers/lib/utils";
import useBalance from "@/components/hooks/useBalance";
import { Control, FieldValues, useController } from "react-hook-form";
import parseValue from "@/utils/parseValue";
import { Address } from "wagmi";
import { ILendingClubPeripherals } from "@mclb/lending-api";
import { InfoOutlineIcon } from "@chakra-ui/icons";
import BNFormat from "@/components/BNFormat";
import PercentOptions from "@/components/inputs/PercentOptions";
import BigNumberSlider from "@/components/inputs/BigNumberSlider";
import { QuickSelectProps } from "@/components/inputs/types";
import { bnMin } from "@/utils/bnUtils";
import { constants } from "ethers/lib.esm";

export const ERROR_OVER_BALANCE = "overBalance";
export const ERROR_OVER_ALLOWANCE = "overAllowance";
export const ERROR_OVER_MAX = "overMax";

interface BaseBalanceProps {
    address?: string | Address;
    token: string | Address;
    chainId: keyof ILendingClubPeripherals;
    spender?: string;
    label?: string;
    name: string;
    control: Control<FieldValues, any>;
    onChange?: () => void;
    max?: BigNumber;
    showBalance?: boolean;
}

interface TokenBalance extends BaseBalanceProps {
    setValue?: undefined;
}

interface TokenBalanceWithHelpers extends BaseBalanceProps, QuickSelectProps {}

const TokenBalance = forwardRef(
    (
        {
            address,
            token,
            chainId,
            spender,
            label,
            name,
            control,
            onChange,
            max,
            showBalance = true,
            ...props
        }: TokenBalance | TokenBalanceWithHelpers,
        ref
    ) => {
        const showSlider = (props.setValue && props.showSlider) ?? true;
        const showQuickSelect =
            (props.setValue && props.showQuickSelect) ?? true;
        const showMax = useMemo(() => {
            if (props.setValue && props.showMax) return true;
            return !(props.setValue && showQuickSelect);
        }, []);

        const { data: balance } = useBalance(
            { address, token, chainId, spender },
            { enabled: Boolean(address) }
        );

        const validate = {
            [ERROR_OVER_BALANCE]: (v: string) =>
                parseUnits(v ?? "0", balance.decimals).lte(balance.balanceOf),
            [ERROR_OVER_ALLOWANCE]: (v: string) =>
                parseUnits(v ?? "0", balance.decimals).lte(balance.allowance),
            [ERROR_OVER_MAX]: (v: string) =>
                max ? parseUnits(v ?? "0", balance.decimals).lte(max) : true,
        };

        const { field } = useController({
            name,
            control,
            rules: { validate },
            defaultValue: "",
        });
        const { value } = field;
        const amount = parseValue(value, balance.decimals);

        const isOverBalance = amount.gt(balance.balanceOf);
        const isOverAllowance = amount.gt(balance.allowance);
        const isOverMax = max ? amount.gt(max) : false;

        const maxLtBal = max && max.lt(balance.balanceOf);
        const maxAmount = maxLtBal ? max : balance.balanceOf;

        return (
            <FormControl isInvalid={isOverBalance}>
                <Stack>
                    <Flex gap="2">
                        <InputGroup>
                            <InputLeftAddon>
                                {balance?.symbol || "Amount"}
                            </InputLeftAddon>
                            <Input
                                {...field}
                                placeholder="0.0"
                                overflow="hidden"
                                onChange={(e) => {
                                    // allow commas and dots for decimals & only allow input up to the token's number of decimals
                                    let regex = new RegExp(
                                        `^\\d+[,.]?\\d{0,${balance.decimals}}$`
                                    );
                                    if (
                                        regex.test(e.target.value) ||
                                        e.target.value === ""
                                    ) {
                                        field.onChange(e.target.value);
                                        onChange?.();
                                    }
                                }}
                            />

                            {balance.balanceOf.gt(balance.allowance) && (
                                <InputRightElement
                                    children={
                                        <Tooltip
                                            label={`Current Allowance: ${formatUnits(
                                                balance.allowance,
                                                balance.decimals
                                            )}`}
                                        >
                                            <InfoOutlineIcon
                                                ml={1}
                                                color="gray.500"
                                            />
                                        </Tooltip>
                                    }
                                />
                            )}
                            {!isOverMax &&
                                !isOverBalance &&
                                isOverAllowance && (
                                    <InputRightElement
                                        children={
                                            <Tooltip
                                                label={
                                                    <>
                                                        Increase allowance to
                                                        proceed.
                                                        <br />
                                                        Current allowance:{" "}
                                                        {formatUnits(
                                                            balance.allowance,
                                                            balance.decimals
                                                        )}
                                                    </>
                                                }
                                            >
                                                <InfoOutlineIcon
                                                    ml={1}
                                                    color="yellow.500"
                                                />
                                            </Tooltip>
                                        }
                                    />
                                )}
                            {!isOverMax && isOverBalance && (
                                <InputRightElement
                                    children={
                                        <Tooltip
                                            label={
                                                "The amount is greater than your balance"
                                            }
                                        >
                                            <InfoOutlineIcon
                                                ml={1}
                                                color="red.500"
                                            />
                                        </Tooltip>
                                    }
                                />
                            )}
                            {isOverMax && (
                                <InputRightElement
                                    children={
                                        <Tooltip
                                            label={
                                                "The amount is greater than the max"
                                            }
                                        >
                                            <InfoOutlineIcon
                                                ml={1}
                                                color="red.500"
                                            />
                                        </Tooltip>
                                    }
                                />
                            )}
                        </InputGroup>
                        {props.setValue && showMax && (
                            <Button
                                variant="outline"
                                onClick={() =>
                                    props.setValue(name, balance.formatted, {
                                        shouldValidate: true,
                                    })
                                }
                            >
                                Max
                            </Button>
                        )}
                    </Flex>
                    {showBalance && (
                        <FormHelperText>
                            {maxLtBal ? "Balance" : "Max"}:{" "}
                            <BNFormat
                                value={maxAmount}
                                decimals={balance.decimals}
                                displayDecimals={4}
                            />
                        </FormHelperText>
                    )}

                    {props.setValue && showQuickSelect && (
                        <PercentOptions
                            setValue={props.setValue}
                            name={name}
                            max={bnMin(
                                balance.balanceOf,
                                max ?? constants.MaxUint256
                            )}
                            decimals={balance.decimals}
                            percentages={
                                props.showMax ? [25, 50, 75] : undefined
                            }
                        />
                    )}
                    {props.setValue && showSlider && (
                        <BigNumberSlider
                            setValue={props.setValue}
                            name={name}
                            value={parseValue(value || "0", balance.decimals)}
                            decimals={balance.decimals}
                            max={bnMin(
                                balance.balanceOf,
                                max ?? constants.MaxUint256
                            )}
                        />
                    )}
                </Stack>
            </FormControl>
        );
    }
);

export default TokenBalance;
