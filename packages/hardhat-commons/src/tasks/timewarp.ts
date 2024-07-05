
import { task } from 'hardhat/config';
import { setTimestamp } from '../utils';


task('timewarp', 'Skip blocktime forward in seconds')
    .addParam("seconds", "number of seconds to skip forward")
    .setAction(async (args, hre) => {
        const current = (await hre.ethers.provider.getBlock(hre.ethers.provider.getBlockNumber())).timestamp
        const time = new Date((current + Number(args.seconds)) * 1000)
        await setTimestamp(hre, time);
        const timestamp = (await hre.ethers.provider.getBlock(hre.ethers.provider.getBlockNumber())).timestamp
        console.log(`Time set from ${new Date(current * 1000).toISOString()} to ${new Date(timestamp * 1000).toISOString()}`)
    });
