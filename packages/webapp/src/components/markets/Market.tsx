import {
    Box,
    ButtonGroup,
    Card,
    CardBody,
    CardHeader,
    Flex,
    Grid,
    GridItem,
    Heading,
    Stack,
    Stat,
    StatLabel,
    StatNumber,
    TabList,
    TabPanels,
    Tabs,
    Text,
} from "@chakra-ui/react";
import { formatUnits } from "ethers/lib/utils.js";
import { Address, useAccount } from "wagmi";
import useLoadMarket from "../hooks/useLoadMarket";
import HiddenValue from "../HiddenValue";
import useBalance from "../hooks/useBalance";
import BNFormat from "../BNFormat";
import Account from "@/components/markets/Account";
import { BigNumber } from "ethers";
import TabButton from "@/components/TabButton";
import DepositTab from "@/components/markets/Deposit";
import WithdrawTab from "@/components/markets/Withdraw";
import BorrowTab from "@/components/markets/Borrow";
import RepayTab from "@/components/markets/Repay";
import AccountsSelector from "@/components/markets/AccountsSelector";
import { useState } from "react";
import { ILendingClubMarkets } from "@lenclub/api";
import { chainList } from "../../connectors";
import { ChainLogo } from "@/components/Svg";
import TextDivider from "@/components/TextDivider";

export interface MarketProps {
    marketAddress: string;
    chainId: 31337;
    userAddress: Address;
}

export default function Market({ ...props }: MarketProps) {
    const { address: connectedAddress, isConnected } = useAccount();

    const [selectedAccount, setSelectedAccount] = useState<
        undefined | BigNumber
    >(undefined);
    const address = props.userAddress ?? connectedAddress;

    const loadedMarket = useLoadMarket(props);
    const {
        market,
        name,
        symbol,
        maxLtv,
        collateralAddress: collateral,
        debtTokenAddress,
        availableDebtToken: availableForBorrow,
        collateralTokenPrice: collateralPrice,
        debtTokenPrice: debtPrice,
        isLoading: isLoadingMarket,
        interestRate,
        isError,
    } = loadedMarket;
    const { data: collateralBalance, isLoading: isLoadingBalance } = useBalance(
        {
            address,
            token: collateral,
            chainId: props.chainId,
        },
        { enabled: Boolean(collateral) }
    );
    const { data: debtBalance, isLoading: isDebtLoadingBalance } = useBalance(
        {
            token: debtTokenAddress,
            chainId: props.chainId,
        },
        { enabled: Boolean(debtTokenAddress) }
    );

    const formattedLtv = !isLoadingMarket ? formatUnits(maxLtv, 2) : null;

    if (isError) {
        return (
            <Box>
                <Heading>Can't load market</Heading>
                <Text>
                    There was an error loading {props.marketAddress} on chain{" "}
                    {props.chainId}
                </Text>
            </Box>
        );
    }

    const network = Number(props.chainId) as keyof ILendingClubMarkets;

    return (
        <Grid templateColumns="repeat(4, 1fr)" gap={5} px={4}>
            <GridItem colSpan={{ base: 4, md: 1 }}>
                <Heading
                    display={["block", null, "none"]}
                    fontWeight="semibold"
                    size="2xl"
                    ml="6"
                    mb="5"
                >
                    {name} <TextDivider /> {symbol}
                </Heading>
                <Card>
                    <CardHeader>
                        <Heading size="lg">Market Data</Heading>
                    </CardHeader>
                    <CardBody>
                        <Stack>
                            <Stat>
                                <StatLabel>Chain</StatLabel>
                                <StatNumber>
                                    {
                                        chainList.find(
                                            (chain) =>
                                                chain.id === props.chainId
                                        )?.name
                                    }
                                    <ChainLogo
                                        chainId={props.chainId}
                                        ml="2"
                                        boxSize="32px"
                                    />
                                </StatNumber>
                            </Stat>
                            <Stat>
                                <StatLabel>Your Balance</StatLabel>
                                <StatNumber>
                                    {collateralBalance?.formatted} {collateralBalance?.symbol}
                                </StatNumber>
                            </Stat>
                            <Stat>
                                <StatLabel>Max LTV</StatLabel>
                                <StatNumber>
                                    <HiddenValue isLoading={isLoadingMarket}>
                                        {formattedLtv + "%"}
                                    </HiddenValue>
                                </StatNumber>
                            </Stat>
                            <Stat>
                                <StatLabel>Interest Rate</StatLabel>
                                <StatNumber>
                                    <HiddenValue isLoading={isLoadingMarket}>
                                        <BNFormat
                                            value={interestRate}
                                            decimals={16}
                                            displayDecimals={2}
                                        />
                                        %
                                    </HiddenValue>
                                </StatNumber>
                            </Stat>
                            <Stat>
                                <StatLabel>Available for borrow</StatLabel>
                                <StatNumber>
                                    <HiddenValue isLoading={isLoadingMarket}>
                                        <BNFormat
                                            value={availableForBorrow}
                                            decimals={debtBalance.decimals}
                                            displayDecimals={2}
                                        />{" "}
                                        {debtBalance.symbol}
                                    </HiddenValue>
                                </StatNumber>
                            </Stat>
                            <Stat>
                                <StatLabel>Collateral Price</StatLabel>
                                <StatNumber>
                                    <HiddenValue isLoading={isLoadingMarket}>
                                        $
                                        <BNFormat
                                            value={collateralPrice}
                                            decimals={8}
                                            displayDecimals={2}
                                        />
                                    </HiddenValue>
                                </StatNumber>
                            </Stat>
                            <Stat>
                                <StatLabel>Debt Price</StatLabel>
                                <StatNumber>
                                    <HiddenValue isLoading={isLoadingMarket}>
                                        $
                                        <BNFormat
                                            value={debtPrice}
                                            decimals={8}
                                            displayDecimals={2}
                                        />
                                    </HiddenValue>
                                </StatNumber>
                            </Stat>
                        </Stack>
                    </CardBody>
                </Card>
            </GridItem>
            <GridItem colSpan={{ base: 4, md: 3 }}>
                <Box>
                    <Heading
                        display={["none", null, "block"]}
                        fontWeight="semibold"
                        size="xl"
                        ml="6"
                        mb="5"
                    >
                        {name} <TextDivider /> {symbol}
                    </Heading>
                    <Card>
                        <CardBody>
                            <Grid templateColumns="repeat(2, 1fr)" gap="10">
                                <GridItem colSpan={[2, null, null, 1]}>
                                    {isConnected && address ? (
                                        <AccountsSelector
                                            chainId={network}
                                            marketAddress={props.marketAddress}
                                            address={address}
                                            selectedAccount={selectedAccount}
                                            onSelectedAccount={
                                                setSelectedAccount
                                            }
                                        />
                                    ) : (
                                        <Text>Login to see your accounts</Text>
                                    )}
                                </GridItem>
                                <GridItem
                                    colSpan={[2, null, null, 1]}
                                    overflow="hidden"
                                >
                                    {selectedAccount ? (
                                        <Account
                                            chainId={props.chainId}
                                            marketAddress={props.marketAddress}
                                            accountId={selectedAccount}
                                        />
                                    ) : (
                                        <Text>
                                            Select an account to see info,
                                            deposit and borrow.
                                        </Text>
                                    )}
                                </GridItem>
                            </Grid>
                        </CardBody>

                        <CardBody>
                            {selectedAccount && (
                                <Grid
                                    templateColumns="repeat(2, 1fr)"
                                    mt="6"
                                    gap="10"
                                >
                                    <GridItem colSpan={[2, null, null, 1]}>
                                        <Tabs>
                                            <Flex
                                                justifyContent="space-between"
                                                mb="2"
                                                gap="2"
                                            >
                                                <Heading size="lg">
                                                    Supplying
                                                </Heading>
                                                <TabList
                                                    as={ButtonGroup}
                                                    borderBottom="none"
                                                    isAttached
                                                >
                                                    <TabButton>
                                                        Deposit
                                                    </TabButton>
                                                    <TabButton>
                                                        Withdraw
                                                    </TabButton>
                                                </TabList>
                                            </Flex>
                                            <TabPanels>
                                                <DepositTab
                                                    marketAddress={
                                                        props.marketAddress
                                                    }
                                                    chainId={props.chainId}
                                                    accountId={selectedAccount}
                                                />
                                                <WithdrawTab
                                                    marketAddress={
                                                        props.marketAddress
                                                    }
                                                    chainId={props.chainId}
                                                    accountId={selectedAccount}
                                                />
                                            </TabPanels>
                                        </Tabs>
                                    </GridItem>
                                    <GridItem colSpan={[2, null, null, 1]}>
                                        <Tabs>
                                            <Flex
                                                justifyContent="space-between"
                                                mb="2"
                                                gap="2"
                                            >
                                                <Heading size="lg">
                                                    Borrowing
                                                </Heading>
                                                <TabList
                                                    as={ButtonGroup}
                                                    borderBottom="none"
                                                    isAttached
                                                >
                                                    <TabButton>
                                                        Borrow
                                                    </TabButton>
                                                    <TabButton>Repay</TabButton>
                                                </TabList>
                                            </Flex>
                                            <TabPanels>
                                                <BorrowTab
                                                    marketAddress={
                                                        props.marketAddress
                                                    }
                                                    chainId={props.chainId}
                                                    accountId={selectedAccount}
                                                />
                                                <RepayTab
                                                    marketAddress={
                                                        props.marketAddress
                                                    }
                                                    chainId={props.chainId}
                                                    accountId={selectedAccount}
                                                />
                                            </TabPanels>
                                        </Tabs>
                                    </GridItem>
                                </Grid>
                            )}
                        </CardBody>
                    </Card>
                    {/*<Admin chainId={network} market={market} />*/}
                </Box>
            </GridItem>
        </Grid>
    );
}
