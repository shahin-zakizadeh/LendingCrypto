import { task, types } from "hardhat/config";
import {
    TASK_NODE,
} from "hardhat/builtin-tasks/task-names";
import { EthereumProvider } from "hardhat/types";

task(TASK_NODE)
    .addOptionalParam("chainId", undefined, undefined, types.int)
    .setAction(
        async (
            args: {
                chainId?: number;
            },
            { hardon },
            runSuper
        ): Promise<EthereumProvider> => {
            if (args.chainId) {
                hardon.setChainId(args.chainId);
            }
            return runSuper(args)
        }
    );