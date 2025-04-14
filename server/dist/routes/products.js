import productService from '../services/productService.js';
export default async function productRoutes(fastify) {
    fastify.get('/products', async (req, reply) => {
        try {
            const { _limit = '10', _page = '1' } = req.query;
            const productsData = await productService.getProducts();
            const products = productsData;
            const limit = parseInt(_limit, 10);
            const page = parseInt(_page, 10);
            const start = (page - 1) * limit;
            const paginatedProducts = products.slice(start, start + limit);
            return reply.send({
                total: products.length,
                products: paginatedProducts,
                page,
                limit,
            });
        }
        catch (error) {
            return reply.status(500).send({ message: 'Server error' });
        }
    });
    fastify.get('/products/:id', async (req, reply) => {
        try {
            const product = await productService.getProductById(req.params.id);
            if (!product) {
                return reply.status(404).send({ message: 'Fail to find product' });
            }
            return reply.send(product);
        }
        catch (error) {
            return reply.status(500).send({ message: 'Server error' });
        }
    });
}
//# sourceMappingURL=products.js.map