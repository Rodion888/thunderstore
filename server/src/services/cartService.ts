import productService from './productService.js';

import { broadcastCartUpdate } from '../wsServer.js';
import { carts } from '../storage/carts.js';
import { Product } from '../types/index.js';

export async function addToCart(sessionId: string, productId: number, size: string, quantity: number): Promise<Product> {
  const products = await productService.getProducts();
  const product = products.find(p => p.id === productId);

  if (!product) {
    throw new Error('Product not found');
  }

  let userCart = carts.get(sessionId) || [];

  const existingItem = userCart.find(item => item.id === productId && item.size === size);
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    userCart.push({
      id: product.id,
      name: product.name,
      images: product.images,
      price: product.price,
      size,
      quantity,
    });
  }

  carts.set(sessionId, userCart);
  broadcastCartUpdate(sessionId);

  return product;
}

export async function removeFromCart(sessionId: string, productId: number, size: string, quantity: number): Promise<Product> {
  const products = await productService.getProducts();
  const product = products.find(p => p.id === productId);

  if (!product) {
    throw new Error('Product not found');
  }

  let userCart = carts.get(sessionId) || [];

  const existingItemIndex = userCart.findIndex(item => item.id === productId && item.size === size);

  if (existingItemIndex !== -1) {
    const existingItem = userCart[existingItemIndex];
    if (existingItem.quantity > 1) {
      existingItem.quantity -= 1;
    } else {
      userCart.splice(existingItemIndex, 1);
    }
  }

  carts.set(sessionId, userCart);
  broadcastCartUpdate(sessionId);

  return product;
}

export async function clearCart(sessionId: string): Promise<void> {
  carts.set(sessionId, []);
  broadcastCartUpdate(sessionId);
}
