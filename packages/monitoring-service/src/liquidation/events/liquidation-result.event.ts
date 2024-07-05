import { Account } from 'src/lendingModule/entities/account.entity';

export class LiquidationResult {
  static NAME = 'liquidation_result';
  constructor(
    public account: Account,
    public success: boolean,
    public profit: number,
    public txId: string,
  ) {}
}
