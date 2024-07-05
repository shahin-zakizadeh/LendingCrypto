import { Injectable } from '@nestjs/common';
import { CronExpression } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron } from '@nestjs/schedule';
import { QueueLiquidation } from './events/queue-liquidation.event';

@Injectable()
export class HealthRatioWatchdogService {

    constructor(
        @InjectDataSource() private dataSource: DataSource,
        private eventEmitter: EventEmitter2,
    ) { }
    /**
    @dev The query is composed of two Common Table Expressions (CTEs) and a final SELECT statement:
    1.	The prices CTE:
    This CTE retrieves the latest USD value and priority for each asset by joining 
    the PriceEntry and PriceSource tables. 
    It groups the PriceEntry table by priceSourceId and 
    finds the maximum timestamp (MAX(at)) for each group. 
    Then, it joins the PriceEntry table again with the maximum timestamps 
    to fetch the latest USD values (usdValue). 
    Finally, it joins the PriceSource table to fetch the priority values.

    2.	The accounts_with_prices CTE:
    This CTE retrieves all the necessary columns to calculate the health ratio. 
    It starts by joining the Account and Market tables, 
    and then joins the prices CTE using the collateralAssetId. 
    As a result, the CTE contains the columns required for 
    the health ratio calculation, 
    such as collateralAmount, 
    latest (the latest USD value for each asset), 
    liquidationThreshold, principalAmount, marketInterestIndex, and accountInterestIndex.

    3.	The final SELECT statement:
    This statement calculates the health ratio for each account using 

    CV: Collateral Value
    CA: Collateral Amount
    CP: Collateral Price
    LT: liquidation Threshold
    PA: Principal Amount
    PP: Principal Price
    MII: Market Interest Index
    AII: Account Interest Index
    
    the formula :
    CV = CA * CP
    PV = PA * PP
    HR = CV  / (PV * (MII / AII) * LT)
    
    It selects the id and health ratio for each account 
    and filters the results to include only accounts with a health ratio below 1, 
    which indicates that these accounts should be considered for liquidation.
    @dev To avoid Postgres ambious column names, select * is not used for accounts_with_prices CTE.
     */
    @Cron(CronExpression.EVERY_MINUTE)
    async checkHealthRatio() {
        const query = `
        with prices as (
            select 
              "assetId", 
              "usdValue" as "latest", 
              priority 
            from 
              (
                select 
                  "priceSourceId", 
                  MAX(at) as "maxTimestamp" 
                from 
                  price_entry pe 
                group by 
                  "priceSourceId"
              ) max_prices 
              join price_entry pe on max_prices."priceSourceId" = pe."priceSourceId" 
              and max_prices."maxTimestamp" = pe.at 
              join price_source ps on max_prices."priceSourceId" = ps.id
          ), 
          accounts_with_collateral_prices as (
            select 
              accounts."ID" as "accID", 
              accounts."collateralAmount", 
              accounts."principalAmount", 
              accounts.accountinterestindex, 
              accounts."nftId", 
              accounts."marketId", 
              accounts."liquidationThreshold", 
              accounts."collateralAssetId", 
              accounts.marketinterestindex, 
              accounts."principalAssetId", 
              accounts."chainId", 
              prices."latest" as "collateralPrice" 
            from 
              (
                select 
                  account.id as "ID", 
                  account."collateralAmount", 
                  account."principalAmount", 
                  account."interestIndex" as accountinterestindex, 
                  account."nftId", 
                  account."marketId", 
                  market."collateralAssetId", 
                  market."liquidationThreshold", 
                  market."interestIndex" as marketinterestindex, 
                  market."principalAssetId", 
                  market."chainId" 
                from 
                  account 
                  join market on market.id = account."marketId"
              ) accounts 
              join prices on prices."assetId" = accounts."collateralAssetId" 
            where 
              accounts."principalAmount" > 0
          ), 
          accounts_with_prices as (
            select 
              accounts_with_collateral_prices."accID" as accID, 
              accounts_with_collateral_prices."collateralAmount", 
              accounts_with_collateral_prices."principalAmount", 
              accounts_with_collateral_prices.accountinterestindex, 
              accounts_with_collateral_prices."nftId", 
              accounts_with_collateral_prices."marketId", 
              accounts_with_collateral_prices."liquidationThreshold", 
              accounts_with_collateral_prices."collateralAssetId", 
              accounts_with_collateral_prices.marketinterestindex, 
              accounts_with_collateral_prices."principalAssetId", 
              accounts_with_collateral_prices."chainId", 
              accounts_with_collateral_prices."collateralPrice", 
              prices.latest as "principalPrice" 
            from 
              accounts_with_collateral_prices 
              join prices on prices."assetId" = accounts_with_collateral_prices."principalAssetId"
          ) 
          select 
            * 
          from 
            (
              select 
                *, 
                (
                  accounts_with_prices."collateralAmount" * accounts_with_prices."collateralPrice"
                ) / (
                  accounts_with_prices."principalAmount" * accounts_with_prices."principalPrice" * accounts_with_prices."liquidationThreshold" * (
                    accounts_with_prices.marketinterestindex / accounts_with_prices.accountinterestindex
                  )
                ) as health_ratio 
              from 
                accounts_with_prices
            ) as LiquidableAccounts 
          where 
            health_ratio < 1
          
        `;
        const results = await this.dataSource.query(query);
        //Emit events to trigger liquidation for each account
        for (const result of results) {
            this.eventEmitter.emit(QueueLiquidation.NAME, new QueueLiquidation(result.nftId, result.marketId, result.health_ratio));
        }
    }
}
