import { Box, Button, Flex, FormControl, FormLabel, NumberDecrementStepper, NumberIncrementStepper, NumberInput, NumberInputField, NumberInputStepper, Text } from "@chakra-ui/react";
import { ILendingClubVaults } from "@mclb/lending-api";
import { formatEther, parseEther, parseUnits } from "ethers/lib/utils.js";
import { useForm } from "react-hook-form";
import { useQuery } from "react-query";
import { useAccount } from "wagmi";
import useMarket from "../hooks/useMarket";
import { useWriteContract } from "../hooks/useWriteContract";

export interface AdminProps {
    market: string;
    chainId: keyof ILendingClubVaults;
}

export default function Admin(props: AdminProps) {
    const { market } = useMarket(props);
    const { address } = useAccount();

    const { data: isAdmin, isLoading } = useQuery([props.chainId, props.market, "isAdmin"], async () => {
        return market?.isAdmin(address as string);
    })

    const { data: interestIndex } = useQuery([props.chainId, props.market, "interestIndex"], async () => {
        return market?.interestIndex();
    })

    if (!isAdmin) {
        return null;
    }

    return (
        <Box>
            <Text>Admin panel</Text>
            <Flex><Text>Interest Index: {formatEther(interestIndex ?? "0")}</Text></Flex>
            <SetInterest {...props} />
            <SetMinAccountThreshold {...props} />
            <SetGracePeriod {...props} />
        </Box>
    )
}

function SetInterest(props: AdminProps) {
    const { market } = useMarket(props);
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
    const { sendTx } = useWriteContract((amount: string) => market?.setInterestRate(parseUnits(amount, 16)))

    const onSubmit = (data) => sendTx(data.interestRate);
    return (
        <Box>
            <form onSubmit={handleSubmit(onSubmit)}>
                <Flex alignItems={"end"}>
                    <FormControl>
                        <FormLabel>Interest Rate (APR)</FormLabel>
                        <NumberInput>
                            <NumberInputField {...register("interestRate", { required: true })} />
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

function SetMinAccountThreshold(props: AdminProps) {
    const { market } = useMarket(props);
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
    const { sendTx } = useWriteContract((amount: string) => market?.updateSmallAccountThreshold(parseEther(amount)))

    const onSubmit = (data) => sendTx(data.smallAccountThreshold);
    return (
        <Box>
            <form onSubmit={handleSubmit(onSubmit)}>
                <Flex alignItems={"end"}>
                    <FormControl>
                        <FormLabel>Small Account Threshold</FormLabel>
                        <NumberInput>
                            <NumberInputField {...register("smallAccountThreshold", { required: true })} />
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

function SetGracePeriod(props: AdminProps) {
    const { market } = useMarket(props);
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
    const { sendTx } = useWriteContract((amount: string) => market?.setInterestGracePeriod(amount))

    const onSubmit = (data) => sendTx(data.gracePeriod);
    return (
        <Box>
            <form onSubmit={handleSubmit(onSubmit)}>
                <Flex alignItems={"end"}>
                    <FormControl>
                        <FormLabel>Grace Period (s)</FormLabel>
                        <NumberInput>
                            <NumberInputField {...register("gracePeriod", { required: true })} />
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