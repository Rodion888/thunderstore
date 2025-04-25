import { FastifyRequest as OriginalRequest } from 'fastify';
import { FastifyInstance } from 'fastify';
import { Pool } from 'pg';
import { TelegramBot } from '../utils/telegram-bot.js';

declare module 'fastify' {
  export interface FastifyRequest extends OriginalRequest {
    cookies: {
      sessionId?: string;
      [key: string]: string | undefined;
    };
  }

  interface FastifyInstance {
    pool: Pool;
    telegramBot: TelegramBot;
  }
}
