import { Product } from '../types';

export async function fetchCatalogue(): Promise<Product[]> {
  try {
    const res = await fetch('/api/catalogue');
    if (!res.ok) throw new Error(`Failed to fetch catalogue: ${res.status}`);
    const data = await res.json();
    return data.products || [];
  } catch {
    return [];
  }
}
