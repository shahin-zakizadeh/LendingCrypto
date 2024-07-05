import { Box, FormControl, FormLabel, Heading, NumberInputField, Button, NumberInput, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper, Text, Flex } from "@chakra-ui/react"
import { BigNumber } from "ethers";
import { formatEther, formatUnits, parseEther, parseUnits } from "ethers/lib/utils.js";
import { useForm } from "react-hook-form";
import { useQuery } from "react-query";
import { RouteObject } from "react-router-dom"
import { useAccount } from "wagmi";
import { useWriteContract } from "../../components/hooks/useWriteContract";
import { useLCApi } from "../../components/LendincClubProvider"
import { useRPCRegistry } from "../../components/RPCProvider";
import DevDashboard from "../../layouts/DevDashboard";

interface OracleProps {
    oracle: "wBTCOracle"
}

export function Oracles() {
    return (
        <DevDashboard>
            <Flex>
                <OracleConfig oracle="wBTCOracle" />
            </Flex>
        </DevDashboard>
    )
}

export function OracleConfig(props: OracleProps) {
    const { peripherals, canRead, address, isConnected } = useLCApi();
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
    const { multicall } = useRPCRegistry();

    const hardhat = 31337 as const;

    const priceProvider = peripherals.forNetwork(hardhat).getContractInstance("priceProvider")
    const wbtc = peripherals.forNetwork(hardhat).getContractInstance("WBTC")
    /*
        const { data, refetch:refetchPrice } = useQuery([props.oracle, 'latestAnswer'], async () => {
            return multicall(hardhat).all([
                oracle.multiCall.getSafePrice(wbtc.address),
                oracle.multiCall.decimals(),
            ])
        }, { enabled: isConnected });
    */


    const { data: answer, refetch } = useQuery([props.oracle, 'getSafePrice', wbtc.address], () => {
        return priceProvider.getSafePrice(wbtc.address)
    }, { enabled: isConnected, initialData: "0" })

    const { data: decimals } = useQuery([props.oracle, 'decimals'], () => {
        return priceProvider.DECIMALS()
    }, { enabled: isConnected, initialData: 0 })

    const { sendTx } = useWriteContract((amount: string) => priceProvider.setSafePrice(wbtc.address, parseUnits(amount, decimals)), { onConfirmation: () => refetch() })

    const onSubmit = (data) => sendTx(data.answer)

    return (
        <Box p={3} maxW={"lg"}>
            <Heading>Configure {props.oracle}</Heading>
            <Text>Address: {priceProvider.address}</Text>
            <Text>Decimals: {decimals}</Text>
            <Text>Oracle Answer: {formatUnits(answer, decimals)}</Text>
            <form onSubmit={handleSubmit(onSubmit)}>
                <Flex alignItems={"end"}>
                    <FormControl>
                        <FormLabel>Update Answer</FormLabel>
                        <NumberInput>
                            <NumberInputField {...register("answer", { required: true })} />
                            <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                            </NumberInputStepper>
                        </NumberInput>

                    </FormControl>
                    <Button isLoading={isSubmitting} type='submit' ml={2}>
                        Set
                    </Button>
                </Flex>
            </form>
        </Box>
    )
}

export const oraclesPage: RouteObject = {
    path: "/dev/oracles",
    element: <Oracles />
}