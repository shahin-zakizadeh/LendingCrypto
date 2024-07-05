import Decimal from "decimal.js";
import { BigNumber, BigNumberish } from "ethers/lib/ethers";
import { parseUnits } from "ethers/lib/utils";

export const bnToDecimal = (bn: BigNumberish, decimals: number) => {
    const bigNumber = BigNumber.from(bn);
    const numerator = new Decimal(bigNumber.toString());
    const denominator = new Decimal(parseUnits("1", decimals).toString());
    return numerator.div(denominator);
}

export const decimalToBn = (dec: Decimal, decimals: number) => {
    const scale = new Decimal(parseUnits("1", decimals).toString());
    const bn = dec.times(scale).toFixed(0);
    return BigNumber.from(bn.toString());
}