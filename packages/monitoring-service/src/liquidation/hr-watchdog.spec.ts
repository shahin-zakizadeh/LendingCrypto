import { Account } from './../lendingModule/entities/account.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { TestAppService } from '../utils/test-module/test-app.service';
import { TestAppModule } from '../utils/test-module/test-app.module';
import { HealthRatioWatchdogService } from './hr-watchdog.service';
import { Seed } from '../utils/seed.commander';
import { AssetsModule } from '../assets/assets.module';
import { MarketsModule } from '../lendingModule/markets.module';
import { PriceSource } from '../assets/entities/price-source.entity';
import { QueueLiquidation } from './events/queue-liquidation.event';
jest.setTimeout(60000);

describe('HealthRatioWatchdog', () => {

    let testService: TestAppService;
    let hrwatchdog: HealthRatioWatchdogService;
    let seed: Seed;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TestAppModule.register({ useDatabase: true }),
                TypeOrmModule.forFeature([Account, PriceSource]),
                AssetsModule,
                MarketsModule,
            ],
            providers: [HealthRatioWatchdogService, Seed]

        }).compile();

        testService = module.get<TestAppService>(TestAppService);
        hrwatchdog = module.get<HealthRatioWatchdogService>(HealthRatioWatchdogService);
        seed = module.get<Seed>(Seed);

        await testService.prepareTest();
    });
    afterEach(async () => {
        await testService?.tearDownTest();
    })

    it('Should emit QueueLiquidation events for accounts with health ratio below 1', async () => {

        const liquidableAccountList = await seed.seed();
        // @ts-ignore
        const emitSpy = jest.spyOn(hrwatchdog.eventEmitter, 'emit');
        await hrwatchdog.checkHealthRatio();

        expect(emitSpy).toHaveBeenCalledWith(QueueLiquidation.NAME, new QueueLiquidation(liquidableAccountList[0].nftId, liquidableAccountList[0].marketId, expect.anything()));
        expect(emitSpy).toHaveBeenCalledWith(QueueLiquidation.NAME, new QueueLiquidation(liquidableAccountList[1].nftId, liquidableAccountList[1].marketId, expect.anything()));
        expect(emitSpy).toHaveBeenLastCalledWith(QueueLiquidation.NAME, new QueueLiquidation(liquidableAccountList[2].nftId, liquidableAccountList[2].marketId, expect.anything()));
    });
});