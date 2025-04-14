import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage, Server } from 'node:http';
import { carts } from './storage/carts.js';

export const clients: Map<string, Set<WebSocket>> = new Map();

export function setupWebSocket(server: Server): void {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    const sessionId = req.headers.cookie?.match(/sessionId=([^;]*)/)?.[1];

    if (!sessionId) {
      ws.close();
      return;
    }

    if (!clients.has(sessionId)) {
      clients.set(sessionId, new Set());
    }
    clients.get(sessionId)?.add(ws);
  
    ws.on('close', () => {
      const sessionClients = clients.get(sessionId);
      if (sessionClients) {
        sessionClients.delete(ws);
        if (sessionClients.size === 0) {
          clients.delete(sessionId);
        }
      }
    });
  });
}

export async function broadcastCartUpdate(sessionId: string): Promise<void> {
  const userCart = carts.get(sessionId) || [];

  const cartData = JSON.stringify({ cart: userCart });

  try {
    const sessionClients = clients.get(sessionId);
    if (sessionClients && sessionClients.size > 0) {
      sessionClients.forEach(client => {
        try {
          client.send(cartData);
        } catch (error) {
          console.error('Error sending to one client:', error);
        }
      });
    }
  } catch (error) {
    console.error('Error broadcasting cart update:', error);
  }
} 