import React, { useEffect, useMemo } from 'react';
import { Product } from '../types';
import { PLPGrid } from './PLPGrid';
import { Breadcrumbs } from './Breadcrumbs';
import { FilterBar } from './FilterBar';
import { getCategoryLabel } from '../utils/category';
import { toTypeSlug, formatTypeLabel } from '../utils/typeSlug';
import { DEFAULT_SITE_TITLE, pageTitle, SITE_NAME } from '../utils/seoText';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { parseFilterParams, useFilteredProducts } from '../hooks/useFilteredProducts';
import { SHOP_CONFIG } from '../config/shop';

interface CategoryPageProps {
  onAddToCart: (product: Product) => void;
  onOpenConsultation: () => void;
  onNavigateToProduct?: (product: Product) => void;
  products?: Product[];
  catalogueReady?: boolean;
}

export const CategoryPage: React.FC<CategoryPageProps> = ({
  onAddToCart,
  onOpenConsultation,
  onNavigateToProduct,
  products,
  catalogueReady = true,
}) => {
  // The 3-segment route is served by ProductOrCategoryPage, which hands the
  // last segment to this page only when it is a type slug rather than a
  // product. That route names the segment :productId, so read both param
  // names rather than assuming the old /product/:slug/:typeSlug path.
  const params = useParams<{ slug: string; typeSlug?: string; productId?: string }>();
  const category = params.slug || '';
  const rawTypeSlug = params.productId ?? params.typeSlug;
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
      ? pageTitle(typeLabel, label, SITE_NAME)
      : pageTitle(label, SITE_NAME);
    return () => {
      document.title = DEFAULT_SITE_TITLE;
    };
  }, [typeLabel, label]);

  // While the catalogue is still loading we can't yet distinguish a valid
  // deep link from a stale one; render a neutral loading state instead of
  // flashing "No products match your filters."
  const isLoading = !catalogueReady;

  return (
    <div className="relative min-h-screen bg-[#FAFAF9] text-[#1A1A1A] font-sans antialiased selection:bg-[#1A1A1A] selection:text-white">
      {/* No <Header> here: App.tsx renders the single site-wide header. A second
          copy stacked on top of it swallowed every tap, and because it was
          rendered without `onOpenMenu` the hamburger was a dead button. */}

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
            onNavigateToProduct={onNavigateToProduct}
            loading={isLoading}
          />
        </div>
      </main>
    </div>
  );
};
