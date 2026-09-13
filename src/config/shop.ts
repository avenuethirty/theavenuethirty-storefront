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
      columns: { mobile: 2, tablet: 2, desktop: 4 },
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
