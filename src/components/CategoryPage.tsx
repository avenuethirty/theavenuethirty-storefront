import React from 'react';
import { Product } from '../types';
import { Header } from './Header';
import { ProductGrid } from './ProductGrid';
import { CATEGORIES, getCategoryLabel } from '../utils/category';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';

interface CategoryPageProps {
  onAddToCart: (product: Product) => void;
  onOpenConsultation: () => void;
  cartCount: number;
  onOpenCart: () => void;
}

export const CategoryPage: React.FC<CategoryPageProps> = ({
  onAddToCart,
  onOpenConsultation,
  cartCount,
  onOpenCart,
}) => {
  const { slug } = useParams<{ slug: string }>();
  const category = slug || '';
  const label = getCategoryLabel(category);
  const categoryInfo = CATEGORIES.find((c) => c.key === category);

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

          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-light text-[#1A1A1A] tracking-tight">
              {label}
            </h1>
            {categoryInfo && (
              <p className="text-xs text-neutral-500">
                {categoryInfo.subCategories.length} sub-categories available
              </p>
            )}
          </div>
        </div>

        <ProductGrid
          category={category as any}
          onAddToCart={onAddToCart}
          onOpenConsultation={onOpenConsultation}
        />
      </main>
    </div>
  );
};
