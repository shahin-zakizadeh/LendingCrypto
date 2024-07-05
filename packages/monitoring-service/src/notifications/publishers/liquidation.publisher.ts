import { Injectable } from "@nestjs/common";
import { NotificationsService } from "../notifications.service";
import { OnEvent } from "@nestjs/event-emitter";
import { Notification } from "../notification.event";
import { Liquidate } from "../../liquidation/events/liquidate.event";


export class LiquidationNotif extends Notification {
    constructor(public liqu: Liquidate) {
        super("liquidation.processing");
    }

    toString() {
        const principalAmount = this.liqu.account.principalAmount.mul(this.liqu.market.interestIndex).div(this.liqu.account.interestIndex)
        return `
            Liquidating Account ${this.liqu.account.id}\n 
            - NFT ID: ${this.liqu.account.nftId}\n
            - Market: (${this.liqu.market.chainId})${this.liqu.market.address}\n
            - Collateral: ${this.liqu.account.collateralAmount} ${this.liqu.collateral.name}\n
            - Principal: ${principalAmount} ${this.liqu.principal.name}`
    }
}

@Injectable()
export class LiquidationPublisher {

    constructor(private notifService: NotificationsService) { }

    @OnEvent(Liquidate.NAME)
    publishEvent(event: Liquidate) {
        this.notifService.sendNotification(new LiquidationNotif(event));
    }

}