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
} as const;
