import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { addToCart, removeFromCart, clearCart } from '../services/cartService.js';
import { carts } from '../storage/carts.js';

interface AddToCartBody {
  productId: number;
  quantity: number;
  size: string;
}

export default async function cartRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post('/cart/add', async (req: FastifyRequest<{
    Body: AddToCartBody;
  }>, reply: FastifyReply) => {
    const { productId, size, quantity } = req.body;
    const sessionId = req.cookies.sessionId;

    if (!productId || !size || !quantity || !sessionId) {
      return reply.status(400).send({ message: 'Wrong data' });
    }
    
    try {
      const product = await addToCart(sessionId, productId, size, quantity);
      return reply.send({ message: 'Product has been added to cart', product });
    } catch (error) {
      return reply.status(400).send({ message: (error as Error).message });
    }
  });

  fastify.post('/cart/remove', async (req: FastifyRequest<{
    Body: AddToCartBody;
  }>, reply: FastifyReply) => {
    const { productId, size, quantity } = req.body;
    const sessionId = req.cookies.sessionId;

    if (!productId || !size || !quantity || !sessionId) {
      return reply.status(400).send({ message: 'Wrong data' });
    }
    
    try {
      const product = await removeFromCart(sessionId, productId, size, quantity);
      return reply.send({ message: 'Product has been removed from cart', product });
    } catch (error) {
      return reply.status(400).send({ message: (error as Error).message });
    }
  });

  fastify.get('/cart', async (req: FastifyRequest, reply: FastifyReply) => {
    const sessionId = req.cookies.sessionId;

    if (!sessionId) {
      return reply.status(400).send({ message: 'Session not found' });
    }
    
    const userCart = carts.get(sessionId) || [];
    return reply.send(userCart);
  });

  fastify.post('/cart/clear', async (req: FastifyRequest, reply: FastifyReply) => {
    const sessionId = req.cookies.sessionId;

    if (!sessionId) {
      return reply.status(400).send({ message: 'Session not found' });
    }
    
    await clearCart(sessionId);
    return reply.send({ message: 'The cart has been cleared' });
  });
}
