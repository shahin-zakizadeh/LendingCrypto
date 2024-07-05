import { Flex, Link, Button, Text } from "@chakra-ui/react";
import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { oraclesPage } from "@/pages/dev/oracles";
import { tokenMintPage } from "@/pages/dev/TokenMint";
import Dashboard from "./Dashboard";
import { useChainId } from "wagmi";

const DEV_ENABLED_PAGE = [31337, 4002]

export default function DevDashboard(props: React.PropsWithChildren) {
    const chainId = useChainId();
    if (DEV_ENABLED_PAGE.includes(chainId)) {
        return (
            <Dashboard>
                <Flex mt={2}>
                    <Link as={RouterLink} to={oraclesPage.path} mr={2}>
                        <Button>Oracles</Button>
                    </Link>
                    <Link as={RouterLink} to={tokenMintPage.path} >
                        <Button>Mint</Button>
                    </Link>
                </Flex>
                {props.children}
            </Dashboard>
        )
    } else {
        return (
            <Dashboard>
                <Text>
                    Developper Dashboard is not enabled on this chain
                </Text>
            </Dashboard>
        )
    }


}