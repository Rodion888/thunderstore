import { CartItem } from './cart.types';

export enum DeliveryType {
  PICKUP = 'pickup',
  COURIER = 'courier',
  CDEK = 'cdek',
}

export enum PaymentMethod {
  ONLINE = 'Онлайн',
  CRYPTO = 'Криптовалюта',
}

export interface OrderData {
  deliveryType: DeliveryType;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  comment?: string;
  paymentMethod: PaymentMethod;
}

export interface OrderPayload extends OrderData {
  cartItems: CartItem[];
  totalAmount: number;
}

export interface OrderResponse {
  message: string;
  orderId: number;
} 