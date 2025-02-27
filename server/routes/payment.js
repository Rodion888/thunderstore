import { createPayment } from '../services/paymentService.js';

export default async function paymentRoutes(fastify) {
  fastify.post('/api/create-payment', async (req, reply) => {
    try {
      const { amount, description } = req.body;

      if (!amount || !description) {
        return reply.status(400).send({ error: 'Некорректные данные' });
      }

      const payment = await createPayment(amount, description);
      reply.send(payment);
    } catch (error) {
      reply.status(500).send({ error: error.message });
    }
  });
}
