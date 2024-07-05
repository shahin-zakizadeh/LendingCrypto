import { chakra, IconProps } from "@chakra-ui/react";
import React from "react";
import {
    Arbitrum,
    Avalanche,
    Binance,
    Ethereum,
    Fantom,
    Hardhat,
    Optimism,
    Polygon,
} from "./Chains";

export interface IChainLogoProps {
    chainId?: number;
    className?: string;
}

const idMap: { [key: number]: React.FC<IconProps> } = {
    31337: Hardhat,
    250: Fantom,
    4002: Fantom,
    1: Ethereum,
    10: Optimism,
    56: Binance,
    137: Polygon,
    43114: Avalanche,
    42161: Arbitrum,
};

const _ChainLogo: React.FC<IChainLogoProps & IconProps> = ({
    chainId,
    ...props
}) => {
    const Logo = idMap?.[chainId ?? 250];

    return <Logo {...props} />;
};

const ChainLogo = chakra(_ChainLogo);

export default ChainLogo;
