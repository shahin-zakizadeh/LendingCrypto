import { Module } from '@nestjs/common';
import { LiFiService } from './LiFi.service';

@Module({
    imports: [],
    providers: [LiFiService],
    exports: [LiFiService],
})
export class LiFiModule { }

