export interface Product {
  id: string;
  name: string;
  // URL segment, frozen in the sheet's `Slug` column so a title edit can never
  // orphan a URL. Always use productPath() rather than assembling one.
  slug: string;
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
  availability?: string;
  priceMonthly: number;
  originalPrice?: number;
  imageUrl: string;
  imageUrl2?: string;
  description: string;
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
