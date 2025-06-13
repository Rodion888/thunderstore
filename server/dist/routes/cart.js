import { addToCart, removeFromCart, clearCart } from '../services/cartService.js';
import { carts } from '../storage/carts.js';
export default async function cartRoutes(fastify) {
    fastify.post('/cart/add', async (req, reply) => {
        const { productId, size, quantity } = req.body;
        const sessionId = req.cookies.sessionId;
        if (!productId || !size || !quantity || !sessionId) {
            return reply.status(400).send({ message: 'Wrong data' });
        }
        try {
            const product = await addToCart(sessionId, productId, size, quantity);
            return reply.send({ message: 'Product has been added to cart', product });
        }
        catch (error) {
            return reply.status(400).send({ message: error.message });
        }
    });
    fastify.post('/cart/remove', async (req, reply) => {
        const { productId, size, quantity } = req.body;
        const sessionId = req.cookies.sessionId;
        if (!productId || !size || !quantity || !sessionId) {
            return reply.status(400).send({ message: 'Wrong data' });
        }
        try {
            const product = await removeFromCart(sessionId, productId, size, quantity);
            return reply.send({ message: 'Product has been removed from cart', product });
        }
        catch (error) {
            return reply.status(400).send({ message: error.message });
        }
    });
    fastify.get('/cart', async (req, reply) => {
        const sessionId = req.cookies.sessionId;
        if (!sessionId) {
            return reply.status(400).send({ message: 'Session not found' });
        }
        const userCart = carts.get(sessionId) || [];
        return reply.send(userCart);
    });
    fastify.post('/cart/clear', async (req, reply) => {
        const sessionId = req.cookies.sessionId;
        if (!sessionId) {
            return reply.status(400).send({ message: 'Session not found' });
        }
        await clearCart(sessionId);
        return reply.send({ message: 'The cart has been cleared' });
    });
}
//# sourceMappingURL=cart.js.map