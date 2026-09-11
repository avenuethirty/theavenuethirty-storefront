import { Product } from "../types";
import accessoriesCsv from "../assets/catalogue_csv/accessories_jewellery_100_products.csv?raw";

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(current.trim());
      current = "";
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      row.push(current.trim());
      if (row.length > 1 || row[0] !== "") {
        rows.push(row);
      }
      row = [];
      current = "";
      if (char === '\r' && text[i + 1] === '\n') {
        i++;
      }
    } else {
      current += char;
    }
  }

  if (current || row.length > 0) {
    row.push(current.trim());
    if (row.length > 1 || row[0] !== "") {
      rows.push(row);
    }
  }

  return rows;
}

const csvRows = parseCsv(accessoriesCsv);
const header = csvRows[0];
const nameIdx = header.indexOf("Name");
const skuIdx = header.indexOf("SKU");
const descIdx = header.indexOf("Product description");
const vendorIdx = header.indexOf("Vendor");
const brandIdx = header.indexOf("Brand");
const typeIdx = header.indexOf("Type");
const priceIdx = header.indexOf("Unit price");
const imageIdx = header.indexOf("Image Url");
const urlIdx = header.indexOf("URL");

const accessoriesProducts: Product[] = csvRows.slice(1).map((row) => {
  const name = row[nameIdx] || "";
  const sku = row[skuIdx] || String(Math.random());
  const description = row[descIdx] || "";
  const vendor = row[vendorIdx] || "";
  const brand = row[brandIdx] || "";
  const type = row[typeIdx] || "";
  const price = Number(row[priceIdx]) || 0;
  const imageUrl = row[imageIdx] || "";
  const url = row[urlIdx] || "";

  const descriptionParts = [description, vendor, brand].filter(Boolean);
  const fullDescription = descriptionParts.join(". ");

  return {
    id: String(sku),
    name,
    category: "accessories" as const,
    tagline: type,
    priceMonthly: price,
    imageUrl: imageUrl || url,
    description: fullDescription || name,
  };
});

export const HERO_IMAGE_VARIANTS = [
  {
    id: "skin-close-up",
    label: "Natural Skin Profile",
    url: "https://images.pexels.com/photos/5938645/pexels-photo-5938645.jpeg",
    caption: "Real skin texture showing natural freckles and barrier health"
  },
  {
    id: "bottle-studio",
    label: "Custom Rx Dropper Bottle",
    url: "https://images.unsplash.com/photo-1608248597379-8acbf0c69128?auto=format&fit=crop&w=2000&q=85",
    caption: "Bespoke medical-grade amber glass serum compound"
  },
  {
    id: "cream-texture",
    label: "Clinical Cream Texture",
    url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=2000&q=85",
    caption: "Ultra-nourishing lipid-replenishing barrier formulation"
  }
];

export const PRODUCTS: Product[] = [
  {
    id: "av30-tea-tree-facewash",
    name: "Brighten Me Up Facewash",
    category: "skincare_beauty",
    tagline: "Purify and brighten with tea tree and niacinamide.",
    priceMonthly: 19.99,
    imageUrl: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=800&q=85",
    keyIngredients: ["Tea Tree Oil", "Niacinamide", "Salicylic Acid"],
    description: "A gentle daily face wash that unclogs pores and brightens dull skin without stripping moisture.",
    bestFor: ["Acne-Prone Skin", "Oily Skin", "Dullness"]
  },
  {
    id: "av30-spf50",
    name: "SPF 50+ Sunscreen",
    category: "skincare_beauty",
    tagline: "Lightweight mineral protection with zero white cast.",
    priceMonthly: 24.00,
    imageUrl: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=800&q=85",
    keyIngredients: ["Zinc Oxide", "Vitamin E", "Hyaluronic Acid"],
    description: "Broad-spectrum mineral SPF that blends clear into all skin tones. Non-greasy, fragrance-free.",
    bestFor: ["Daily UV Shield", "Sensitive Skin", "Hyperpigmentation"]
  },
  {
    id: "av30-glass-skin-bundle",
    name: "Flawless Glass Skin Bundle",
    category: "skincare_beauty",
    tagline: "The complete 3-step routine for dewy, translucent skin.",
    priceMonthly: 45.00,
    imageUrl: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=800&q=85",
    keyIngredients: ["Hyaluronic Acid", "Niacinamide", "Ceramides"],
    description: "Everything you need for the glass skin look: cleanser, serum, and moisturizer in one curated set.",
    bestFor: ["All Skin Types", "Dullness", "Dehydration"]
  },
  {
    id: "av30-luna-beige-bag",
    name: "Luna Beige Structured Bag",
    category: "bags_backpacks",
    tagline: "Minimal structured silhouette in soft beige.",
    priceMonthly: 65.00,
    imageUrl: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=85",
    description: "A structured shoulder bag with clean lines, soft beige vegan leather, and an adjustable strap.",
    bestFor: ["Work & Weekend", "Minimal Style", "Gifting"]
  },
  ...accessoriesProducts
];

export const INGREDIENTS: import("../types").IngredientInfo[] = [];
export const CLINICAL_RESULTS: import("../types").ClinicalResult[] = [];
export const DOCTORS: { name: string; title: string; affiliation: string; imageUrl: string; bio: string }[] = [];
