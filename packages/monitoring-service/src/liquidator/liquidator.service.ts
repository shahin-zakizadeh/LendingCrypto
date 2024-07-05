import { SimpleLiquidator__factory, getExport } from '@mclb/lending-api';
import { Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { providers, utils } from 'ethers';
import { LiquidationResult } from '../liquidation/events/liquidation-result.event';
import { BasicLiquidator } from '../liquidator/utils/basic-liquidator';
import { LendingClubService } from '../protocols/lending-club/LendingClubApi.service';
import { Liquidate } from '../liquidation/events/liquidate.event';
import { EvmProviderService } from '../evm/providers/evm-provider.service';
import { parseUnits } from 'ethers/lib/utils';

@Injectable()
export class LiquidatorService extends BasicLiquidator {
  EQ_FTM_USDC_LIQ_DID = 'eq_ftm_usdc_liqu';
  swapFee = 0.004;
  constructor(
    lcService: LendingClubService,
    private eventEmitter: EventEmitter2,
    private evmProviderService: EvmProviderService,
  ) {
    super(lcService);
  }

  /**
   * @dev should get the returned information from liquidate contract
   * and call the appropriate event
   */
  @OnEvent(Liquidate.NAME)
  async tryToLiquidate(liquidateParams: Liquidate) {
    if (await this.isLiquidatable(liquidateParams)) {
      await this.callLiquidationContract(liquidateParams);
    } else {
      this.failedLiquidation(liquidateParams);
    }
  }

  async isLiquidatable(liquidateParams: Liquidate) {
    return (await this.amountToLiquidate(liquidateParams.account)).greaterThan(
      0,
    );
  }

  private failedLiquidation(liquidateParams: Liquidate) {
    const liquidationResult = new LiquidationResult(
      liquidateParams.account,
      false,
      0,
      '',
    );
    this.eventEmitter.emit(LiquidationResult.NAME, liquidationResult);
  }

  /**
   * @dev the emitted event should be updated to include the returned information from liquidate contract
   */
  private async callLiquidationContract(liquidateParams: Liquidate) {
    const liquidationContract = await this.getLiquidationContract(
      liquidateParams,
    );
    const chainId = liquidateParams.market.chainId;
    const wallet = this.evmProviderService.getWallet(chainId);
    const principalAddress = liquidateParams.principal.address;

    for (let i = 0; i < 3; i++) {
      const amountToBorrowWithDecimals = await this.amountToBorrowWithDecimals(
        liquidateParams,
        i,
      );
      const liquidationContractParameters =
        await this.liquidationContractParameters(liquidateParams);
      try {
        const res = await liquidationContract
          .connect(wallet)
          .liquidate(
            principalAddress,
            amountToBorrowWithDecimals,
            liquidationContractParameters,
          );
        const receipt = await res.wait();
        this.eventEmitter.emit(LiquidationResult.NAME, {
          account: liquidateParams.account,
          success: receipt.confirmations > 0,
          profit: (await this.amountToBorrow(liquidateParams, i)).sub(
            await this.amountToLiquidate(liquidateParams.account),
          ),
          txId: receipt.transactionHash,
        });
        break;
      } catch (e) { }
    }
    this.failedLiquidation(liquidateParams);
  }

  async getLiquidationContract(liquidateParams: Liquidate) {
    const chainId = liquidateParams.market.chainId;
    const simpleSolidlyLiquContractInfo = getExport(
      this.EQ_FTM_USDC_LIQ_DID,
      chainId,
    );
    const provider = this.provider(liquidateParams);
    const liquidation = SimpleLiquidator__factory.connect(
      simpleSolidlyLiquContractInfo.address,
      provider,
    );
    return liquidation;
  }

  async amountToBorrowWithDecimals(
    liquidateParams: Liquidate,
    attempt: number,
  ) {
    const amountToBorrow = await this.amountToBorrow(liquidateParams, attempt);
    const amountToBorrowWithoutDecimals = amountToBorrow.toFixed(6);
    const amountToBorrowWithDecimals = parseUnits(
      amountToBorrowWithoutDecimals,
      liquidateParams.principal.decimals,
    );
    return amountToBorrowWithDecimals;
  }

  async amountToBorrow(liquidateParams: Liquidate, attempt: number) {
    const principalAmountToPayBack = await this.amountToLiquidate(
      liquidateParams.account,
    );
    return principalAmountToPayBack.mul(
      liquidateParams.market.liquidationPenalty.sub(
        this.swapFee * (attempt + 0.001),
      ),
    );
  }

  provider(liquidateParams: Liquidate) {
    const chainId = liquidateParams.market.chainId;
    const provider = this.evmProviderService.getProvider(chainId);
    return provider;
  }

  async liquidationContractParameters(liquidateParams: Liquidate) {
    const marketAddress = liquidateParams.market.address;
    const nftId = liquidateParams.account.nftId;
    const principalToBorrow = await this.amountToLiquidateWithDecimals(
      liquidateParams,
    );
    const swapData = this.swapData();
    const liquidationParams = utils.defaultAbiCoder.encode(
      ['tuple(address, uint256[], uint256[], bytes)'],
      [
        [
          marketAddress,
          [nftId.toString()],
          [principalToBorrow.toString()],
          swapData,
        ],
      ],
    );
    return liquidationParams;
  }

  async amountToLiquidateWithDecimals(liquidateParams: Liquidate) {
    const amountToLiquidateWithoutDecimals = await this.amountToLiquidate(
      liquidateParams.account,
    );
    const amountToLiquidateWithDecimals = parseUnits(
      amountToLiquidateWithoutDecimals.toFixed(6),
      liquidateParams.principal.decimals,
    );
    return amountToLiquidateWithDecimals;
  }

  swapData() {
    const route = this.route();
    const routerAddress = this.routerAddress();
    const swapData = utils.defaultAbiCoder.encode(
      ['address', 'tuple(address from, address to, bool stable)[]'],
      [routerAddress, route],
    );
    return swapData;
  }

  route() {
    const route: { from: string; to: string; stable: boolean }[] = [];
    return route;
  }

  routerAddress() {
    const EQ_ROUTER = '0x1A05EB736873485655F29a37DEf8a0AA87F5a447';
    const routerAddress = EQ_ROUTER;
    return routerAddress;
  }
}
