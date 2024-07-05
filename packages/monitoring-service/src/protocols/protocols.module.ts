import { Module } from "@nestjs/common";
import { AssetsModule } from "../assets/assets.module";
import { EvmModule } from "../evm/evm.module";
import { LiFiModule } from "./amm/lifi/LiFi.module";
import { UniswapV2Module } from "./amm/uniswapv2/uniswapv2.module";
import { UniswapV3Module } from "./amm/uniswapv3/uniswapv3.module";
import { ChainlinkModule } from "./chainlink/chainlink.module";
import { CoinGeckoModule } from "./coingecko/CoinGecko.module";
import { LendingClubModule } from "./lending-club/LendingClub.module";

@Module({
    imports: [
        EvmModule,
        AssetsModule,
        UniswapV2Module,
        UniswapV3Module,
        ChainlinkModule,
        LiFiModule,
        CoinGeckoModule,
        LendingClubModule
    ],
    exports: [
        UniswapV2Module,
        UniswapV3Module,
        ChainlinkModule,
        LiFiModule
    ]
})
export class ProtocolsModule {}
