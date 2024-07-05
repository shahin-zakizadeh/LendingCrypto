import {
    Box,
    Heading,
    Table,
    TableContainer,
    Tbody,
    Td,
    Th,
    Tr,
} from "@chakra-ui/react";
import { ILendingClubMarkets } from "@mclb/lending-api";
import { BigNumber } from "ethers";
import { formatUnits, parseEther } from "ethers/lib/utils.js";
import useLoadAccount from "../hooks/useLoadAccount";
import HiddenValue from "../HiddenValue";
import BNFormat from "../BNFormat";
import useBalance from "../hooks/useBalance";

export interface AccountProps {
    marketAddress: string;
    chainId: keyof ILendingClubMarkets;
    accountId?: BigNumber;
}

export default function Account(props: AccountProps) {
    const {
        market,
        ownerOf,
        collateralAddress,
        debtTokenAddress,
        collateralAmount,
        debtAmount,
        debtValue,
        collateralValue,
        canWrite,
        isLoading,
        ltv,
        healthRatio,
    } = useLoadAccount(props);

    const { data: collateralBalance, isLoading: isLoadingBalance } = useBalance(
        {
            token: collateralAddress,
            chainId: props.chainId,
        },
        { enabled: Boolean(collateralAddress) }
    );
    const { data: debtBalance, isLoading: isDebtLoadingBalance } = useBalance(
        {
            token: debtTokenAddress,
            chainId: props.chainId,
        },
        { enabled: Boolean(debtTokenAddress) }
    );

    return (
        <Box>
            <Heading size="lg">Account #{props.accountId?.toString()}</Heading>
            <TableContainer mt="2">
                <Table size="sm">
                    <Tbody
                        sx={{
                            th: {
                                paddingLeft: "0",
                            },
                        }}
                    >
                        <Tr>
                            <Th>Collateral</Th>
                            <Td>
                                <HiddenValue isLoading={isLoading}>
                                    <BNFormat
                                        value={collateralAmount}
                                        decimals={collateralBalance.decimals}
                                        displayDecimals={4}
                                    />{" "}
                                    {collateralBalance?.symbol} (
                                    <BNFormat
                                        value={collateralValue}
                                        decimals={18}
                                        displayDecimals={4}
                                    />
                                    $)
                                </HiddenValue>
                            </Td>
                        </Tr>
                        <Tr>
                            <Th>Principal</Th>
                            <Td>
                                <HiddenValue isLoading={isLoading}>
                                    <BNFormat
                                        value={debtAmount}
                                        decimals={debtBalance?.decimals}
                                        displayDecimals={2}
                                    />{" "}
                                    {debtBalance.symbol} (
                                    <BNFormat
                                        value={debtValue}
                                        decimals={18}
                                        displayDecimals={2}
                                    />
                                    $)
                                </HiddenValue>
                            </Td>
                        </Tr>
                        <Tr>
                            <Th>LTV</Th>
                            <Td>
                                <HiddenValue isLoading={isLoading}>
                                    {formatUnits(ltv, 2)}%
                                </HiddenValue>
                            </Td>
                        </Tr>
                        <Tr>
                            <Th>Health Ratio</Th>
                            <Td>
                                <HiddenValue isLoading={isLoading}>
                                    {healthRatio?.gt(parseEther("100")) ? (
                                        "greater than 100"
                                    ) : (
                                        <BNFormat
                                            value={healthRatio}
                                            decimals={18}
                                            displayDecimals={3}
                                        />
                                    )}
                                </HiddenValue>
                            </Td>
                        </Tr>
                    </Tbody>
                </Table>
            </TableContainer>
        </Box>
    );
}
