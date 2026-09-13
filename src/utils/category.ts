import { SHOP_CONFIG } from "../config/shop";

export type CategoryKey = "clothing_apparel" | "skincare_beauty" | "bags_backpacks" | "accessories" | "toys_kids";

export interface CategoryInfo {
  key: CategoryKey;
  label: string;
  subCategories: { name: string; href: string }[];
}

export const CATEGORIES: CategoryInfo[] = [
  {
    key: "clothing_apparel",
    label: "Clothing & Apparel",
    subCategories: [
      { name: "Ready-to-Wear / Outfits", href: "#clothing_ready_to_wear" },
      { name: "3 Piece Sets", href: "#clothing_3_piece" },
      { name: "4 Piece Sets", href: "#clothing_4_piece" },
      { name: "Stock Clearance", href: "#clothing_clearance" },
      { name: "Seasonal", href: "#clothing_seasonal" },
    ],
  },
  {
    key: "skincare_beauty",
    label: "Skincare & Beauty",
    subCategories: [
      { name: "Cleansers & Toners", href: "#skincare_cleansers" },
      { name: "Serums & Treatments", href: "#skincare_serums" },
      { name: "Sun & Daily Protection", href: "#skincare_sun" },
      { name: "Hair & Personal Care", href: "#skincare_hair" },
    ],
  },
  {
    key: "bags_backpacks",
    label: "Bags & Backpacks",
    subCategories: [
      { name: "Handbags & Totes", href: "#bags_handbags" },
      { name: "Crossbody & Shoulder", href: "#bags_crossbody" },
      { name: "Wallets", href: "#bags_wallets" },
      { name: "Backpacks & Office", href: "#bags_backpacks_office" },
      { name: "Travel", href: "#bags_travel" },
      { name: "Laptop", href: "#bags_laptop" },
    ],
  },
  {
    key: "accessories",
    label: "Accessories & Jewellery",
    subCategories: [
      { name: "Everyday Jewellery", href: "#accessories_everyday" },
      { name: "Rings", href: "#accessories_rings" },
      { name: "Bracelets", href: "#accessories_bracelets" },
      { name: "Chains & Pendants", href: "#accessories_chains" },
      { name: "Traditional & Statement", href: "#accessories_traditional" },
      { name: "Sheesh Patti", href: "#accessories_sheesh_patti" },
      { name: "Kundan", href: "#accessories_kundan" },
      { name: "Chokers", href: "#accessories_chokers" },
      { name: "Anklets", href: "#accessories_anklets" },
      { name: "Customized", href: "#accessories_customized" },
      { name: "Name Necklaces", href: "#accessories_name_necklaces" },
      { name: "Initial Charms", href: "#accessories_initial_charms" },
    ],
  },
  {
    key: "toys_kids",
    label: "Toys & Kids",
    subCategories: [
      { name: "Games & Puzzles", href: "#kids_games" },
      { name: "Stacking Blocks", href: "#kids_stacking" },
      { name: "Tower Games", href: "#kids_tower" },
      { name: "STEM & Learning", href: "#kids_stem" },
      { name: "Excavation Kits", href: "#kids_excavation" },
      { name: "Science Sets", href: "#kids_science" },
      { name: "Block Flowers", href: "#kids_block_flowers" },
      { name: "Action & Outdoor", href: "#kids_action" },
      { name: "Drones", href: "#kids_drones" },
      { name: "RC Ships", href: "#kids_rc_ships" },
      { name: "Launcher Toys", href: "#kids_launchers" },
    ],
  },
];

export function getCategoryBySlug(slug: string): CategoryInfo | undefined {
  return CATEGORIES.find((c) => c.key === slug);
}

export function getCategoryLabel(slug: string): string {
  const configured = SHOP_CONFIG.categories.find(
    (c) => c.slug === slug
  );
  return (
    configured?.name ||
    CATEGORIES.find((c) => c.key === slug)?.label ||
    slug
  );
}
