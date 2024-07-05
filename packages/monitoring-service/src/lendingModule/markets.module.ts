import { Module } from '@nestjs/common';
import { MarketsService } from './markets.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Market } from './entities/market.entity';
import { Account } from './entities/account.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Market, Account])],
  providers: [MarketsService],
  exports: [MarketsService],
})
export class MarketsModule { }
