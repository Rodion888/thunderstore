import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PaymentLogger } from '../utils/payment-logger.js';

import fetch from 'node-fetch';

export default async function paymentRoutes(fastify: FastifyInstance): Promise<void> {
  const logger = new PaymentLogger(fastify);
  
  fastify.post('/payment/create', async (request: FastifyRequest<{
    Body: { orderId: number; amount: number; email: string; }
  }>, reply: FastifyReply) => {
    try {
      const { orderId, amount, email } = request.body;
      
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
          webhook_url: `${baseUrl}/api/payment/webhook`,
          success_url: `${process.env.CORS_ORIGIN || 'http://localhost:4200'}/success?orderId=${orderId}`,
          fail_url: `${process.env.CORS_ORIGIN || 'http://localhost:4200'}/checkout`,
        }),
      });

      const result = await response.json();

      if (result?.status === 'success' && (result?.pay_url || result?.payurl)) {
        const paymentUrl = result.pay_url || result.payurl;
        logger.logPaymentCreated(orderId, paymentUrl);
        return reply.send({ paymentUrl });
      }

      logger.logPaymentCreationError(orderId, result);
      return reply.status(500).send({ error: 'Failed to create invoice', details: result });
    } catch (error) {
      logger.logPaymentCreationError(request.body?.orderId || 0, error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  fastify.post('/payment/webhook', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = request.body as any;
      
      logger.logWebhookReceived(data);
      
      if (data.status === 'success') {
        logger.logPaymentSuccess(data.order_id, data);
        try {
          await fastify.pool.query(
            `UPDATE orders SET status = 'paid' WHERE id = $1`,
            [data.order_id]
          );
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
}
