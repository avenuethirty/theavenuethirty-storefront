export interface Product {
  id: string;
  name: string;
  category:
    | "clothing_apparel"
    | "skincare_beauty"
    | "bags_backpacks"
    | "accessories"
    | "toys_kids"
    | "skincare"
    | "bags"
    | "jewellery"
    | "toys";
  tagline: string;
  typeSlug?: string;
  priceMonthly: number;
  originalPrice?: number;
  rating?: number;
  reviewsCount?: number;
  imageUrl: string;
  imageUrl2?: string;
  imageUrl3?: string;
  keyIngredients?: string[];
  description: string;
  bestFor?: string[];
  collections?: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  customFormulaName?: string;
  frequency: "Monthly" | "Every 2 Months";
}

export interface GuestDetails {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  notes?: string;
}

export interface GuestOrder {
  orderId: string;
  items: CartItem[];
  total: number;
  guest: GuestDetails;
}
