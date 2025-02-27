import fs from 'fs/promises';
import path from 'path';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const productsFilePath = path.join(__dirname, '../storage/products.json');

export async function loadProducts() {
  try {
    const data = await fs.readFile(productsFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading products.json:', error);
    return [];
  }
}

export async function updateProductsFile(products) {
  try {
    await fs.writeFile(productsFilePath, JSON.stringify(products, null, 2));
  } catch (error) {
    console.error('Error update products.json:', error);
  }
}

export async function getProductById(id) {
  const products = await loadProducts();
  return products.find(p => p.id === Number(id)) || null;
}
