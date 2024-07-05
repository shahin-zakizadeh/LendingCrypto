import { BigNumber, BigNumberish } from "ethers";

export const bnMax: (x: BigNumberish, y: BigNumberish) => BigNumber = (
    ...args
) => {
    const [a, b] = args.map(BigNumber.from);
    return a.gt(b) ? a : b;
};

export const bnMin: (x: BigNumberish, y: BigNumberish) => BigNumber = (
    ...args
) => {
    const [a, b] = args.map(BigNumber.from);
    return a.lt(b) ? a : b;
};
