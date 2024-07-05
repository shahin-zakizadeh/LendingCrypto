import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectDiscordClient } from '@discord-nestjs/core';
import { TextChannel, Client as DiscordClient } from 'discord.js';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { Notification } from '../notifications/notification.event';

@Injectable()
export class DiscordService implements OnModuleInit {
  protected readonly logger = new Logger(DiscordService.name);

  notificationChannel: TextChannel;
  connected = false;

  constructor(
    @InjectDiscordClient() private dcClient: DiscordClient,
    private config: ConfigService,
  ) { }

  async onModuleInit(): Promise<void> {
    const token = this.config.get('DISCORD_BOT_TOKEN');
    if (token) {
      await this.dcClient.login(this.config.get('DISCORD_BOT_TOKEN'));
      const notificationChannel = await this.dcClient.channels.fetch(
        this.config.get('DISCORD_NOTIFICATION_CHANNEL'),
      );
      if (notificationChannel.isTextBased) {
        this.notificationChannel = notificationChannel as TextChannel;
        await this.send('MCLB Monitoring Online');
      } else {
        this.logger.error('Should be text based channel');
      }
      this.connected = true;
    }
  }

  @OnEvent(`${Notification.PREFIX}.*`)
  async send(msg: any) {
    try {
      if (this.connected) {
        await this.notificationChannel.send(msg.toString());
      }
    } catch (error) {
      this.logger.error("An error happened while pushing a notification", error);
    }
  }
}
