import pool from '../db.js';
import { carts } from '../storage/carts.js';
async function createOrder(sessionId, orderData) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        // Получаем корзину пользователя
        const cartItems = orderData.cartItems.length > 0
            ? orderData.cartItems
            : (carts.get(sessionId) || []);
        if (cartItems.length === 0) {
            throw new Error('Cart is empty');
        }
        // Создаем заказ в таблице orders
        const orderResult = await client.query(`INSERT INTO orders (
        user_id, 
        total_amount, 
        status, 
        delivery_type, 
        full_name, 
        email, 
        phone, 
        city, 
        address, 
        comment, 
        payment_method
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id`, [
            sessionId,
            orderData.totalAmount,
            'pending',
            orderData.deliveryType,
            orderData.fullName,
            orderData.email,
            orderData.phone,
            orderData.city,
            orderData.address,
            orderData.comment || '',
            orderData.paymentMethod
        ]);
        const orderId = orderResult.rows[0].id;
        // Сохраняем товары заказа в таблицу order_items
        for (const item of cartItems) {
            await client.query(`INSERT INTO order_items (
          order_id, 
          product_id, 
          quantity, 
          price
        ) VALUES ($1, $2, $3, $4)`, [orderId, item.productId, item.quantity, item.price]);
        }
        // Очищаем корзину пользователя
        carts.set(sessionId, []);
        await client.query('COMMIT');
        return {
            orderId,
            message: 'Order created successfully'
        };
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating order:', error);
        throw error;
    }
    finally {
        client.release();
    }
}
async function getOrders(userId) {
    try {
        const result = await pool.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
        return result.rows;
    }
    catch (error) {
        console.error('Error getting orders:', error);
        throw error;
    }
}
export default {
    createOrder,
    getOrders
};
//# sourceMappingURL=orderService.js.map