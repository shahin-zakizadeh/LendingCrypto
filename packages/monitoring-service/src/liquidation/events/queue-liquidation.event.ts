export class QueueLiquidation {
  static NAME = 'queue_liquidation';
  constructor(public nftId: number, public marketId: number, public healthRatio: number) {}
}
