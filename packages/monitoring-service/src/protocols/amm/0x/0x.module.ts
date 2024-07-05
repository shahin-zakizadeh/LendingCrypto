import { Module } from "@nestjs/common";
import { ZeroEx } from "./0x.service";

@Module({
    providers:[ZeroEx],
    exports: [ZeroEx]
})
export class ZeroExModule {}