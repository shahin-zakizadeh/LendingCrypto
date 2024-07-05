import { Inject, Injectable, CACHE_MANAGER } from '@nestjs/common';
import { Asset } from '../../../assets/entities/asset.entity';
import { BigNumber, BigNumberish } from 'ethers';
import LIFI from '@lifi/sdk';
import { Cache } from 'cache-manager';
/**
 * LiFi is rate limited to 40 requests per minute
 */
@Injectable()
export class LiFiService {
  liFi: LIFI;
  ttl: number;
  constructor(@Inject(CACHE_MANAGER) protected cacheManager: Cache) {
    this.liFi = new LIFI({});
    this.ttl = 3 * 60 * 1000;
  }
  /**
   * Returns the estimated output of `amount` `fromAsset` being traded in for the `toAsset`
   * @param fromAsset Asset that is being traded in
   * @param toAsset Asset received
   * @param amount amount of the `fromAsset`
   * @returns the amount of the `toAsset` received
   */
  async estimateOutput(fromAsset: Asset, toAsset: Asset, amount: BigNumberish): Promise<BigNumber> {
    const key = `lifi.getQuote.${fromAsset.chainId}.${fromAsset.address}.${toAsset.chainId}.${toAsset.address}.${amount.toString()}`;
    const cachedData = await this.cacheManager.get<string>(key);
    if (cachedData) {
      return BigNumber.from(cachedData);
    }

    const quote = await this.liFi.getQuote({
      fromChain: fromAsset.chainId,
      fromToken: fromAsset.address,
      fromAddress: fromAsset.address,
      fromAmount: amount.toString(),
      toChain: toAsset.chainId,
      toToken: toAsset.address,
    })
    const answer = BigNumber.from(quote.estimate.toAmountMin);
    await this.cacheManager.set(
      key,
      (answer).toString(),
      this.ttl
    );
    return answer;
  }
}