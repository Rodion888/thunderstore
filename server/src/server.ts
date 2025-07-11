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
import deploymentRoutes from './routes/deployment.js';
import dotenv from 'dotenv';

import { setupWebSocket } from './wsServer.js';
import { Server } from 'node:http';
import { TelegramBot } from './utils/telegram-bot.js';

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: envFile });

const fastify: FastifyInstance = Fastify({
  logger: { level: 'info' },
});

const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432'),
});

const telegramBot = new TelegramBot(fastify);

fastify.setErrorHandler(async (error, request, reply) => {
  fastify.log.error(error);
  
  const statusCode = error.statusCode || 500;
  if (statusCode >= 500) {
    telegramBot.sendErrorNotification(
      error.message,
      `${request.method} ${request.url}`
    );
  }
  
  return reply.status(statusCode).send({
    error: 'Internal Server Error',
    message: error.message
  });
});

const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:4200';

const getAllowedOrigins = () => {
  if (process.env.NODE_ENV === 'development') {
    return ['http://localhost:4200', 'http://localhost:4000'];
  }
  return CORS_ORIGIN;
};

fastify.register(fastifyCors, {
  origin: getAllowedOrigins(),
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});

fastify.register(fastifyCookie);

fastify.decorate('pool', pool);
fastify.decorate('telegramBot', telegramBot);

fastify.register(productRoutes, { prefix: '/api' });
fastify.register(cartRoutes, { prefix: '/api' });
fastify.register(paymentRoutes, { prefix: '/api' });
fastify.register(orderRoutes, { prefix: '/api' });
fastify.register(deploymentRoutes, { prefix: '/api' });

fastify.register(async (instance) => {
  await telegramRoutes(instance, telegramBot);
}, { prefix: '/api' });

fastify.get('/api/health', async (request, reply) => {
  return reply.send({ status: 'ok' });
});

fastify.addHook('onRequest', (req: FastifyRequest, reply: FastifyReply, done) => {
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

fastify.addHook('onClose', async () => {
  await pool.end();
});

const PORT = 3000;
const HOST = "0.0.0.0";

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