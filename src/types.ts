export interface Product {
  id: string;
  name: string;
  category: "clothing_apparel" | "skincare_beauty" | "bags_backpacks" | "accessories" | "toys_kids";
  tagline: string;
  priceMonthly: number;
  rating: number;
  reviewsCount: number;
  imageUrl: string;
  keyIngredients?: string[];
  description: string;
  bestFor?: string[];
}

export interface IngredientInfo {
  name: string;
  type: string;
  benefits: string[];
  strength: string;
  clinicalNote: string;
}

export interface ConsultationState {
  concern: string;
  skinType: string;
  sensitivity: string;
  goals: string[];
  ageGroup: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  customFormulaName?: string;
  frequency: "Monthly" | "Every 2 Months";
}

export interface ClinicalResult {
  id: string;
  patientName: string;
  concern: string;
  timeframe: string;
  beforeImg: string;
  afterImg: string;
  quote: string;
  doctorNote: string;
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
