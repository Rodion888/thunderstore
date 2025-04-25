import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PaymentLogger } from '../utils/payment-logger.js';

import fetch from 'node-fetch';

export default async function paymentRoutes(fastify: FastifyInstance): Promise<void> {
  const logger = new PaymentLogger(fastify);
  
  // Создание инвойса для оплаты
  fastify.post('/payment/create', async (request: FastifyRequest<{
    Body: { orderId: number; amount: number; email: string; }
  }>, reply: FastifyReply) => {
    try {
      const { orderId, amount, email } = request.body;
      
      // Логируем начало создания платежа
      logger.logPaymentCreation(orderId, amount, email);
      
      const API_KEY = process.env.CRYPTO_CLOUD_API_KEY;
      const SHOP_ID = process.env.CRYPTO_CLOUD_SHOP_ID;
      const baseUrl = process.env.APP_URL;
      
      if (!API_KEY || !SHOP_ID || !baseUrl) {
        fastify.log.error('Missing payment configuration. Check environment variables.');
        logger.logPaymentCreationError(orderId, 'Missing payment configuration');
        return reply.status(500).send({ error: 'Payment service misconfigured' });
      }

      const response = await fetch('https://api.cryptocloud.plus/v1/invoice/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${API_KEY}`,
        },
        body: JSON.stringify({
          shop_id: SHOP_ID,
          amount: amount.toFixed(2),
          currency: 'USD',
          order_id: String(orderId),
          email: email,
          webhook_url: `${baseUrl}/payment/webhook`,
          success_url: `${baseUrl}/success?orderId=${orderId}`,
          fail_url: `${baseUrl}/checkout`,
        }),
      });

      const result = await response.json();

      // Проверяем структуру ответа от API - может быть либо data.url, либо payurl
      if (result?.data?.url) {
        // Логируем успешное создание платежа (старый формат API)
        logger.logPaymentCreated(orderId, result.data.url);
        return reply.send({ paymentUrl: result.data.url });
      } else if (result?.payurl && result?.status === 'success') {
        // Логируем успешное создание платежа (новый формат API)
        logger.logPaymentCreated(orderId, result.payurl);
        return reply.send({ paymentUrl: result.payurl });
      }

      // Логируем ошибку
      logger.logPaymentCreationError(orderId, result);
      return reply.status(500).send({ error: 'Failed to create invoice', details: result });
    } catch (error) {
      // Логируем исключение
      logger.logPaymentCreationError(request.body?.orderId || 0, error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Webhook для получения уведомлений о статусе платежа
  fastify.post('/payment/webhook', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = request.body as any;
      
      // Логируем получение вебхука
      logger.logWebhookReceived(data);

      if (data.status === 'paid') {
        // Логируем успешную оплату
        logger.logPaymentSuccess(data.order_id);
        
        // Обновляем статус заказа в базе данных
        try {
          await fastify.pool.query(
            `UPDATE orders SET status = 'paid' WHERE id = $1`,
            [data.order_id]
          );
          
          // Отправляем более подробное уведомление в Telegram
          if (fastify.telegramBot) {
            fastify.telegramBot.sendMessage(`💵 *Оплата успешно поступила*\n\nЗаказ №${data.order_id} оплачен.\nСумма: ${data.amount} ${data.currency}\nИспользуйте /order ${data.order_id} для подробностей.`);
          }
        } catch (dbError) {
          fastify.log.error(`Error updating order status: ${dbError}`);
        }
      }

      return reply.send({ status: 'ok' });
    } catch (error) {
      fastify.log.error('Error processing webhook:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
  
  // Добавляем эндпоинт для проверки здоровья сервиса
  fastify.get('/health', async (request, reply) => {
    return reply.send({ status: 'ok' });
  });
}
