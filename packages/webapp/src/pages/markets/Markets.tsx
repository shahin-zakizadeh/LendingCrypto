import {
    Box,
    Button,
    Card,
    CardBody,
    CardHeader,
    Flex,
    Grid,
    GridItem,
    Heading,
    Table,
    TableContainer,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tr,
} from "@chakra-ui/react";
import {
    ILendingClubMarkets,
    lendingClubMarkets,
    networkEnabled,
} from "@mclb/lending-api";
import { generatePath, Link as RouterLink, useParams } from "react-router-dom";
import { useAccount } from "wagmi";
import Market from "@/components/markets/Market";
import Dashboard from "@/layouts/Dashboard";
import { Page } from "@/utils/Page";
import { ChevronRightIcon } from "@chakra-ui/icons";

interface Market {
    name: string;
    chainId: string;
    market: string;
}

export function MarketsPage() {
    const { chainId, market, address: userAddress } = useParams();
    const { address: connectedAddress, isConnected } = useAccount();

    const vaults: Market[] = [];
    for (const [network, markets] of Object.entries(lendingClubMarkets.map)) {
        for (const [marketName, market] of Object.entries(markets)) {
            vaults.push({
                name: marketName,
                chainId: network,
                market: market.latest().address,
            });
        }
    }

    if (!chainId || !market) {
        return (
            <Dashboard>
                <Grid templateColumns="repeat(4, 1fr)" gap={5} px={4}>
                    <GridItem colSpan={{ base: 4, md: 1 }}>
                        <Card>
                            <CardHeader>
                                <Heading size="lg">Market Info</Heading>
                            </CardHeader>
                            <CardBody>
                                <Flex
                                    gap="4"
                                    pb="4"
                                    wrap="wrap"
                                    justify="space-between"
                                >
                                    {/*<Box w="100%" h="10rem">
                                        <ParentSize>
                                            {(parent) => (
                                                <SimpleChart
                                                    height={parent.height}
                                                    width={parent.width}
                                                />
                                            )}
                                        </ParentSize>
                                    </Box>*/}
                                    <Box>
                                        <Text fontSize="md" lineHeight={4}>
                                            Total Earning
                                        </Text>
                                        <Text fontSize="xl" fontWeight="bold">
                                            $450.23K
                                        </Text>
                                    </Box>
                                    <Box>
                                        <Text fontSize="md" lineHeight={4}>
                                            Total Borrowed
                                        </Text>
                                        <Text fontSize="xl" fontWeight="bold">
                                            $100.49K
                                        </Text>
                                    </Box>
                                </Flex>
                                <Box>
                                    <Heading size="md">Top Assets</Heading>
                                </Box>
                            </CardBody>
                        </Card>
                    </GridItem>
                    <GridItem colSpan={{ base: 4, md: 3 }}>
                        <Heading fontWeight="semibold" size="xl" ml="6" mb="6">
                            Markets
                        </Heading>
                        <TableContainer>
                            <Table>
                                <Thead>
                                    <Tr>
                                        <Th>Market</Th>
                                        <Th>Your Balance</Th>
                                        <Th>Interest Rate</Th>
                                        <Th>Available (utilization %)</Th>
                                        <Th>Risk Factor</Th>
                                        <Th />
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {vaults.map((vault) => (
                                        <>
                                            <Tr display="table-row">
                                                <Td>{vault.name}</Td>
                                                <Td>30</Td>
                                                <Td>100.20</Td>
                                                <Td>40.50</Td>
                                                <Td>1.23</Td>
                                                <Td>
                                                    <Button
                                                        size="sm"
                                                        as={RouterLink}
                                                        to={generatePath(
                                                            marketsPage.path,
                                                            vault
                                                        )}
                                                        rightIcon={
                                                            <ChevronRightIcon />
                                                        }
                                                    >
                                                        Open
                                                    </Button>
                                                </Td>
                                            </Tr>
                                        </>
                                    ))}
                                </Tbody>
                            </Table>
                        </TableContainer>
                    </GridItem>
                </Grid>
            </Dashboard>
        );
    }

    if (
        !networkEnabled.includes(Number(chainId) as keyof ILendingClubMarkets)
    ) {
        throw new Error("No deployments on this chain");
    }
    const network = Number(chainId) as keyof ILendingClubMarkets;

    return (
        <Dashboard>
            <Market
                userAddress={userAddress}
                chainId={network}
                marketAddress={market}
            />
        </Dashboard>
    );
}

export const marketsPage: Page = {
    path: "/markets/:chainId?/:market?/:address?",
    element: <MarketsPage />,
};
