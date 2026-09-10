import { Product } from "../types";

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
    rating: 4.8,
    reviewsCount: 1240,
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
    rating: 4.9,
    reviewsCount: 2180,
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
    rating: 5.0,
    reviewsCount: 890,
    imageUrl: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=800&q=85",
    keyIngredients: ["Hyaluronic Acid", "Niacinamide", "Ceramides"],
    description: "Everything you need for the glass skin look: cleanser, serum, and moisturizer in one curated set.",
    bestFor: ["All Skin Types", "Dullness", "Dehydration"]
  },
  {
    id: "av30-dawn-link-bracelet",
    name: "Dawn Link Minimal Delicate Bracelet",
    category: "accessories",
    tagline: "Fine-link chain bracelet in warm gold-plated finish.",
    priceMonthly: 32.00,
    rating: 4.7,
    reviewsCount: 340,
    imageUrl: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=800&q=85",
    description: "A delicate everyday bracelet with a minimal link design. Water-resistant and tarnish-resistant finish.",
    bestFor: ["Everyday Wear", "Gifting", "Minimal Style"]
  },
  {
    id: "av30-luna-beige-bag",
    name: "Luna Beige Structured Bag",
    category: "bags_backpacks",
    tagline: "Minimal structured silhouette in soft beige.",
    priceMonthly: 65.00,
    rating: 4.8,
    reviewsCount: 210,
    imageUrl: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=800&q=85",
    description: "A structured shoulder bag with clean lines, soft beige vegan leather, and an adjustable strap.",
    bestFor: ["Work & Weekend", "Minimal Style", "Gifting"]
  },
  {
    id: "av30-silky-hair-scrunchie",
    name: "Silky Hair Scrunchie Set",
    category: "accessories",
    tagline: "Satin scrunchies that protect hair and sleep style.",
    priceMonthly: 12.00,
    rating: 4.6,
    reviewsCount: 560,
    imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=85",
    description: "Set of 3 satin scrunchies that reduce friction, prevent breakage, and keep overnight styles intact.",
    bestFor: ["Hair Care", "Sleep", "Gifting"]
  }
];

export const INGREDIENTS: import("../types").IngredientInfo[] = [];
export const CLINICAL_RESULTS: import("../types").ClinicalResult[] = [];
export const DOCTORS: { name: string; title: string; affiliation: string; imageUrl: string; bio: string }[] = [];
