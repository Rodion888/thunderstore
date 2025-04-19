import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import fetch from 'node-fetch';

export default async function paymentRoutes(fastify: FastifyInstance): Promise<void> {
  // Создание инвойса для оплаты
  fastify.post('/payment/create', async (request: FastifyRequest<{
    Body: { orderId: number; amount: number; email: string; }
  }>, reply: FastifyReply) => {
    try {
      const { orderId, amount, email } = request.body;
      
      const API_KEY = process.env.CRYPTO_CLOUD_API_KEY || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1dWlkIjoiTlRBNE5UQT0iLCJ0eXBlIjoicHJvamVjdCIsInYiOiJlZDI4MjE4MzQzMGY3NDZmMDk4ZGEzZmNjZjgxMWJjOWY5NjAzYThiODJjMTlhYjY3NGFlMjUwMTJhOWM0ZTBjIiwiZXhwIjo4ODE0NDY0NTc0N30.Ppjf3kY3hfSDy9ErfMK8WHBDreYzKZ5twg_VSf0ElLY';
      const SHOP_ID = process.env.CRYPTO_CLOUD_SHOP_ID || '2MvizC7uTrWicPTI';
      
      const baseUrl = process.env.APP_URL || 'http://localhost:3000';
      
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

      if (result?.data?.url) {
        return reply.send({ paymentUrl: result.data.url });
      }

      console.error('Error creating invoice:', result);
      return reply.status(500).send({ error: 'Failed to create invoice', details: result });
    } catch (error) {
      console.error('Error in payment processing:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Webhook для получения уведомлений о статусе платежа
  fastify.post('/payment/webhook', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = request.body as any;
      console.log('Payment webhook received:', data);

      if (data.status === 'paid') {
        console.log('✅ Payment successful for order:', data.order_id);
        // TODO: Обновить статус заказа в базе данных
        
        // Здесь должна быть логика обновления статуса заказа
        // Пример:
        // await pool.query(
        //   `UPDATE orders SET status = 'paid' WHERE id = $1`,
        //   [data.order_id]
        // );
      }

      return reply.send({ status: 'ok' });
    } catch (error) {
      console.error('Error processing webhook:', error);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}
