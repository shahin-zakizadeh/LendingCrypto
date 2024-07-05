import { Box, FormControl, FormLabel, Heading, NumberInputField, Button, NumberInput, NumberInputStepper, NumberIncrementStepper, NumberDecrementStepper, Text, Flex } from "@chakra-ui/react"
import { formatEther, parseEther } from "ethers/lib/utils.js";
import { useForm } from "react-hook-form";
import { useQuery } from "react-query";
import { RouteObject } from "react-router-dom"
import { useWriteContract } from "../../components/hooks/useWriteContract";
import { useLCApi } from "../../components/LendincClubProvider"
import DevDashboard from "../../layouts/DevDashboard";
import { useChainId } from "wagmi";


export function MintPage() {
    return (
        <DevDashboard>
            <Flex>
                <TokenMint token="mUSD" />
                <TokenMint token="WBTC" />
            </Flex>
        </DevDashboard>
    )
}

interface TokenMintProps {
    token: "mUSD" | "WBTC",
}

export function TokenMint(props: TokenMintProps) {

    const { peripherals, canRead, address, isConnected } = useLCApi();
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
    const chainId = useChainId();

    const token = peripherals.forNetwork(chainId).getContractInstance(props.token)

    const { data: balanceOf, refetch } = useQuery([props.token, 'balanceOf'], () => {
        return token.balanceOf(address)
    }, { enabled: isConnected })

    const { sendTx } = useWriteContract((amount: string) => token.mint(address, parseEther(amount)), { onConfirmation: () => refetch() })

    const onSubmit = (data) => sendTx(data.amount)

    return (
        <Box p={3} maxW={"lg"}>
            <Heading>Mint {props.token}</Heading>
            <Text>{formatEther(balanceOf ?? 0)} {props.token}</Text>
            <form onSubmit={handleSubmit(onSubmit)}>
                <Flex alignItems={"end"}>
                    <FormControl>
                        <FormLabel>Amount</FormLabel>
                        <NumberInput>
                            <NumberInputField {...register("amount", { required: true })} />
                            <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                            </NumberInputStepper>
                        </NumberInput>

                    </FormControl>
                    <Button isLoading={isSubmitting} type='submit' ml={2}>
                        Mint
                    </Button>
                </Flex>
            </form>
        </Box>
    )
}

export const tokenMintPage: RouteObject = {
    path: "/dev/mint",
    element: <MintPage />
}
