import { Module } from '@nestjs/common';
import { DiscordService } from './discord.service';
import { DiscordModule as DiscordNestjs } from '@discord-nestjs/core';
import { GatewayIntentBits } from 'discord.js';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    DiscordNestjs.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        token: config.get('DISCORD_BOT_TOKEN'),
        discordClientOptions: {
          intents: [GatewayIntentBits.Guilds],
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [DiscordService],
})
export class DiscordModule {}
