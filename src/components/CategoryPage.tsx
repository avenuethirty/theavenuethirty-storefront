import React, { useEffect, useMemo } from 'react';
import { Product } from '../types';
import { Header } from './Header';
import { PLPGrid } from './PLPGrid';
import { Breadcrumbs } from './Breadcrumbs';
import { FilterBar } from './FilterBar';
import { getCategoryLabel } from '../utils/category';
import { toTypeSlug, formatTypeLabel } from '../utils/typeSlug';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { parseFilterParams, useFilteredProducts } from '../hooks/useFilteredProducts';
import { SHOP_CONFIG } from '../config/shop';

interface CategoryPageProps {
  onAddToCart: (product: Product) => void;
  onOpenConsultation: () => void;
  cartCount: number;
  onOpenCart: () => void;
  products?: Product[];
  catalogueReady?: boolean;
}

export const CategoryPage: React.FC<CategoryPageProps> = ({
  onAddToCart,
  onOpenConsultation,
  cartCount,
  onOpenCart,
  products,
  catalogueReady = true,
}) => {
  const { slug, typeSlug: rawTypeSlug } = useParams<{ slug: string; typeSlug?: string }>();
  const category = slug || '';
  const label = getCategoryLabel(category);

  const [searchParams] = useSearchParams();
  const filterParams = parseFilterParams(searchParams);

  const catalogue = products || [];
  const categoryProducts = useMemo(
    () => catalogue.filter((p) => p.category === category),
    [catalogue, category]
  );

  const typeLabel: string | null = useMemo(() => {
    if (!rawTypeSlug) return null;
    const match = categoryProducts.find(
      (p) => p.typeSlug === rawTypeSlug || toTypeSlug(p.tagline) === rawTypeSlug
    );
    return match ? formatTypeLabel(match.tagline) : null;
  }, [categoryProducts, rawTypeSlug]);

  const typeProducts = useMemo(() => {
    if (!rawTypeSlug || !typeLabel) return categoryProducts;
    return categoryProducts.filter(
      (p) => p.typeSlug === rawTypeSlug || toTypeSlug(p.tagline) === rawTypeSlug
    );
  }, [categoryProducts, rawTypeSlug, typeLabel]);

  const { filtered } = useFilteredProducts(typeProducts, filterParams);

  // A type slug that matches nothing in the current catalogue is stale
  // (renamed/removed in the sheet). Redirect to the category page rather
  // than showing an unexplained empty grid.
  const navigate = useNavigate();
  const isStaleTypeSlug =
    !!rawTypeSlug && catalogueReady && categoryProducts.length > 0 && !typeLabel;

  useEffect(() => {
    if (isStaleTypeSlug) {
      navigate(`/product/${category}`, { replace: true });
    }
  }, [isStaleTypeSlug, navigate, category]);

  useEffect(() => {
    document.title = typeLabel
      ? `${typeLabel} — ${label} | The Avenue Thirty`
      : `${label} | The Avenue Thirty`;
    return () => {
      document.title = 'The Avenue Thirty — Curated Fashion & Skincare';
    };
  }, [typeLabel, label]);

  // While the catalogue is still loading we can't yet distinguish a valid
  // deep link from a stale one; render a neutral loading state instead of
  // flashing "No products match your filters."
  const isLoading = !catalogueReady;

  return (
    <div className="relative min-h-screen bg-[#FAFAF9] text-[#1A1A1A] font-sans antialiased selection:bg-[#1A1A1A] selection:text-white">
      <Header
        cartCount={cartCount}
        onOpenCart={onOpenCart}
        onOpenConsultation={onOpenConsultation}
      />

      <main className="pt-24">
        <div className="max-w-7xl mx-auto px-6 mb-8">
          {SHOP_CONFIG.plp.showBreadcrumbs && (
            <Breadcrumbs
              category={category}
              typeLabel={typeLabel || undefined}
              typeSlug={rawTypeSlug}
            />
          )}

          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-light text-[#1A1A1A] tracking-tight">
              {typeLabel ?? label}
            </h1>
          </div>

          {SHOP_CONFIG.plp.showProductCount && !isLoading && (
            <FilterBar
              totalProducts={filtered.length}
              typeLabel={typeLabel || undefined}
              category={category}
            />
          )}
        </div>

        <div className="max-w-7xl mx-auto px-6 pb-24">
          <PLPGrid
            products={filtered}
            onAddToCart={onAddToCart}
            onOpenConsultation={onOpenConsultation}
            loading={isLoading}
          />
        </div>
      </main>
    </div>
  );
};
