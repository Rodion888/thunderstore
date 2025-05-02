export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  type?: string;
  category?: string;
  stock?: Record<string, number>;
  images: {
    front: string;
    back: string;
  };
  frontImageName?: string;
  backImageName?: string;
}

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  size: string;
  images: {
    front: string;
    back: string;
  };
}

export interface Order {
  id: number;
  user_id: string;
  items: CartItem[];
  total_amount: number;
  status: string;
  created_at: Date;
  delivery_type: string;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  comment?: string;
  payment_method: string;
}

export interface OrderPayload {
  deliveryType: string;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  comment?: string;
  paymentMethod: string;
  cartItems: CartItem[];
  totalAmount: number;
} 