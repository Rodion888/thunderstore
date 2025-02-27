import { loadProducts, getProductById } from '../services/productService.js';

export default async function productRoutes(fastify) {
  fastify.get('/products', async (req) => {
    const { _limit = 10, _page = 1 } = req.query;

    const products = await loadProducts();
    const limit = parseInt(_limit, 10);
    const page = parseInt(_page, 10);

    const start = (page - 1) * limit;
    const paginatedProducts = products.slice(start, start + limit);

    return {
      total: products.length,
      products: paginatedProducts,
      page,
      limit,
    };
  });

  fastify.get('/products/:id', async (req, reply) => {
    const product = await getProductById(req.params.id);

    if (!product) {
      return reply.status(404).send({ message: 'Fail to find product' });
    }

    return reply.send(product);
  });
}
