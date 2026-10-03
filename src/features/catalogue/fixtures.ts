import type { Department, ProductDetail } from './types'
// Explicit development data. Never an automatic fallback for a Directus outage.
export const fixtureDepartments: Department[] = [
  { slug: 'women', name: 'Women', description: 'A considered wardrobe. Pieces for every day.', sort: 1 },
  { slug: 'men', name: 'Men', description: 'Modern essentials, thoughtfully selected.', sort: 2 },
  { slug: 'tech', name: 'Technology', description: 'Useful technology for the way you live.', sort: 3 },
  { slug: 'home', name: 'Home', description: 'Considered objects for everyday living.', sort: 4 },
]
export const fixtureProducts: ProductDetail[] = [
  { id: 'demo-shirt', slug: 'everyday-shirt', name: 'Everyday cotton shirt', brand: 'Avenue Studio (demo)', status: 'published', departments: ['women', 'men'], category: 'clothing', productType: 'clothing', description: 'A relaxed cotton shirt with a clean silhouette. Fictitious sample for testing the new storefront.', attributes: { Material: 'Cotton', Fit: 'Relaxed' }, options: { Colour: ['Red', 'Blue'], Size: ['S', 'L'] }, media: [], variants: [
    { sku: 'DEMO-SHIRT-RS', options: { Colour: 'Red', Size: 'S' }, priceMinor: 650000, currency: 'PKR', available: true },
    { sku: 'DEMO-SHIRT-BL', options: { Colour: 'Blue', Size: 'L' }, priceMinor: 650000, currency: 'PKR', available: true },
  ] },
  { id: 'demo-phone', slug: 'everyday-phone', name: 'Everyday smartphone', brand: 'Avenue Devices (demo)', status: 'published', departments: ['tech'], category: 'phones', productType: 'phone', description: 'Fictitious phone for validating storage options, filters, and technical specifications.', attributes: { Display: '6.1 inches', Connectivity: '5G' }, options: { Storage: ['128 GB', '256 GB'], Colour: ['Graphite'] }, media: [], variants: [
    { sku: 'DEMO-PHONE-128', options: { Storage: '128 GB', Colour: 'Graphite' }, priceMinor: 9500000, currency: 'PKR', available: true },
    { sku: 'DEMO-PHONE-256', options: { Storage: '256 GB', Colour: 'Graphite' }, priceMinor: 11500000, currency: 'PKR', available: false },
  ] },
  { id: 'demo-appliance', slug: 'compact-air-purifier', name: 'Compact air purifier', brand: 'Avenue Living (demo)', status: 'published', departments: ['home'], category: 'appliances', productType: 'appliance', description: 'Fictitious appliance for validating specification-led product details.', attributes: { Dimensions: '30 × 30 × 50 cm', Power: '45 W', Finish: 'White' }, options: {}, media: [], variants: [{ sku: 'DEMO-AIR-01', options: {}, priceMinor: 2850000, currency: 'PKR', available: true }] },
  { id: 'demo-draft', slug: 'unreleased-shirt', name: 'Unreleased shirt', brand: 'Avenue Studio (demo)', status: 'draft', departments: ['women'], category: 'clothing', productType: 'clothing', description: 'This draft must never be visible.', attributes: {}, options: {}, media: [], variants: [{ sku: 'DEMO-DRAFT', options: {}, priceMinor: 10000, currency: 'PKR', available: true }] },
]
