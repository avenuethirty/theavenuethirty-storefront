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

export const PRODUCTS: Product[] = [];

export const INGREDIENTS: import("../types").IngredientInfo[] = [];
export const CLINICAL_RESULTS: import("../types").ClinicalResult[] = [];
export const DOCTORS: { name: string; title: string; affiliation: string; imageUrl: string; bio: string }[] = [];
