import Fastify from 'fastify';
import cors from '@fastify/cors';
import FastifyStatic from '@fastify/static';
import FastifyCookie from '@fastify/cookie';
import path from 'path';
import crypto from 'crypto';
import productRoutes from './routes/products.js';
import cartRoutes from './routes/cart.js';
import paymentRoutes from './routes/payment.js';

import { setupWebSocket } from './wsServer.js';
import { fileURLToPath } from 'url';

import dotenv from 'dotenv';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({ logger: { level: 'info' } });
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:4200';

fastify.register(cors, {
  origin: CORS_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});

fastify.register(FastifyCookie);
fastify.register(FastifyStatic, { root: path.join(__dirname, 'storage/images'), prefix: '/static/' });
fastify.register(productRoutes);
fastify.register(cartRoutes);
fastify.register(paymentRoutes);

fastify.addHook('onRequest', (req, reply, done) => {
  if (!req.cookies.sessionId) {
    const sessionId = crypto.randomUUID();
    reply.setCookie('sessionId', sessionId, {
      path: '/',
      httpOnly: true,
      sameSite: 'strict'
    });
  }
  done();
});

const PORT = 3000;
const HOST = "0.0.0.0";

const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: HOST });
    console.log(`🚀 Server running at http://${HOST}:${PORT}`);
    setupWebSocket(fastify.server);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
