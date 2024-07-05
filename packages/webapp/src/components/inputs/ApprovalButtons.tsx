import { ButtonProps, Flex } from "@chakra-ui/react";
import { ERC20 } from "@mclb/lending-api/dist/types/openzeppelin";
import { BigNumber, constants, ContractReceipt } from "ethers";
import { useWriteContract } from "../hooks/useWriteContract";
import Web3Button from "@/components/Web3Button";

export interface ApprovalButtonsProps {
    token: ERC20;
    amount: BigNumber;
    spender: string;
    onApproval?: (data: ContractReceipt) => void;
    chainId: number;
    size?: ButtonProps["size"];
}

export default function ApprovalButtons(props: ApprovalButtonsProps) {
    const { size = "lg" } = props;
    const { sendTx } = useWriteContract(
        (amount: BigNumber) => props.token.approve(props.spender, amount),
        {
            onConfirmation: props.onApproval,
        }
    );

    return (
        <Flex>
            <Web3Button
                width="100%"
                size={size}
                onClick={() => sendTx(props.amount)}
                chainId={props.chainId}
                mr={2}
            >
                Approve Amount
            </Web3Button>
            <Web3Button
                width="100%"
                size={size}
                onClick={() => sendTx(constants.MaxUint256)}
                chainId={props.chainId}
            >
                Approve Infinite
            </Web3Button>
        </Flex>
    );
}
