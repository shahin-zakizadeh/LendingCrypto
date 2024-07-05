import { Injectable } from "@nestjs/common";
import { NotificationsService } from "../notifications.service";
import { OnEvent } from "@nestjs/event-emitter";
import { QueueLiquidation } from "src/liquidation/events/queue-liquidation.event";
import { Notification } from "../notification.event";


export class QueuedLiquidationNotif extends Notification {
    constructor(public liqu: QueueLiquidation) {
        super("liquidation.queued");
    }

    toString() {
        return `
            Queued Account for liquidation \n
            - NFT ID: ${this.liqu.nftId} \n
            - Market: ${this.liqu.marketId} \n
            - Current HR: ${this.liqu.healthRatio}
        `
    }
}

@Injectable()
export class QueueLiquidationPublisher {

    constructor(private notifService: NotificationsService) { }

    @OnEvent(QueueLiquidation.NAME)
    publishEvent(event: QueueLiquidation) {
        this.notifService.sendNotification(new QueuedLiquidationNotif(event));
    }

}