import { Button, ButtonProps, forwardRef } from "@chakra-ui/react";
import React, { useEffect, useRef } from "react";
import { useAccount, useConnect, useNetwork, useSwitchNetwork } from "wagmi";
// import WalletOptionsModal from "./layout/WalletOptionsModal";
import { InjectedConnector } from "wagmi/connectors/injected";
import { useRPCRegistry } from "@/components/RPCProvider";

export interface IWeb3ButtonProps extends ButtonProps {
    chainId: number;
    onClick: () => void;
}

// Handles connection before calling onClick
// TODO: Add transaction error display data icon option with modal
const Web3Button = forwardRef(function _Web3Button({
    onClick: propsOnClick,
    chainId,
    ...rest
}: IWeb3ButtonProps) {
    const { isConnected } = useAccount();
    const { chain } = useNetwork();
    const { canWrite } = useRPCRegistry();

    const { switchNetworkAsync } = useSwitchNetwork();
    // const [showConnectModal, setShowConnectModal] = useState(false);

    const { chains } = useNetwork();
    const { connect } = useConnect({
        connector: new InjectedConnector({ chains }),
    });

    // save pending tx to call after RPC setup, on network switch
    const pendingTx = useRef<null | (() => any)>(null);

    // call pending tx once signer is connected
    useEffect(() => {
        if (canWrite && pendingTx?.current) {
            pendingTx.current();
            pendingTx.current = null;
        }
    }, [canWrite]);

    const onClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
        if (propsOnClick) {
            if (!isConnected) {
                // setShowConnectModal(true);
                connect();
            }
            if (chain?.unsupported || chain?.id !== chainId) {
                switchNetworkAsync &&
                    switchNetworkAsync(chainId).then((value) => {
                        pendingTx.current = propsOnClick;
                    });
            } else {
                propsOnClick();
            }
        }
    };

    return (
        <>
            {/*<WalletOptionsModal
                open={showConnectModal}
                setOpen={setShowConnectModal}
            />*/}
            <Button onClick={onClick} {...rest} />
        </>
    );
});
export default Web3Button;
