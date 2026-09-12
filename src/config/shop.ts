export const SHOP_CONFIG = {
  name: "The Avenue Thirty",
  domain: "theavenuethirty.com",

  // Contact & Social
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
  categories: [
    //{ name: "Clothing & Apparel", slug: "clothing_apparel" },
    { name: "Skincare & Beauty", slug: "skincare_beauty" },
    { name: "Bags & Backpacks", slug: "bags_backpacks" },
    { name: "Accessories & Jewellery", slug: "accessories" },
    { name: "Toys & Kids", slug: "toys_kids" },
  ],

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
