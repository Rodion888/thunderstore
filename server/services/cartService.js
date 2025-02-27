import { loadProducts, updateProductsFile } from './productService.js';
import { broadcastCartUpdate } from '../wsServer.js';

import carts from '../storage/storages/cartsStorage.js';

export async function addToCart(sessionId, productId, size, quantity) {
  const products = await loadProducts();
  const product = products.find(p => p.id === productId);

  product.stock[size] -= quantity;
  await updateProductsFile(products);

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

export async function removeFromCart(sessionId, productId, size, quantity) {
  const products = await loadProducts();
  const product = products.find(p => p.id === productId);

  product.stock[size] += quantity;
  await updateProductsFile(products);

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

export async function clearCart(sessionId) {
  const userCart = carts.get(sessionId) || [];
  const products = await loadProducts();

  userCart.forEach(item => {
    const product = products.find(p => p.id === item.id);
    if (product && product.stock[item.size] !== undefined) {
      product.stock[item.size] += item.quantity;
    }
  });

  await updateProductsFile(products);

  carts.set(sessionId, []);

  broadcastCartUpdate(sessionId);
}
