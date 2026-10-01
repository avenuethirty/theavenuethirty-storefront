export interface TypeSectionConfig {
  category: string;
  title?: string;
  format: "cards" | "pills";
  grid?: { mobile: number; tablet: number; desktop: number };
  limit?: number;
  types: Record<string, { image?: string; label?: string; order?: number }>;
}

export interface CollectionMatch {
  collection?: string;
  category?: string;
  type?: string;
  minDiscountPct?: number;
  priceMin?: number;
  priceMax?: number;
}

export interface CollectionConfig {
  slug: string;
  title: string;
  subtitle?: string;
  match: CollectionMatch;
  image?: string;
  grid?: { mobile: number; tablet: number; desktop: number };
  itemsPerPage?: number;
  card?: { hidden?: boolean; order?: number };
}

export const SHOP_CONFIG = {
  // ==========================================================================
  // Site identity & contact
  // ==========================================================================
  name: "The Avenue Thirty",
  domain: "theavenuethirty.com",

  hero: {
    title: "Your Avenue to Confident Living",
    image: "https://i.postimg.cc/5tJ5zYT3/herobg-01.webp",
    video: "",
  },

  whatsapp: {
    number: "923331458843",
    defaultMessage: "Hi, I would like to inquire about an order from The Avenue Thirty.",
  },

  // ==========================================================================
  // Localization
  // ==========================================================================
  localization: {
    currencySymbol: "Rs. ",
    currencyCode: "PKR",
    formatLocale: "en-PK",
  },

  // ==========================================================================
  // Logistics & checkout
  // ==========================================================================
  shipping: {
    defaultFee: 240,
    freeShippingThreshold: 5000,
    allowCashOnDelivery: true,
  },

  // ==========================================================================
  // Catalog settings
  // ==========================================================================
  catalog: {
    itemsPerPage: 4,
    defaultSort: "featured",
    featuredTag: "featured",
  },

  // ==========================================================================
  // Categories (top nav & filter scope)
  // On DB Product Categories Dropdown should match with the slug to display the products on storefront.
  // ==========================================================================
  categories: [
    //{ name: "Clothing & Apparel", slug: "clothing_apparel" },
    { name: "Skincare", slug: "skincare", image: "https://i.postimg.cc/Rh0rgYH1/skincare.webp" },
    { name: "Bags", slug: "bags", image: "https://i.postimg.cc/Xq92cc2G/bags.webp" },
    { name: "Jewellery", slug: "jewellery", image: "https://i.postimg.cc/vZGQn0Ph/jewellery.webp" },
    { name: "Kids", slug: "toys", image: "https://i.postimg.cc/90z9cW9T/toys.webp" },
    { name: "Premium", slug: "premium", image: "https://i.postimg.cc/90z9cW9T/toys.webp" },
  ],

  categoryGrid: {
    columns: {
      mobile: 2,
      tablet: 2,
      desktop: 4,
    },
    rows: 1,
  },

  collectionCardGrid: {
    columns: {
      mobile: 2,
      tablet: 3,
      desktop: 4,
    },
  },

  // ==========================================================================
  // Homepage "Shop by type" sections
  // Array order is the homepage order. Each renders the category's types
  // (sheet Type column) as image cards or pill links deep-linking to
  // /product/:category/:typeSlug. Types sort by product count desc unless
  // pinned via `order`. Entries with no matching products are skipped.
  // Per-type overrides are keyed by type slug (slugified Type column value):
  //   image — custom card image (falls back to type's first product image)
  //   label — display label override (falls back to the sheet tagline)
  //   order — manual position pin (1 = first); omit for count-desc order
  // ==========================================================================
  typeSections: [
    {
      category: "bags",
      title: "Find your bag",
      format: "cards",
      grid: { mobile: 3, tablet: 6, desktop: 6 },
      limit: 6,
      types: {
        handbag: { image: "https://i.postimg.cc/3x3KGtL9/bags-02.webp", label: "Designer Handbags", order: 1 },
        "crossbody-bag": { image: "https://i.postimg.cc/Nj0cHccZ/crossbody-bag-02.webp", label: "Crossbody Bag", },
        "shoulder-bag": { image: "https://i.postimg.cc/W4d5j5zX/shoulder-bag-01.webp", label: "Shoulder Bag", },
        "tote-bag": { image: "https://i.postimg.cc/66M4LtYq/tote-bag-02.webp", label: "Tote Bag", },
        "wallet-clutch": { image: "https://i.postimg.cc/vmmkMqyr/wallet-03.webp", label: "Wallet & Clutch", },
        backpack: { image: "https://i.postimg.cc/N0Rjcjk3/backpack.webp", label: "Backpack", },
        "duffel-bag": { image: "https://i.postimg.cc/RCWVSddk/duffle-bag.webp", label: "Duffle Bag", },
        "office-bag": { image: "https://i.postimg.cc/rpqwqLZ1/office-bag.webp", label: "Office Bag", },
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
      title: "Kids Zone",
      format: "pills",
      limit: 8,
      types: {},
    },
  ] as TypeSectionConfig[],

  // ==========================================================================
  // Collections registry — declarative filter-based catalogue views
  // Reachable at flat URLs: /:slug
  // Status-based collections match the sheet's Collections column (case-insensitive).
  // Creative collections use category, price, or discount filters.
  // `card.hidden: true` means the collection is reachable by URL but not
  //   surfaced in the homepage "Shop by Collection" card grid.
  // `card.order` controls position in the card grid (lower = first).
  // ==========================================================================
  collections: [
    // --- Status-based (direct sheet tag match) ---
    {
      slug: "must-have",
      title: "Must-Have Styles",
      match: { collection: "Must-Have Styles" },
    },
    {
      slug: "best-sellers",
      title: "Best Sellers",
      match: { collection: "Best Seller" },
    },
    {
      slug: "on-sale",
      title: "On Sale",
      match: { collection: "Sale" },
    },
    {
      slug: "new-in",
      title: "New Arrivals",
      match: { collection: "New Arrival" },
    },
    // --- Nav-hidden pages (reachable by URL only) ---
    {
      slug: "trending",
      title: "Trending",
      match: { collection: "Trending" },
      card: { hidden: true },
    },
    {
      slug: "featured",
      title: "Featured",
      match: { collection: "Featured" },
      card: { hidden: true },
    },
    // --- Creative / filter-based collections ---
    {
      slug: "budget-buys",
      title: "Budget Buys",
      subtitle: "Affordable picks under Rs. 1,000",
      match: { priceMin: 0, priceMax: 1000 },
    },
    {
      slug: "budget-skincare",
      title: "Skincare Under Rs. 1,000",
      subtitle: "Gentle care without the splurge",
      match: { category: "skincare", priceMin: 0, priceMax: 1000 },
    },
    {
      slug: "bags-under-1500",
      title: "Handbags Under Rs. 1,500",
      subtitle: "Statement bags at a steal",
      match: { category: "bags", priceMin: 0, priceMax: 1500 },
    },
    {
      slug: "bags-clearance",
      title: "Bags 50%+ Off",
      subtitle: "Deep discounts on our best bags",
      match: { category: "bags", minDiscountPct: 50 },
    },
  ] as CollectionConfig[],

  // ==========================================================================
  // Homepage configuration
  // ==========================================================================

  // Carousel grid config, keyed by collection slug.
  // Only collections that appear as rails in homepage.sequence need entries.
  // Creative collections (budget-buys, etc.) surface via collectionCards, not as rails.
  carouselGrid: {
    "must-have": {
      columns: { mobile: 2, tablet: 2, desktop: 3 },
      rows: 1,
    },
    "best-sellers": {
      columns: { mobile: 2, tablet: 2, desktop: 4 },
      rows: 2,
    },
    "on-sale": {
      columns: { mobile: 2, tablet: 2, desktop: 8 },
      rows: 2,
    },
    "new-in": {
      columns: { mobile: 2, tablet: 2, desktop: 4 },
      rows: 2,
    },
  },

  // Homepage section sequence — render order drives the page layout.
  // The first item renders immediately; subsequent items lazy-mount via IntersectionObserver.
  // No banner entries: full-width category cards duplicate CategoryCardsSection and add scroll.
  homepage: {
    sequence: [
      { type: "rail", collection: "must-have" },
      { type: "rail", collection: "best-sellers" },
      { type: "types", category: "bags" },
      { type: "rail", collection: "on-sale" },
      { type: "types", category: "jewellery" },
      { type: "rail", collection: "new-in" },
      { type: "types", category: "toys" },
    ] as Array<
      | { type: "rail"; collection: string }
      | { type: "types"; category: string }
    >,
  },

  // ==========================================================================
  // Social media links
  // ==========================================================================
  social: {
    instagram: "https://instagram.com/theavenuethirty",
    tiktok: "https://tiktok.com/@theavenuethirty",
    x: "https://x.com/theavenuethirty",
    snapchat: "https://snapchat.com/add/theavenuethirty",
  },

  // ==========================================================================
  // AI settings
  // ==========================================================================
  ai: {
    model: "openai/gpt-oss-20b",
  },

  // ==========================================================================
  // Product listing page (PLP) settings
  // ==========================================================================
  plp: {
    itemsPerPage: 12,
    gridColumns: { mobile: 2, tablet: 3, desktop: 4 },
    showBreadcrumbs: true,
    showProductCount: true,
    filters: {
      categories: ["category", "priceRange"],
      priceRangeSteps: [100, 500, 1000, 2000, 5000],
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
