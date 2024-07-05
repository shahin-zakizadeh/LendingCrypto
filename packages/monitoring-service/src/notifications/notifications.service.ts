import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Notification } from './notification.event';

@Injectable()
export class NotificationsService {
  protected readonly logger = new Logger(NotificationsService.name);

  constructor(private events: EventEmitter2) { }

  sendNotification(notification: Notification) {
    this.logger.log(`Sent notif: \n ${notification.toString()}`)
    this.events.emit(notification.type(), notification);
  }
}
