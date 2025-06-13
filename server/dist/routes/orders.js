import { carts } from '../storage/carts.js';
import orderService from '../services/orderService.js';
export default async function orderRoutes(fastify) {
    fastify.post('/orders', async (req, reply) => {
        const sessionId = req.cookies.sessionId;
        if (!sessionId) {
            return reply.status(400).send({ message: 'Session not found' });
        }
        const orderData = req.body;
        const cartItems = carts.get(sessionId) || [];
        const totalAmount = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
        try {
            const validationResult = await orderService.validateCartItems(cartItems);
            if (!validationResult.isValid) {
                return reply.status(400).send({ message: validationResult.message });
            }
            const orderId = await orderService.createOrder(sessionId, orderData, cartItems, totalAmount);
            await orderService.decreaseStock(cartItems);
            carts.delete(sessionId);
            reply.send({ message: 'Order successfully created', orderId });
        }
        catch (error) {
            console.error('Error creating order:', error);
            reply.status(500).send({ message: 'Failed to create order' });
        }
    });
}
//# sourceMappingURL=orders.js.map