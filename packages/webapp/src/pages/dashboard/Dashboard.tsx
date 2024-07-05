import {
    Box,
    Button,
    Card,
    CardBody,
    CardHeader,
    CircularProgress,
    CircularProgressLabel,
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
import { RouteObject } from "react-router-dom";
import HeartIcon from "@/components/Svg/HeartIcon";
import Dashboard from "@/layouts/Dashboard";
import { ChainLogo } from "@/components/Svg";
import { ChevronRightIcon } from "@chakra-ui/icons";

export function DashboardPage() {
    return (
        <Dashboard>
            <Grid templateColumns="repeat(4, 1fr)" gap={5} px={4}>
                <GridItem colSpan={{ base: 4, md: 1 }}>
                    <Card>
                        <CardHeader>
                            <Heading size="lg">Summary</Heading>
                        </CardHeader>
                        <CardBody>
                            <Flex gap="4" pb="4">
                                <Box>
                                    <CircularProgress
                                        value={80}
                                        size={32}
                                        margin="-6px"
                                        thickness="3px"
                                        color="primary.500"
                                        trackColor="primary.800"
                                        capIsRound
                                    >
                                        <CircularProgressLabel>
                                            <Flex
                                                justify="center"
                                                align="center"
                                                gap={2}
                                            >
                                                <HeartIcon boxSize={6} />
                                                <Text
                                                    sx={{
                                                        fontSize: "xl",
                                                        color: "primary.500",
                                                        fontWeight: "semibold",
                                                    }}
                                                >
                                                    1.8
                                                </Text>
                                            </Flex>
                                        </CircularProgressLabel>
                                    </CircularProgress>
                                </Box>
                                <Box>
                                    <Text fontSize="md" lineHeight={4}>
                                        Total Deposited
                                    </Text>
                                    <Text fontSize="xl" fontWeight="bold">
                                        $30K
                                    </Text>
                                    <Text fontSize="md" lineHeight={4} mt={4}>
                                        Total Borrowed
                                    </Text>
                                    <Text fontSize="xl" fontWeight="bold">
                                        $12K
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
                    <Grid templateColumns="repeat(2, 1fr)" gap={5}>
                        <GridItem colSpan={2}>
                            <Heading
                                fontWeight="semibold"
                                size="xl"
                                ml="6"
                            >
                                Dashboard
                            </Heading>
                        </GridItem>
                        <GridItem colSpan={{ base: 2, md: 1 }}>
                            <Card h="100%">
                                <CardHeader>
                                    <Flex justify="space-between" gap={4}>
                                        <Box>
                                            <Heading size="lg">
                                                Lowest Interests
                                            </Heading>
                                        </Box>

                                        <Button
                                            size="sm"
                                            aria-label="create vault"
                                            flexShrink="0"
                                            rightIcon={<ChevronRightIcon />}
                                        >
                                            Create Vault
                                        </Button>
                                    </Flex>
                                </CardHeader>
                                <CardBody>
                                    <TableContainer>
                                        <Table size="sm">
                                            <Thead>
                                                <Tr>
                                                    <Th>Market</Th>
                                                    <Th>Interest Rate (APY)</Th>
                                                    <Th>
                                                        Available (utilization
                                                        %)
                                                    </Th>
                                                </Tr>
                                            </Thead>
                                            <Tbody>
                                                <Tr>
                                                    <Td>
                                                        <ChainLogo
                                                            chainId={250}
                                                            width={8}
                                                            height={8}
                                                            mr={2}
                                                        />
                                                        WETH
                                                    </Td>
                                                    <Td>1%</Td>
                                                    <Td>2M (20%)</Td>
                                                </Tr>
                                            </Tbody>
                                        </Table>
                                    </TableContainer>
                                </CardBody>
                            </Card>
                        </GridItem>
                        <GridItem colSpan={{ base: 2, md: 1 }}>
                            <Card h="100%">
                                <CardHeader>
                                    <Flex justify="space-between" gap={4}>
                                        <Heading size="lg">mUSD</Heading>
                                        <Button
                                            size="sm"
                                            aria-label="create vault"
                                            flexShrink="0"
                                        >
                                            Trade
                                        </Button>
                                    </Flex>
                                </CardHeader>
                                <CardBody>
                                    <Grid
                                        templateColumns="repeat(2, 1fr)"
                                        gap="2"
                                    >
                                        <GridItem colSpan={1}>
                                            28d change:{" "}
                                            <Text as="span" fontWeight="bold">
                                                -0.2%
                                            </Text>
                                        </GridItem>
                                        <GridItem colSpan={1}>
                                            7d change:{" "}
                                            <Text as="span" fontWeight="bold">
                                                -0.2%
                                            </Text>
                                        </GridItem>
                                        <GridItem colSpan={1}>
                                            Collaterization:{" "}
                                            <Text as="span" fontWeight="bold">
                                                160%
                                            </Text>
                                        </GridItem>
                                    </Grid>
                                </CardBody>
                                <CardHeader>
                                    <Heading size="lg">mUSD liquidity</Heading>
                                </CardHeader>
                                <CardBody>
                                    <TableContainer>
                                        <Table size="sm">
                                            <Thead>
                                                <Tr>
                                                    <Th>Exchange</Th>
                                                    <Th>TVL</Th>
                                                    <Th>Reward APR</Th>
                                                    <Th />
                                                </Tr>
                                            </Thead>
                                            <Tbody>
                                                <Tr>
                                                    <Td>BeethovenX</Td>
                                                    <Td>15M</Td>
                                                    <Td>13%</Td>
                                                    <Td>
                                                        <Button size="sm">
                                                            Stake
                                                        </Button>
                                                    </Td>
                                                </Tr>
                                            </Tbody>
                                        </Table>
                                    </TableContainer>
                                </CardBody>
                            </Card>
                        </GridItem>
                        <GridItem colSpan={2}>
                            <Card>
                                <CardHeader>
                                    <Flex gap={5}>
                                        <Heading size="lg">Markets</Heading>
                                        <Button
                                            size="sm"
                                            aria-label="create vault"
                                            flexShrink="0"
                                            rightIcon={<ChevronRightIcon />}
                                        >
                                            Browse All
                                        </Button>
                                    </Flex>
                                </CardHeader>
                                <CardBody>
                                    <TableContainer>
                                        <Table size="sm">
                                            <Thead>
                                                <Tr>
                                                    <Th>Market</Th>
                                                    <Th>Your Balance</Th>
                                                    <Th>
                                                        Interest Rate
                                                    </Th>
                                                    <Th>Available (utilization %)</Th>
                                                    <Th>Risk Factor</Th>
                                                    <Th />
                                                </Tr>
                                            </Thead>
                                            <Tbody>
                                                <Tr>
                                                    <Td>
                                                        <ChainLogo
                                                            chainId={250}
                                                            width={8}
                                                            height={8}
                                                            mr={2}
                                                        />
                                                        yvDAI
                                                    </Td>
                                                    <Td>14000.10</Td>
                                                    <Td>3%</Td>
                                                    <Td>1M (25%)</Td>
                                                    <Td>1.2</Td>
                                                    <Td><Button size="sm">Details</Button></Td>
                                                </Tr>
                                            </Tbody>
                                        </Table>
                                    </TableContainer>
                                </CardBody>
                            </Card>
                        </GridItem>
                    </Grid>
                </GridItem>
            </Grid>
        </Dashboard>
    );
}

export const dashboardPage: RouteObject = {
    path: "/dashboard?",
    element: <DashboardPage />,
};
