import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

import { fileURLToPath } from 'url';

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: envFile });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const productsFilePath = path.join(__dirname, '../storage/products.json');
// const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';

export async function loadProducts() {
  try {
    const data = await fs.readFile(productsFilePath, 'utf-8');
    const products = JSON.parse(data);

    const mapedProducts = products.map(product => ({
      ...product,
      images: {
        front: product.images.front,
        back: product.images.back,
      }
    }));

    return mapedProducts
  } catch (error) {
    console.error('Error loading products.json:', error);
    return [];
  }
}

export async function updateProductsFile(products) {
  try {
    await fs.writeFile(productsFilePath, JSON.stringify(products, null, 2));
  } catch (error) {
    console.error('Error updating products.json:', error);
  }
}

export async function getProductById(id) {
  const products = await loadProducts();
  return products.find(p => p.id === Number(id)) || null;
}
