export interface MediaAsset { path: string; alt: string; width: number; height: number }
export interface Variant { sku: string; options: Record<string, string>; priceMinor: number; compareAtMinor?: number; currency: 'PKR'; available: boolean }
export interface ProductDetail {
  id: string; slug: string; name: string; brand: string; status: 'draft' | 'published' | 'archived';
  departments: string[]; category: string; productType: string; description: string;
  attributes: Record<string, string>; options: Record<string, string[]>; variants: Variant[]; media: MediaAsset[];
}
export interface Department { slug: string; name: string; description: string; sort: number }
export interface CatalogueQuery { department?: string; category?: string; q?: string; filters?: Record<string, string[]>; sort?: 'featured' | 'price-asc' | 'price-desc'; page?: number; pageSize?: number }
export interface CataloguePage { items: ProductDetail[]; total: number; page: number; pageSize: number; facets: Record<string, { value: string; count: number }[]> }
