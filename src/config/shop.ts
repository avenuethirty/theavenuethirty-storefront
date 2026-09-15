export interface TypeSectionConfig {
  category: string;
  title?: string;
  format: "cards" | "pills";
  grid?: { mobile: number; tablet: number; desktop: number };
  limit?: number;
  types: Record<string, { image?: string; label?: string; order?: number }>;
}

export const SHOP_CONFIG = {
  name: "The Avenue Thirty",
  domain: "theavenuethirty.com",

  // Homepage hero section
  hero: {
    title: "Your Avenue to Confident Living",
    image: "https://i.postimg.cc/5tJ5zYT3/herobg-01.webp",
    video: "", // background video; falls back to image if empty or fails to load
  },

  // Contact
  whatsapp: {
    number: "923331458843",
    defaultMessage: "Hi, I would like to inquire about an order from The Avenue Thirty.",
  },

  // Store & Currency Settings
  localization: {
    currencySymbol: "Rs. ",
    currencyCode: "PKR",
    formatLocale: "en-PK",
  },

  // Logistics & Checkout
  shipping: {
    defaultFee: 240,
    freeShippingThreshold: 5000,
    allowCashOnDelivery: true,
  },

  // Product Listing & Pagination
  catalog: {
    itemsPerPage: 4,
    defaultSort: "featured",
    featuredTag: "featured",
  },

  // Allowed Main Categories for Top Navigation & Filters
  // On DB Product Categories Dropdown should match with the slug to display the products on storefront.
  categories: [
    //{ name: "Clothing & Apparel", slug: "clothing_apparel" },
    { name: "Skincare", slug: "skincare", image: "https://i.postimg.cc/Rh0rgYH1/skincare.webp" },
    { name: "Bags", slug: "bags", image: "https://i.postimg.cc/Xq92cc2G/bags.webp" },
    { name: "Jewellery", slug: "jewellery", image: "https://i.postimg.cc/vZGQn0Ph/jewellery.webp" },
    { name: "Kids", slug: "toys", image: "https://i.postimg.cc/90z9cW9T/toys.webp" },
  ],

  // Homepage categories grid
  categoryGrid: {
    columns: {
      mobile: 2, // cards per row on mobile (< 640px)
      tablet: 2, // cards per row on tablet (>= 640px)
      desktop: 4, // cards per row on desktop (>= 1024px)
    },
    rows: 1, // rows to display: shows first (columns * rows) categories
  },

  // Homepage "Shop by type" sections, one per category. Array order is the
  // homepage order for these sections. Each section renders the category's
  // types (the sheet's Type column) as image cards or pill links that deep-link
  // to /product/:category/:typeSlug. Types sort by product count desc unless
  // pinned via `order`. Entries with no matching products are skipped.
  // Per-type overrides are keyed by type slug (slugified Type column value):
  //   image — custom card image (falls back to the type's first product image)
  //   label — display label override (falls back to the sheet tagline)
  //   order — manual position pin (1 = first); omit for count-desc order
  typeSections: [
    {
      category: "bags",
      title: "Find your bag",
      format: "cards",
      grid: { mobile: 2, tablet: 3, desktop: 8 },
      limit: 8,
      types: {
        handbag: { image: "https://i.postimg.cc/3x3KGtL9/bags-02.webp", label: "Designer Handbags", order: 1 },
        "crossbody-bag": { image: "https://i.postimg.cc/7PcXptGP/crossbody-bag01.webp", label: "Crossbody Bag",},
        "tote-bag": { image: "https://i.postimg.cc/L6xPcn0D/tote-bag.webp", label: "Tote Bag",},
        "wallet-clutch": { image: "https://i.postimg.cc/vmmkMqyr/wallet-03.webp", label: "Wallet & Clutch",},
        backpack: { image: "https://i.postimg.cc/N0Rjcjk3/backpack.webp", label: "Backpack",},
        "duffel-bag": { image: "https://i.postimg.cc/RCWVSddk/duffle-bag.webp", label: "Duffle Bag",},
        "office-bag": { image: "https://i.postimg.cc/rpqwqLZ1/office-bag.webp", label: "Office Bag",},
      },
    },
    {
      category: "jewellery",
      format: "cards",
      grid: { mobile: 2, tablet: 3, desktop: 6 },
      limit: 6,
      types: {},
    },
    {
      category: "toys",
      format: "pills",
      limit: 8,
      types: {},
    },
  ] as TypeSectionConfig[],
 
  // Homepage carousel grids, keyed by section id.
  // Status labels come from the catalogue (Collections column on the sheet):
  // 'Featured', 'Best Seller', 'Trending', 'Sale', 'New Arrival', 'Must-Have Styles', 'Recommended'.
  carouselGrid: {
    "must-have": {
      columns: { mobile: 2, tablet: 2, desktop: 3 },
      rows: 1,
    },
    "best-seller": {
      columns: { mobile: 2, tablet: 2, desktop: 4 },
      rows: 2,
    },
    featured: {
      columns: { mobile: 2, tablet: 3, desktop: 6 },
      rows: 2,
    },
    "on-sale": {
      columns: { mobile: 2, tablet: 2, desktop: 8 },
      rows: 2,
    },
    recommended: {
      columns: { mobile: 2, tablet: 2, desktop: 5 },
      rows: 2,
    },
    trending: {
      columns: { mobile: 2, tablet: 2, desktop: 4 },
      rows: 2,
    },
    "new-arrival": {
      columns: { mobile: 2, tablet: 2, desktop: 4 },
      rows: 2,
    },
  },

 // Social Media Links
  social: {
    instagram: "https://instagram.com/theavenuethirty",
    tiktok: "https://tiktok.com/@theavenuethirty",
    x: "https://x.com/theavenuethirty",
    snapchat: "https://snapchat.com/add/theavenuethirty",
  },

  ai: {
    model: "openai/gpt-oss-20b",
  },

  plp: {
    itemsPerPage: 12,
    gridColumns: { mobile: 2, tablet: 3, desktop: 4 },
    showBreadcrumbs: true,
    showProductCount: true,
    filters: {
      categories: ["category", "priceRange", "rating"],
      priceRangeSteps: [100, 500, 1000, 2000, 5000],
      ratingOptions: [4, 3, 2, 1],
    },
    sortOptions: [
      { value: "recommended", label: "Relevance" },
      { value: "newest", label: "New Arrivals" },
      { value: "discount", label: "Discount" },
      { value: "price-asc", label: "Lowest Price" },
      { value: "price-desc", label: "Highest Price" },
    ],
    defaultSort: "recommended",
  },
} as const;
