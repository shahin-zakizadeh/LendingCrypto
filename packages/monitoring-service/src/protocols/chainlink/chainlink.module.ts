import { Module } from "@nestjs/common";
import { AssetsModule } from "../../assets/assets.module";
import { EvmModule } from "../../evm/evm.module";
import { ChainlinkPollingService } from "./chainlink-polling-service";
import { ChainlinkService } from "./chainlink.service";

@Module({
    imports: [EvmModule, AssetsModule],
    providers: [ChainlinkService, ChainlinkPollingService],
    exports: [ChainlinkService],
})
export class ChainlinkModule { }