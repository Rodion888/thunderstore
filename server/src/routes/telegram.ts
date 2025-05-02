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
  // Route for handling Telegram webhooks
  fastify.post('/telegram/webhook', async (request: FastifyRequest<{
    Body: TelegramWebhookBody
  }>, reply: FastifyReply) => {
    try {
      fastify.log.info('Received Telegram webhook:', request.body);
      const update = request.body;
      
      // Check if this is a text message
      if (update.message?.text && update.message?.chat?.id) {
        // Check if this is a command (starts with /)
        if (update.message.text.startsWith('/')) {
          await telegramBot.handleCommand(update.message.text, update.message.chat.id);
        } else {
          await telegramBot.handleMessage(update.message);
        }
      }
      
      return reply.send({ status: 'ok' });
    } catch (error) {
      fastify.log.error('Error processing Telegram webhook:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
  
  // Add test route to verify bot functionality
  fastify.get('/telegram/test', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const chatId = process.env.TELEGRAM_CHAT_ID;
      if (!chatId) {
        return reply.status(400).send({ error: 'TELEGRAM_CHAT_ID not set' });
      }
      
      const result = await telegramBot.sendMessage('🧪 *Тестовое сообщение*\n\nЕсли вы видите это сообщение, значит бот работает корректно.', chatId);
      
      return reply.send({ 
        status: 'ok',
        result,
        message: 'Test message sent. Check your Telegram.'
      });
    } catch (error) {
      fastify.log.error('Error sending test message:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
} 