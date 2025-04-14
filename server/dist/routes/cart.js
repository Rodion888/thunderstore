import cartService from '../services/cartService.js';
export default async function cartRoutes(fastify) {
    // Get cart items
    fastify.get('/cart', async (req, reply) => {
        try {
            const sessionId = req.cookies.sessionId;
            if (!sessionId) {
                return reply.status(400).send({ message: 'Session not found' });
            }
            const cartItems = await cartService.getCartItems(sessionId);
            return reply.send({ items: cartItems });
        }
        catch (error) {
            return reply.status(500).send({ message: 'Server error' });
        }
    });
    // Add to cart
    fastify.post('/cart', async (req, reply) => {
        try {
            const sessionId = req.cookies.sessionId;
            if (!sessionId) {
                return reply.status(400).send({ message: 'Session not found' });
            }
            const { productId, quantity } = req.body;
            const cartItems = await cartService.addToCart(sessionId, productId, quantity);
            return reply.send({ message: 'Item added to cart', items: cartItems });
        }
        catch (error) {
            return reply.status(500).send({ message: 'Server error' });
        }
    });
    // Update cart item
    fastify.put('/cart/:id', async (req, reply) => {
        try {
            const sessionId = req.cookies.sessionId;
            if (!sessionId) {
                return reply.status(400).send({ message: 'Session not found' });
            }
            const itemId = parseInt(req.params.id, 10);
            const { quantity } = req.body;
            const cartItems = await cartService.updateCartItem(sessionId, itemId, quantity);
            return reply.send({ message: 'Cart updated', items: cartItems });
        }
        catch (error) {
            return reply.status(500).send({ message: 'Server error' });
        }
    });
    // Remove from cart
    fastify.delete('/cart/:id', async (req, reply) => {
        try {
            const sessionId = req.cookies.sessionId;
            if (!sessionId) {
                return reply.status(400).send({ message: 'Session not found' });
            }
            const itemId = parseInt(req.params.id, 10);
            const cartItems = await cartService.removeFromCart(sessionId, itemId);
            return reply.send({ message: 'Item removed from cart', items: cartItems });
        }
        catch (error) {
            return reply.status(500).send({ message: 'Server error' });
        }
    });
}
//# sourceMappingURL=cart.js.map