import React from 'react';
import { Product } from '../types';
import { Header } from './Header';
import { PLPGrid } from './PLPGrid';
import { Breadcrumbs } from './Breadcrumbs';
import { FilterBar } from './FilterBar';
import { CATEGORIES, getCategoryLabel } from '../utils/category';
import { ArrowLeft } from 'lucide-react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { parseFilterParams, useFilteredProducts } from '../hooks/useFilteredProducts';
import { SHOP_CONFIG } from '../config/shop';

interface CategoryPageProps {
  onAddToCart: (product: Product) => void;
  onOpenConsultation: () => void;
  cartCount: number;
  onOpenCart: () => void;
  products?: Product[];
}

export const CategoryPage: React.FC<CategoryPageProps> = ({
  onAddToCart,
  onOpenConsultation,
  cartCount,
  onOpenCart,
  products,
}) => {
  const { slug } = useParams<{ slug: string }>();
  const category = slug || '';
  const label = getCategoryLabel(category);
  const categoryInfo = CATEGORIES.find((c) => c.key === category);

  const [searchParams] = useSearchParams();
  const filterParams = parseFilterParams(searchParams);

  const catalogue = products || [];
  const categoryProducts = catalogue.filter((p) => p.category === category);
  const { filtered } = useFilteredProducts(categoryProducts, filterParams);

  return (
    <div className="relative min-h-screen bg-[#FAFAF9] text-[#1A1A1A] font-sans antialiased selection:bg-[#1A1A1A] selection:text-white">
      <Header
        cartCount={cartCount}
        onOpenCart={onOpenCart}
        onOpenConsultation={onOpenConsultation}
      />

      <main className="pt-24">
        <div className="max-w-7xl mx-auto px-6 mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#1A1A1A]/70 hover:text-[#1A1A1A] transition-colors cursor-pointer mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Store</span>
          </Link>

          {SHOP_CONFIG.plp.showBreadcrumbs && (
            <Breadcrumbs category={category} />
          )}

          <div className="space-y-2 mb-6">
            <h1 className="text-3xl md:text-4xl font-light text-[#1A1A1A] tracking-tight">
              {label}
            </h1>
            {categoryInfo && (
              <p className="text-xs text-neutral-500">
                {categoryInfo.subCategories.length} sub-categories available
              </p>
            )}
          </div>

          {SHOP_CONFIG.plp.showProductCount && (
            <FilterBar totalProducts={filtered.length} />
          )}
        </div>

        <div className="max-w-7xl mx-auto px-6">
          <PLPGrid
            products={filtered}
            onAddToCart={onAddToCart}
            onOpenConsultation={onOpenConsultation}
          />
        </div>
      </main>
    </div>
  );
};
