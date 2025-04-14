import pool from '../db.js';
async function getProducts() {
    try {
        const result = await pool.query('SELECT * FROM products');
        return result.rows;
    }
    catch (error) {
        console.error('Ошибка при получении товаров:', error);
        throw error;
    }
}
async function getProductById(id) {
    try {
        const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
        return result.rows[0];
    }
    catch (error) {
        console.error(`Ошибка при получении товара с ID ${id}:`, error);
        throw error;
    }
}
export default { getProducts, getProductById };
//# sourceMappingURL=productService.js.map