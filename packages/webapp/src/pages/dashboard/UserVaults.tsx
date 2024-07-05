import { RouteObject } from "react-router-dom";
import Dashboard from "@/layouts/Dashboard";
import {
    Box,
    Card,
    CardBody,
    CardHeader,
    CircularProgress,
    CircularProgressLabel,
    Flex,
    Grid,
    GridItem,
    Heading,
    IconButton,
    Text,
} from "@chakra-ui/react";
import HeartIcon from "@/components/Svg/HeartIcon";
import { ChevronDownIcon } from "@chakra-ui/icons";
import React from "react";

import { mode } from "@chakra-ui/theme-tools";

const VaultRow: React.FC<{
    data: React.ReactNode[];
    children: React.ReactNode;
}> = ({ data, children }) => {
    const [expanded, setExpanded] = React.useState(false);
    const lastColumnProps = {
        borderBottomRightRadius: "24px",
        borderTopRightRadius: "24px",
    };
    return (
        <>
            <GridItem
                colSpan={1}
                display="flex"
                alignItems="center"
                backgroundColor="#01161fdd"
                py="4"
                px="6"
                borderTopLeftRadius="24px"
                borderBottomLeftRadius={expanded ? "0" : "24px"}
                transition={expanded ? "none" : "border-radius 0ms 200ms"}
            >
                <IconButton
                    aria-label="expand"
                    onClick={() => setExpanded(!expanded)}
                    variant="ghost"
                    icon={
                        <ChevronDownIcon
                            transform={expanded ? "scaleY(-100%)" : "none"}
                            transition="transform 200ms"
                        />
                    }
                    fontSize="2xl"
                />
            </GridItem>
            {data.map((node, index) => (
                <GridItem
                    {...(index === data.length - 1 && lastColumnProps)}
                    colSpan={1}
                    display="flex"
                    alignItems="center"
                    backgroundColor="#01161fdd"
                    py="4"
                    px="6"
                    borderBottomRightRadius={
                        !expanded && index === data.length - 1 ? "24px" : "0"
                    }
                    transition={expanded ? "none" : "border-radius 0ms 200ms"}
                >
                    {node}
                </GridItem>
            ))}
            <GridItem
                colSpan={data.length + 1}
                borderBottomLeftRadius="24px"
                borderBottomRightRadius="24px"
                backgroundColor="#01161fdd"
                py={expanded ? "4px" : "0px"}
                px="6"
                maxHeight={expanded ? "100%" : "0px"}
                transition="max-height 200ms, padding-top 200ms, padding-bottom 200ms"
                overflow="hidden"
                boxSizing="content-box"
            >
                {children}
            </GridItem>
        </>
    );
};
const VaultHeader: React.FC<{ children: React.ReactNode[] }> = ({
    children,
}) => {
    return (
        <>
            {children.map((node) => (
                <GridItem
                    colSpan={1}
                    py="4"
                    px="6"
                    fontSize="sm"
                    letterSpacing="wider"
                    sx={{
                        color: (props) => mode("gray.400", "gray.600")(props),
                    }}
                >
                    {node}
                </GridItem>
            ))}
        </>
    );
};

export const UserVaultsPage: React.FC = () => {
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
                    <Heading fontWeight="semibold" size="xl" ml="6" mb="6">
                        Your Vaults
                    </Heading>

                    <Grid templateColumns="repeat(7, auto)">
                        <VaultHeader>
                            <Box />
                            <Text>Market</Text>
                            <Text>Available</Text>
                            <Text>Supplying</Text>
                            <Text>Borrowed</Text>
                            <Text>Health Factor</Text>
                            <Text>Historical Interest</Text>
                        </VaultHeader>

                        <VaultRow
                            data={[
                                "yvDAI",
                                "30",
                                "100.20",
                                "40.50",
                                "1.23",
                                "Interest",
                            ]}
                        >
                            <Text>Data</Text>
                        </VaultRow>
                    </Grid>
                </GridItem>
            </Grid>
        </Dashboard>
    );
};

export const userVaultsPage: RouteObject = {
    path: "/vaults?",
    element: <UserVaultsPage />,
};
