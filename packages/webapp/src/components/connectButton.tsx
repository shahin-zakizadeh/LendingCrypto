import { Box, Button } from "@chakra-ui/react";
import { useAccount, useConnect, useEnsName, useNetwork } from "wagmi";
import { InjectedConnector } from "wagmi/connectors/injected";
import Blockies from "react-blockies";
import AccountIcon from "./Svg/AccountIcon";

export default function WalletButton() {
    const { address, isConnected } = useAccount();
    const { chains } = useNetwork();
    const { data: ensName } = useEnsName({ address });
    const { connect } = useConnect({
        connector: new InjectedConnector({ chains }),
    });

    return (
        <Button
            borderRadius="full"
            onClick={() => connect()}
            pl="4px"
            gap="8px"
            bg={isConnected ? "whiteAlpha.300" : undefined}
            color={isConnected ? "whiteAlpha.800" : undefined}
            fontWeight={isConnected ? "semibold" : undefined}
        >
            {address && isConnected ? (
                <>
                    <Box borderRadius="full" overflow="hidden">
                        <Blockies seed={address} />
                    </Box>
                    {address.slice(0, 5)}...{address.slice(-3)}
                </>
            ) : (
                <>
                    <AccountIcon boxSize="32px" />
                    Connect Wallet
                </>
            )}
        </Button>
    );
}
