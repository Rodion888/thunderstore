export type ProductType = "t-shirt" | "shorts";

export interface ProductBase {
  id: number;
  name: string;
  images: {
    front: string;
    back: string;
  };
  price: number;
}

export interface Product extends ProductBase {
  type: ProductType;
  stock: Record<string, number>;
}