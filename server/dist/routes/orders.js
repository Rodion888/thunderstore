import orderService from '../services/orderService.js';
export default async function orderRoutes(fastify) {
    // Create a new order
    fastify.post('/orders', async (req, reply) => {
        try {
            const sessionId = req.cookies.sessionId;
            if (!sessionId) {
                return reply.status(400).send({ message: 'Session not found' });
            }
            const orderData = req.body;
            const result = await orderService.createOrder(sessionId, orderData);
            return reply.send(result);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Server error';
            return reply.status(500).send({ message: errorMessage });
        }
    });
    // Get user orders
    fastify.get('/orders', async (req, reply) => {
        try {
            const sessionId = req.cookies.sessionId;
            if (!sessionId) {
                return reply.status(400).send({ message: 'Session not found' });
            }
            const orders = await orderService.getOrders(sessionId);
            return reply.send({ orders });
        }
        catch (error) {
            return reply.status(500).send({ message: 'Server error' });
        }
    });
}
//# sourceMappingURL=orders.js.map