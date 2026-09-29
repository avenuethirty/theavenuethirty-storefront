import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Product } from '../types';
import { SHOP_CONFIG } from '../config/shop';
import { getDiscountBadge } from '../utils/discount';
import { getCollectionBySlug, matchCollection } from '../utils/collections';
import { toTypeSlug, formatTypeLabel } from '../utils/typeSlug';
import { DEFAULT_SITE_TITLE, pageTitle, sanitizeSeoText, SITE_NAME } from '../utils/seoText';
import { getRelatedProducts } from '../utils/recommendations';
import { Check, Plus } from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';

interface ProductPageProps {
  products: Product[];
  catalogueReady: boolean;
  onAddToCart: (product: Product) => void;
  onOpenConsultation: () => void;
}

export const ProductPage: React.FC<ProductPageProps> = ({
  products,
  catalogueReady,
  onAddToCart,
  onOpenConsultation,
}) => {
  const { slug: categorySlug, typeSlug, productId } = useParams<{
    slug: string;
    typeSlug?: string;
    productId: string;
  }>();

  const navigate = useNavigate();
  const [added, setAdded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const product = useMemo(() => products.find((p) => p.id === productId), [products, productId]);
  const categoryLabel = useMemo(() => {
    const cat = getCollectionBySlug(categorySlug || '');
    return cat?.title || categorySlug || '';
  }, [categorySlug]);

  const typeLabel = useMemo(() => {
    if (!product || !typeSlug) return null;
    const match = products.find(
      (p) => p.category === categorySlug && (p.typeSlug === typeSlug || toTypeSlug(p.tagline) === typeSlug)
    );
    return match ? formatTypeLabel(match.tagline) : null;
  }, [product, typeSlug, categorySlug, products]);

  const images = useMemo(() => {
    if (!product) return [];
    const imgs = [product.imageUrl];
    if (product.imageUrl2) imgs.push(product.imageUrl2);
    if (product.imageUrl3) imgs.push(product.imageUrl3);
    return imgs;
  }, [product]);

  // Must stay above the `catalogueReady` / `!product` early returns below.
  // A hook called after a conditional return changes the hook count between
  // renders, and React 19 unmounts the whole tree on that mismatch — which is
  // why a direct PDP URL or a refresh rendered blank while in-app navigation
  // worked (the catalogue was already loaded on the first render).
  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return getRelatedProducts(product, products, 4);
  }, [products, product]);

  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  const [hoveredProductId, setHoveredProductId] = useState<string | null>(null);

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [productId]);

  useEffect(() => {
    if (!product) return;
    document.title = pageTitle(product.name, SITE_NAME);
    return () => {
      document.title = DEFAULT_SITE_TITLE;
    };
  }, [product]);

  useEffect(() => {
    if (!product) return;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', sanitizeSeoText(product.description).slice(0, 160));
    }
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute('href', `https://theavenuethirty.com/product/${categorySlug}${typeSlug ? `/${typeSlug}` : ''}/${productId}`);
    }
  }, [product, categorySlug, typeSlug, productId]);

  useEffect(() => {
    if (!product) return;
    const existing = document.getElementById('product-jsonld');
    if (existing) existing.remove();

    const availability = product.availability === 'in_stock' || product.availability === 'preorder' || product.availability === 'backorder'
      ? 'https://schema.org/InStock'
      : 'https://schema.org/OutOfStock';

    const schema = {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      image: images,
      offers: {
        '@type': 'Offer',
        price: product.priceMonthly,
        priceCurrency: 'PKR',
        availability,
        url: `https://theavenuethirty.com/product/${categorySlug}${typeSlug ? `/${typeSlug}` : ''}/${productId}`,
      },
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'product-jsonld';
    script.text = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      const el = document.getElementById('product-jsonld');
      if (el) el.remove();
    };
  }, [product, images, categorySlug, typeSlug, productId]);

  if (!catalogueReady) {
    return (
      <div className="relative min-h-screen bg-[#FAFAF9] text-[#1A1A1A] font-sans antialiased selection:bg-[#1A1A1A] selection:text-white">
        <main className="pt-24">
          <div className="max-w-7xl mx-auto px-6 pb-24">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="aspect-square bg-[#EFEFEF] animate-pulse" />
              <div className="space-y-4">
                <div className="h-8 bg-[#EFEFEF] animate-pulse rounded" />
                <div className="h-4 bg-[#EFEFEF] animate-pulse rounded w-1/2" />
                <div className="h-4 bg-[#EFEFEF] animate-pulse rounded w-1/3" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="relative min-h-screen bg-[#FAFAF9] text-[#1A1A1A] font-sans antialiased selection:bg-[#1A1A1A] selection:text-white">
        <main className="pt-24">
          <div className="max-w-7xl mx-auto px-6 pb-24">
            <h1 className="text-3xl md:text-4xl font-light tracking-tight">Product not found</h1>
            <p className="mt-4 text-sm text-neutral-600">The product you are looking for does not exist or has been removed.</p>
            <Link to="/" className="mt-6 inline-block text-sm font-semibold underline">Continue shopping</Link>
          </div>
        </main>
      </div>
    );
  }

  const discountBadge = getDiscountBadge(product);

  const handleQuickAdd = () => {
    onAddToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="relative min-h-screen bg-[#FAFAF9] text-[#1A1A1A] font-sans antialiased selection:bg-[#1A1A1A] selection:text-white">
      <main className="pt-24">
        <div className="max-w-7xl mx-auto px-6 pb-24">
          <Breadcrumbs
            category={categorySlug}
            typeLabel={typeLabel || undefined}
            typeSlug={typeSlug}
            productName={product.name}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <div className="aspect-square bg-[#EFEFEF] overflow-hidden">
                <img
                  src={images[currentImageIndex] || product.imageUrl}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center"
                />
              </div>
              {images.length > 1 && (
                <div className="flex gap-3">
                  {images.map((src, idx) => (
                    <button
                      key={src}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`w-16 h-16 border overflow-hidden cursor-pointer ${
                        currentImageIndex === idx ? 'border-[#1A1A1A]' : 'border-neutral-300'
                      }`}
                    >
                      <img src={src} alt="" className="w-full h-full object-cover object-center" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <h1 className="text-2xl md:text-3xl font-light tracking-tight">{product.name}</h1>
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-xl font-semibold">
                  {SHOP_CONFIG.localization.currencySymbol}
                  {product.priceMonthly.toFixed(2)}
                </span>
                {product.originalPrice && (
                  <span className="text-sm text-neutral-500 line-through">
                    {SHOP_CONFIG.localization.currencySymbol}
                    {product.originalPrice.toFixed(2)}
                  </span>
                )}
                {discountBadge && (
                  <span className="text-sm font-semibold text-red-600">{discountBadge}</span>
                )}
              </div>

              <p className="mt-6 text-sm text-neutral-700 leading-relaxed whitespace-pre-line">{product.description}</p>

              <button
                onClick={handleQuickAdd}
                className="mt-8 w-full py-3 bg-[#1A1A1A] text-white text-xs font-semibold uppercase tracking-widest hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                {added ? 'Added to Cart' : 'Quick Add to Cart'}
              </button>

            </div>
          </div>

          {relatedProducts.length > 0 && (
            <section className="mt-20">
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#9A8C83]">
                {typeLabel || categoryLabel}
              </span>
              <h2 className="mt-3 mb-8 text-2xl md:text-3xl font-light tracking-tight">
                You may also like
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-[10px]">
                {relatedProducts.map(({ product: rp }) => {
                  const isAdded = addedProductId === rp.id;
                  const rpDiscount = getDiscountBadge(rp);

                  return (
                    <Link
                      key={rp.id}
                      to={`/product/${rp.category}${rp.typeSlug ? `/${rp.typeSlug}` : ''}/${rp.id}`}
                      className="group flex flex-col"
                      onMouseEnter={() => setHoveredProductId(rp.id)}
                      onMouseLeave={() => setHoveredProductId(null)}
                    >
                      <div className="relative aspect-square w-full bg-[#EFEFEF] overflow-hidden flex items-center justify-center p-0 mb-4 transition-colors group-hover:bg-[#E8E8E8]">
                        <img
                          src={hoveredProductId === rp.id && rp.imageUrl2 ? rp.imageUrl2 : rp.imageUrl}
                          alt={rp.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                        />

                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-end justify-center p-4">
                          <button
                            onClick={(e) => {
                              // preventDefault is required in addition to
                              // stopPropagation: the card is a react-router
                              // <Link>, and Router only skips navigation when the
                              // click event is defaultPrevented. stopPropagation
                              // alone lets the anchor navigate away.
                              e.preventDefault();
                              e.stopPropagation();
                              onAddToCart(rp);
                              setAddedProductId(rp.id);
                              setTimeout(() => setAddedProductId(null), 1500);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 w-full py-2.5 bg-[#1A1A1A] hover:bg-neutral-800 text-white text-[10px] font-sans font-medium uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                          >
                            {isAdded ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span>Added to Cart</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3 h-3" />
                                <span>Quick Add</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col text-left">
                        <h3 className="text-xs font-sans font-semibold tracking-wider text-[#1A1A1A] uppercase leading-tight">
                          {rp.name}
                        </h3>
                        <span className="text-xs font-sans text-[#666666] tracking-wider uppercase mt-1">
                          {rp.originalPrice ? (
                            <>
                              <span className="line-through opacity-70">
                                {SHOP_CONFIG.localization.currencySymbol}
                                {rp.originalPrice.toFixed(2)}
                              </span>
                              <span className="ml-2 font-semibold text-[#1A1A1A]">
                                {SHOP_CONFIG.localization.currencySymbol}
                                {rp.priceMonthly.toFixed(2)}
                              </span>
                              {rpDiscount && (
                                <span className="ml-2 font-semibold text-red-600">{rpDiscount}</span>
                              )}
                            </>
                          ) : (
                            <>
                              {SHOP_CONFIG.localization.currencySymbol}
                              {rp.priceMonthly.toFixed(2)}
                            </>
                          )}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};
