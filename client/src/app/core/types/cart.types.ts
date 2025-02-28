import { ProductBase } from "./product.types";

export interface CartItem extends ProductBase {
  size: string;
  quantity: number;
}
