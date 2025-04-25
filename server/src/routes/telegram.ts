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
  // Маршрут для обработки вебхуков от Telegram
  fastify.post('/telegram/webhook', async (request: FastifyRequest<{
    Body: TelegramWebhookBody
  }>, reply: FastifyReply) => {
    try {
      const update = request.body;
      
      // Проверяем, что это сообщение с текстом
      if (update.message?.text && update.message?.chat?.id) {
        await telegramBot.handleCommand(update.message.text, update.message.chat.id);
      }
      
      return reply.send({ status: 'ok' });
    } catch (error) {
      fastify.log.error('Error processing Telegram webhook:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
} 