import { Menu, MenuButton, MenuItem, MenuList } from "@chakra-ui/react";
import React from "react";
import { ChainLogo } from "./Svg";
import { chainList } from "../connectors";
import { useChainId, useSwitchNetwork } from "wagmi";

export interface IChainSwitchProps {
    chainId?: number;
}

const ChainSwitch: React.FC<IChainSwitchProps> = () => {
    const chainId = useChainId();
    const { switchNetwork } = useSwitchNetwork();

    return (
        <Menu placement="bottom-end">
            <MenuButton>
                <ChainLogo boxSize="40px" chainId={chainId} />
            </MenuButton>
            <MenuList>
                {chainList.map((chain, idx) => (
                    <React.Fragment key={idx}>
                        <MenuItem
                            bgColor={
                                chainId === chain.id ? "gray.800" : "gray.700"
                            }
                            _hover={{ bgColor: "gray.600" }}
                            onClick={() => switchNetwork?.(chain.id)}
                        >
                            <ChainLogo
                                chainId={chain.id}
                                boxSize="24px"
                                mr="2"
                            />
                            <span>{chain.name}</span>
                        </MenuItem>
                    </React.Fragment>
                ))}
            </MenuList>
        </Menu>
    );
};
export default ChainSwitch;
