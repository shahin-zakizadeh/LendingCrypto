import { BigNumber, BigNumberish, constants } from "ethers";
import { commify, formatUnits } from "ethers/lib/utils.js";

export interface BNFormatProps {
    value?: BigNumber;
    decimals?: number;
    displayDecimals?: number;
    compact?: boolean;
    maxValue?: BigNumberish;
}

const ORDERS_OF_MAGNITUDE = [
    "",
    "K",
    "M",
    "B",
    "T",
    "Qa",
    "Qi",
    "Sx",
    "Sp",
    "Oc",
    "No",
    "Dc",
];

export default function BNFormat(props: BNFormatProps) {
    if (!props.value) {
        return null;
    }
    let { value, decimals, displayDecimals } = props;
    let exceedsMax = false;

    if (props?.maxValue && value.gt(props.maxValue)) {
        value = BigNumber.from(props.maxValue);
        exceedsMax = true;
    }

    if (value.eq(constants.MaxUint256)) {
        return <>∞</>;
    }

    if (decimals && displayDecimals) {
        let displayValue = formatUnits(
            value.div(BigNumber.from(10).pow(decimals - displayDecimals)),
            displayDecimals
        );

        if (props.compact === undefined || props.compact) {
            let withCommas = commify(displayValue);
            let decomposed = withCommas.split(".")[0].split(",");
            let orderOfMagnitude = ORDERS_OF_MAGNITUDE[decomposed.length - 1];
            displayValue =
                decomposed.length > 1
                    ? `${decomposed[0]}.${decomposed[1].slice(
                          0,
                          2
                      )}${orderOfMagnitude}`
                    : displayValue;
        }

        return (
            <>
                {displayValue} {exceedsMax && "+"}
            </>
        );
    }

    return <>{formatUnits(value, decimals)}</>;
}
