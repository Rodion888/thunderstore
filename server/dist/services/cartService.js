import { carts } from '../storage/carts.js';
import { broadcastCartUpdate } from '../wsServer.js';
import pool from '../db.js';
async function getCartItems(sessionId) {
    const cart = carts.get(sessionId) || [];
    return cart;
}
async function addToCart(sessionId, productId, quantity) {
    try {
        const result = await pool.query('SELECT * FROM products WHERE id = $1', [productId]);
        const product = result.rows[0];
        if (!product) {
            throw new Error('Product not found');
        }
        let cart = carts.get(sessionId) || [];
        const existingItem = cart.find(item => item.productId === productId);
        if (existingItem) {
            existingItem.quantity += quantity;
        }
        else {
            cart.push({
                id: Date.now(), // Генерируем временный ID
                productId,
                name: product.name,
                price: product.price,
                quantity,
                image_url: product.image_url
            });
        }
        carts.set(sessionId, cart);
        await broadcastCartUpdate(sessionId);
        return cart;
    }
    catch (error) {
        console.error('Error adding item to cart:', error);
        throw error;
    }
}
async function updateCartItem(sessionId, itemId, quantity) {
    const cart = carts.get(sessionId) || [];
    const itemIndex = cart.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
        throw new Error('Item not found in cart');
    }
    cart[itemIndex].quantity = quantity;
    carts.set(sessionId, cart);
    await broadcastCartUpdate(sessionId);
    return cart;
}
async function removeFromCart(sessionId, itemId) {
    let cart = carts.get(sessionId) || [];
    cart = cart.filter(item => item.id !== itemId);
    carts.set(sessionId, cart);
    await broadcastCartUpdate(sessionId);
    return cart;
}
export default {
    getCartItems,
    addToCart,
    updateCartItem,
    removeFromCart
};
//# sourceMappingURL=cartService.js.map