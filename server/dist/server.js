import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyCookie from '@fastify/cookie';
import crypto from 'crypto';
import productRoutes from './routes/products.js';
import cartRoutes from './routes/cart.js';
import paymentRoutes from './routes/payment.js';
import orderRoutes from './routes/orders.js';
import dotenv from 'dotenv';
import { setupWebSocket } from './wsServer.js';
// Загружаем конфигурацию из файла .env
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: envFile });
// Создаем экземпляр Fastify
const fastify = Fastify({
    logger: { level: 'info' },
});
// CORS настройки
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:4200';
// Регистрируем плагин CORS
fastify.register(fastifyCors, {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
});
// Регистрируем плагин для работы с cookies
fastify.register(fastifyCookie);
// Регистрируем маршруты
fastify.register(productRoutes, { prefix: '/api' });
fastify.register(cartRoutes, { prefix: '/api' });
fastify.register(paymentRoutes, { prefix: '/api' });
fastify.register(orderRoutes, { prefix: '/api' });
// Глобальный обработчик запросов для создания сессии
fastify.addHook('onRequest', (req, reply, done) => {
    // Проверяем наличие sessionId после регистрации cookie плагина
    if (!req.cookies || !req.cookies.sessionId) {
        const sessionId = crypto.randomUUID();
        reply.setCookie('sessionId', sessionId, {
            path: '/',
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production',
        });
    }
    done();
});
// Настройки сервера
const PORT = 3000;
const HOST = "0.0.0.0";
// Запуск сервера
const start = async () => {
    try {
        const server = await fastify.listen({ port: PORT, host: HOST });
        setupWebSocket(fastify.server);
        fastify.log.info(`Server is running at ${server}`);
    }
    catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();
//# sourceMappingURL=server.js.map