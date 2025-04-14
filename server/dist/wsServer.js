import { WebSocketServer } from 'ws';
import { carts } from './storage/carts.js';
// Используем Map для хранения информации о подключенных клиентах
export const clients = new Map();
// Импортируем Map корзин (заглушка для TypeScript, нужно будет создать отдельный файл для хранения)
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
        const client = clients.get(sessionId);
        if (client) {
            client.send(cartData);
        }
    }
    catch (error) {
        console.error('Error update WebSocket:', error);
    }
}
//# sourceMappingURL=wsServer.js.map