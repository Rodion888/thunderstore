import pool from '../db.js';
const SIZE_ORDER = ['S', 'M', 'L', 'XL'];
function orderStockSizes(product) {
    if (!product.stock)
        return product;
    const orderedStock = {};
    SIZE_ORDER.forEach(size => {
        if (product.stock && size in product.stock) {
            orderedStock[size] = product.stock[size];
        }
    });
    product.stock = orderedStock;
    return product;
}
async function getProducts() {
    try {
        const result = await pool.query('SELECT * FROM products');
        return result.rows.map(orderStockSizes);
    }
    catch (error) {
        console.error('Ошибка при получении товаров:', error);
        throw error;
    }
}
async function getProductById(id) {
    try {
        const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
        if (result.rows.length === 0)
            return undefined;
        return orderStockSizes(result.rows[0]);
    }
    catch (error) {
        console.error(`Ошибка при получении товара с ID ${id}:`, error);
        throw error;
    }
}
export default { getProducts, getProductById };
//# sourceMappingURL=productService.js.map