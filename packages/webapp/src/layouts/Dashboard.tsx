import { Box, Center, Flex, Link as ChakraLink, Spacer, } from "@chakra-ui/react";
import React from "react";
import { generatePath, NavLink as RouterLink } from "react-router-dom";
// import { useNetwork } from "wagmi";
import ChainSwitch from "@/components/ChainSwitch";
import WalletButton from "@/components/connectButton";
import { Logo, Wordmark } from "@/components/Svg";
import { marketsPage } from "@/pages/markets/Markets";

const Link = ({ to, children }: { to: string; children: React.ReactNode }) => (
    <ChakraLink
        as={RouterLink}
        to={to}
        fontSize="20px"
        letterSpacing="0.5px"
        _activeLink={{ fontWeight: "bold", letterSpacing: "unset" }}
    >
        {children}
    </ChakraLink>
);

export default function Dashboard(props: React.PropsWithChildren) {
    // const { chain } = useNetwork();
    return (
        <Box w={"100%"}>
            <Center>
                <Box w={"100%"} maxWidth="container.xl" py={2} px="14px">
                    <Flex alignItems={"center"} gap="34px">
                        <RouterLink to={"/"}>
                            <Flex align="center" gap="6px">
                                <Logo height={28} />
                                <Wordmark height={20} />
                            </Flex>
                        </RouterLink>
                        <Flex gap="22px">
                            <Link to="/">Dashboard</Link>
                            <Link to={generatePath(marketsPage.path)}>
                                Markets
                            </Link>
                            <Link to="/vaults">Vaults</Link>
                        </Flex>

                        <Spacer />
                        <Flex alignItems={"center"} gap="8px">
                            <ChainSwitch chainId={250} />
                            <WalletButton />
                        </Flex>
                    </Flex>
                </Box>
            </Center>
            <Center>
                <Box w={"100%"} mt="38px" maxWidth="container.xl">
                    {props.children}
                </Box>
            </Center>
        </Box>
    );
}
