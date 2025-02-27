import { WebSocketServer } from 'ws';

import carts from './storage/storages/cartsStorage.js';

export const clients = new Map();

export function setupWebSocket(server) {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws, req) => {
    const sessionId = req.headers.cookie?.match(/sessionId=([^;]*)/)?.[1];

    if (!sessionId) {
      ws.close();
      return;
    }
  
    clients.set(sessionId, ws);
  
    ws.on('close', () => {
      clients.delete(sessionId);
    });
  });
}

export async function broadcastCartUpdate(sessionId) {
  const userCart = carts.get(sessionId) || [];

  const cartData = JSON.stringify({ cart: userCart });

  try {
    clients.get(sessionId).send(cartData);
  } catch (error) {
    console.error('Error update WebSocket:', error);
  }
}

