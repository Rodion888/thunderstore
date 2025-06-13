import { WebSocketServer } from 'ws';
import { carts } from './storage/carts.js';
export const clients = new Map();
export function setupWebSocket(server) {
    const wss = new WebSocketServer({ server });
    wss.on('connection', (ws, req) => {
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
export async function broadcastCartUpdate(sessionId) {
    const userCart = carts.get(sessionId) || [];
    const cartData = JSON.stringify({ cart: userCart });
    try {
        const sessionClients = clients.get(sessionId);
        if (sessionClients && sessionClients.size > 0) {
            sessionClients.forEach(client => {
                try {
                    client.send(cartData);
                }
                catch (error) {
                    console.error('Error sending to one client:', error);
                }
            });
        }
    }
    catch (error) {
        console.error('Error broadcasting cart update:', error);
    }
}
//# sourceMappingURL=wsServer.js.map