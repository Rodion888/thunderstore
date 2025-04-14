import pool from '../db.js';

import { CartItem, OrderPayload } from '../types/index.js';

async function createOrder(sessionId: string, orderData: OrderPayload, cartItems: CartItem[], totalAmount: number): Promise<number> {
  try {
    const { deliveryType, fullName, phone, email, city, address, comment, paymentMethod } = orderData;
    const items = JSON.stringify(cartItems);

    const result = await pool.query(
      `INSERT INTO orders (
        user_session_id, 
        total_amount, 
        items, 
        delivery_type, 
        full_name, 
        phone, 
        email, 
        city, 
        address, 
        comment, 
        payment_method, 
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id`,
      [sessionId, totalAmount, items, deliveryType, fullName, phone, email, city, address, comment, paymentMethod, 'processing']
    );
    return result.rows[0].id;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

async function decreaseStock(cartItems: CartItem[]): Promise<void> {
  try {
    for (const item of cartItems) {
      const result = await pool.query(
        `SELECT stock FROM products WHERE id = $1`,
        [item.id]
      );

      if (
        result.rows.length > 0 &&
        result.rows[0].stock &&
        result.rows[0].stock[item.size] !== undefined
      ) {
        const currentStock = parseInt(result.rows[0].stock[item.size], 10);
        const newStock = currentStock - item.quantity;

        await pool.query(
          `UPDATE products
           SET stock = jsonb_set(stock, $1, $2::jsonb)
           WHERE id = $3`,
          [
            `{${item.size}}`,
            JSON.stringify(newStock),
            item.id,
          ]
        );
      } else {
        console.warn(
          `Warning: Stock for product ${item.id} size ${item.size} not found or invalid.`
        );
      }
    }
  } catch (error) {
    console.error('Error decreasing stock:', error);
    throw error;
  }
}

async function validateCartItems(cartItems: CartItem[]): Promise<{ isValid: boolean; message?: string }> {
  try {
    for (const item of cartItems) {
      const result = await pool.query(
        `SELECT stock FROM products WHERE id = $1`,
        [item.id]
      );
      if (result.rows.length === 0) {
        return { isValid: false, message: `Product with ID ${item.id} not found.` };
      }
      const currentStock = result.rows[0].stock[item.size];
      if (currentStock === undefined || currentStock < item.quantity) {
        return { isValid: false, message: `Not enough product "${item.name}" size ${item.size} (available: ${currentStock || 0}, requested: ${item.quantity}).` };
      }
    }
    return { isValid: true };
  } catch (error) {
    console.error('Error validating cart:', error);
    return { isValid: false, message: 'Error validating cart.' };
  }
}

export default { createOrder, decreaseStock, validateCartItems }; 