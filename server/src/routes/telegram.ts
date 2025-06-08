import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { TelegramBot } from '../utils/telegram-bot.js';

interface TelegramWebhookBody {
  message?: {
    text?: string;
    chat?: {
      id: string;
    };
  };
}

export default async function telegramRoutes(fastify: FastifyInstance, telegramBot: TelegramBot): Promise<void> {
  fastify.post('/telegram/webhook', async (request: FastifyRequest<{
    Body: TelegramWebhookBody
  }>, reply: FastifyReply) => {
    try {
      fastify.log.info('Received Telegram webhook body (pretty): ' + JSON.stringify(request.body, null, 2));
      const update = request.body;
      
      if (update.message?.chat?.id) {
        if (update.message.text && update.message.text.startsWith('/')) {
          await telegramBot.handleCommand(update.message.text, update.message.chat.id);
        }
      }
      
      return reply.send({ status: 'ok' });
    } catch (error) {
      fastify.log.error('Error processing Telegram webhook:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}
