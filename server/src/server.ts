import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyCookie from '@fastify/cookie';
import crypto from 'node:crypto';
import pg from 'pg';
const { Pool } = pg;

import productRoutes from './routes/products.js';
import cartRoutes from './routes/cart.js';
import paymentRoutes from './routes/payment.js';
import orderRoutes from './routes/orders.js';
import telegramRoutes from './routes/telegram.js';
import dotenv from 'dotenv';

import { setupWebSocket } from './wsServer.js';
import { Server } from 'node:http';
import { TelegramBot } from './utils/telegram-bot.js';

// Загружаем конфигурацию из файла .env
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: envFile });

// Создаем экземпляр Fastify
const fastify: FastifyInstance = Fastify({
  logger: { level: 'info' },
});

// Создаем пул соединений с базой данных
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432'),
});

// Инициализируем Telegram бота
const telegramBot = new TelegramBot(fastify, pool);

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

// Делаем pool доступным через декоратор
fastify.decorate('pool', pool);

// Делаем telegramBot доступным через декоратор
fastify.decorate('telegramBot', telegramBot);

// Регистрируем маршруты
fastify.register(productRoutes, { prefix: '/api' });
fastify.register(cartRoutes, { prefix: '/api' });
fastify.register(paymentRoutes, { prefix: '/api' });
fastify.register(orderRoutes, { prefix: '/api' });

// Регистрируем маршруты для Telegram
fastify.register(async (instance) => {
  await telegramRoutes(instance, telegramBot);
}, { prefix: '/api' });

// Глобальный обработчик запросов для создания сессии
fastify.addHook('onRequest', (req: FastifyRequest, reply: FastifyReply, done) => {
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

// Обработчик при остановке сервера
fastify.addHook('onClose', async () => {
  // Закрываем соединение с базой данных
  await pool.end();
});

// Настройки сервера
const PORT = 3000;
const HOST = "0.0.0.0";

// Запуск сервера
const start = async (): Promise<void> => {
  try {
    const server = await fastify.listen({ port: PORT, host: HOST });
    setupWebSocket(fastify.server as Server);
    fastify.log.info(`Server is running at ${server}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start(); 