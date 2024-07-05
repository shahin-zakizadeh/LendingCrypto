import { Flex, Skeleton, Text, Tooltip } from "@chakra-ui/react"
import { useAccount } from "wagmi"
import { InfoOutlineIcon } from '@chakra-ui/icons'

export interface HiddenValueProps extends React.PropsWithChildren {
    isLoading?: boolean,
    requiresConnection?: boolean
}

export default function HiddenValue<T>(props: HiddenValueProps) {
    const { isConnected } = useAccount()

    if (props.requiresConnection && !isConnected) {
        return (
            <Flex display={"inline-flex"} alignItems={"center"}>
                <Skeleton display={"inline"} startColor='gray.400' endColor='gray.400'>Loading</Skeleton>
                <Tooltip label={"Connect your wallet to see this info"}><InfoOutlineIcon ml={1} /></Tooltip>
            </Flex>
        )
    }


    if (props.isLoading) {
        return (<span><Skeleton display={"inline"}>Loading</Skeleton></span>)
    }
    return (<span>{props.children}</span>)
}