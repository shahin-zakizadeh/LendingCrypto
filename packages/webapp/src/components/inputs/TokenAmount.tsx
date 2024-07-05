import {
    Button,
    Flex,
    FormControl,
    FormHelperText,
    Input,
    InputGroup,
    InputLeftAddon,
    InputRightElement,
    Stack,
    Tooltip,
} from "@chakra-ui/react";
import { BigNumber } from "ethers";
import { formatUnits, parseUnits } from "ethers/lib/utils.js";
import { Control, FieldValues, useController } from "react-hook-form";
import parseValue from "../../utils/parseValue";
import React, { useMemo } from "react";
import { InfoOutlineIcon } from "@chakra-ui/icons";
import BNFormat from "@/components/BNFormat";
import PercentOptions from "@/components/inputs/PercentOptions";
import BigNumberSlider from "@/components/inputs/BigNumberSlider";
import { QuickSelectProps } from "@/components/inputs/types";

interface BaseTokenAmount {
    label?: string;
    name: string;
    control: Control<FieldValues, any>;
    max: BigNumber;
    decimals: number;
    symbol?: string;
    onChange?: () => void;
}

interface TokenAmountProps extends BaseTokenAmount {
    setValue?: undefined;
}

interface TokenAmountWithHelpers extends BaseTokenAmount, QuickSelectProps {}

export const ERROR_OVER_MAX = "overMax";

export default function TokenAmount({
    label,
    name,
    control,
    onChange,
    max,
    decimals,
    symbol,
    ...props
}: TokenAmountProps | TokenAmountWithHelpers) {
    const showSlider = (props.setValue && props.showSlider) ?? true;
    const showQuickSelect = (props.setValue && props.showQuickSelect) ?? true;
    const showMax = useMemo(() => {
        if (props.setValue && props.showMax) return true;
        return !(props.setValue && showQuickSelect);
    }, []);

    const validate = {
        [ERROR_OVER_MAX]: (v: string) =>
            parseUnits(v ?? "0", decimals).lte(max),
    };

    const { field } = useController({
        name,
        control,
        rules: { validate },
        defaultValue: "",
    });
    const { value } = field;
    const amount = parseValue(value, decimals);

    const isOverMax = amount.gt(max);

    return (
        <FormControl isInvalid={isOverMax}>
            <Stack>
                <Flex gap="2">
                    <InputGroup>
                        <InputLeftAddon>{symbol || "Amount"}</InputLeftAddon>
                        <Input
                            {...field}
                            onChange={(e) => {
                                // allow commas and dots for decimals & only allow input up to the token's number of decimals
                                let regex = new RegExp(
                                    `^\\d+[,.]?\\d{0,${decimals}}$`
                                );
                                if (
                                    regex.test(e.target.value) ||
                                    e.target.value === ""
                                ) {
                                    field.onChange(e.target.value);
                                    onChange?.();
                                }
                            }}
                            value={value}
                            placeholder="0.0"
                            overflow="hidden"
                        />
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
                                props.setValue(name, formatUnits(max, decimals))
                            }
                        >
                            Max
                        </Button>
                    )}
                </Flex>
                <FormHelperText>
                    Max:{" "}
                    <BNFormat
                        value={max}
                        decimals={decimals}
                        displayDecimals={4}
                    />
                </FormHelperText>
                {props.setValue && showQuickSelect && (
                    <PercentOptions
                        setValue={props.setValue}
                        name={name}
                        max={max}
                        decimals={decimals}
                        percentages={props.showMax ? [25, 50, 75] : undefined}
                    />
                )}
                {props.setValue && showSlider && (
                    <BigNumberSlider
                        setValue={props.setValue}
                        name={name}
                        value={parseValue(value || "0", decimals)}
                        decimals={decimals}
                        max={max}
                    />
                )}
            </Stack>
        </FormControl>
    );
}
