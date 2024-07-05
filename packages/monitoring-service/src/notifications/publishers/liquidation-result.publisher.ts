import { Injectable } from "@nestjs/common";
import { NotificationsService } from "../notifications.service";
import { OnEvent } from "@nestjs/event-emitter";
import { Notification } from "../notification.event";
import { LiquidationResult } from "../../liquidation/events/liquidation-result.event";


export class LiquidationResultNotif extends Notification {
    constructor(public liqu: LiquidationResult) {
        super("liquidation.results");
    }

    toString() {
        return `
            Liquidating Results for ${this.liqu.account.id} \n 
            - Success: ${this.liqu.success}\n
            - Profit: ${this.liqu.profit}\n
            - txId: ${this.liqu.txId}`
    }
}

@Injectable()
export class LiquidationResultPublisher {

    constructor(private notifService: NotificationsService) { }

    @OnEvent(LiquidationResult.NAME)
    publishEvent(event: LiquidationResult) {
        this.notifService.sendNotification(new LiquidationResultNotif(event));
    }

}