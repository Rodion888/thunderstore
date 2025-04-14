import { CartItem } from '../types/index.js';

// Используем Map для хранения корзин пользователей
export const carts: Map<string, CartItem[]> = new Map(); 