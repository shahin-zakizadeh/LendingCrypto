import { BigNumber } from "ethers";
import { parseUnits } from "ethers/lib/utils.js";

export default function parseValue(value: any, decimals?: number) {
    return value === "" ? BigNumber.from("0") : parseUnits(value ?? "0", decimals)
}