import { AddIcon } from "@chakra-ui/icons";
import {
    Box,
    Flex,
    Heading,
    Stack,
    StyleProps,
    Table,
    Tbody,
    Td,
    Text,
    Tr,
    useDimensions,
} from "@chakra-ui/react";
import { ILendingClubMarkets } from "@mclb/lending-api";
import { BigNumber } from "ethers";
import { useAccount } from "wagmi";
import useAddressAccounts from "../hooks/useAddressAccounts";
import { useWriteContract } from "../hooks/useWriteContract";
import Web3Button from "@/components/Web3Button";
import { useEffect, useRef, useState } from "react";
import useLoadAccount from "@/components/hooks/useLoadAccount";
import HiddenValue from "@/components/HiddenValue";
import BNFormat from "@/components/BNFormat";
import { parseEther } from "ethers/lib/utils.js";

interface AccountsSelectorProps {
    address: string;
    marketAddress: string;
    chainId: keyof ILendingClubMarkets;
    onSelectedAccount?: (id: BigNumber) => void;
    selectedAccount?: BigNumber;
}

function AccountRow(
    props: {
        idx: number;
        isLast: boolean;
        accountId: BigNumber;
        setColumnOffsets: (offsets: number[]) => void;
        isSelected?: boolean;
    } & AccountsSelectorProps
) {
    const { isLoading, healthRatio, collateralAmount } = useLoadAccount(props);
    const ref0 = useRef<HTMLTableCellElement>(null);
    const ref1 = useRef<HTMLTableCellElement>(null);
    const ref2 = useRef<HTMLTableCellElement>(null);
    const dimensions = useDimensions(ref1, true);

    useEffect(() => {
        if (props.idx === 0) {
            props.setColumnOffsets(
                [ref0, ref1, ref2].map((ref) => ref.current?.offsetLeft || 0)
            );
        }
    }, [ref2?.current?.offsetLeft, dimensions?.contentBox.width]);

    const handleAccountSelection = (id: BigNumber) => {
        if (props.onSelectedAccount) {
            props.onSelectedAccount(id);
        }
    };

    const cellStyle: StyleProps = {
        paddingY: "3",
        paddingEnd: "1",
        paddingStart: "3",
        marginInlineStart: "3",
        ...(!props.isLast
            ? { borderBottom: "1px solid", borderColor: "gray.700" }
            : { borderBottom: "none" }),
    };

    return (
        <Tr
            transition="300ms background"
            position="relative"
            _hover={{
                backgroundColor: "gray.700",
            }}
            {...(props.isSelected ? { backgroundColor: "whiteAlpha.100" } : {})}
            cursor="pointer"
            onClick={() => handleAccountSelection(props.accountId)}
        >
            <Box
                className="active-tip"
                position="absolute"
                height="100%"
                w="1"
                bg="primary.600"
                opacity={props.isSelected ? 1 : 0}
            />
            <Td ref={ref0} {...cellStyle}>
                <HiddenValue isLoading={isLoading}>
                    Account #{props.accountId.toString()}
                </HiddenValue>
            </Td>
            <Td ref={ref1} {...cellStyle}>
                <HiddenValue isLoading={isLoading}>
                    {healthRatio?.gt(parseEther("100")) ? (
                        "more than 100"
                    ) : (
                        <BNFormat
                            value={healthRatio}
                            decimals={18}
                            displayDecimals={3}
                        />
                    )}
                </HiddenValue>
            </Td>
            <Td ref={ref2} {...cellStyle} minW="16">
                <HiddenValue isLoading={isLoading}>
                    <BNFormat
                        value={collateralAmount}
                        decimals={18}
                        displayDecimals={3}
                    />
                </HiddenValue>
            </Td>
        </Tr>
    );
}

export default function AccountsSelector(props: AccountsSelectorProps) {
    const { market, accountIds, isLoading, refetch } =
        useAddressAccounts(props);
    const { address } = useAccount();

    const { sendTx } = useWriteContract(
        async () => (market ? market.openAccount() : null),
        { onConfirmation: () => refetch() }
    );

    const [columnOffsets, setColumnOffsets] = useState<number[]>([0, 0, 0]);

    const hasAccounts = accountIds.length > 0;

    return (
        <Stack>
            <Flex justify="space-between">
                <Heading size="lg">Your Accounts</Heading>
                {address === props.address && (
                    <Web3Button
                        aria-label="open an account"
                        onClick={() => sendTx()}
                        chainId={props.chainId}
                        size="sm"
                        rightIcon={<AddIcon />}
                    >
                        Create New
                    </Web3Button>
                )}
            </Flex>
            <Box
                sx={{
                    height: "1.4rem",
                    position: "relative",
                    display: hasAccounts ? "block" : "flex",
                    justifyContent: "space-between",
                    paddingEnd: hasAccounts ? "unset" : "8",
                    span: {
                        fontSize: "sm",
                        color: "gray.500",
                        margin: "0 !important",
                        paddingStart: "3",
                    },
                }}
            >
                <Text as="span" left={columnOffsets[0] + "px"}>
                    Account
                </Text>
                <Text
                    as="span"
                    position={hasAccounts ? "absolute" : "static"}
                    left={columnOffsets[1] + "px"}
                >
                    Health Ratio
                </Text>
                <Text
                    as="span"
                    position={hasAccounts ? "absolute" : "static"}
                    left={columnOffsets[2] + "px"}
                >
                    Collateral
                </Text>
            </Box>
            <Box
                border="1px solid"
                borderColor="gray.700"
                borderRadius="2xl"
                overflowY="auto"
                height="40"
            >
                <Table paddingX={2}>
                    <Tbody position="relative">
                        {accountIds.length === 0 ? (
                            <Box m="3">
                                <HiddenValue isLoading={isLoading}>
                                    No accounts found
                                </HiddenValue>
                            </Box>
                        ) : (
                            accountIds.map((id, idx) => (
                                <AccountRow
                                    setColumnOffsets={setColumnOffsets}
                                    accountId={id}
                                    idx={idx}
                                    isLast={idx === accountIds.length - 1}
                                    isSelected={props.selectedAccount?.eq(id)}
                                    {...props}
                                    key={id.toString()}
                                />
                            ))
                        )}
                    </Tbody>
                </Table>
            </Box>
        </Stack>
    );
}
