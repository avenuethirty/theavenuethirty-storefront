import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Product } from '../types';
import { findProductByRef } from '../utils/productSlug';
import { ProductPage } from '../pages/ProductPage';
import { CategoryPage } from './CategoryPage';

interface ProductOrCategoryPageProps {
  products: Product[];
  catalogueReady: boolean;
  onAddToCart: (product: Product) => void;
  onOpenConsultation: () => void;
  onNavigateToProduct?: (product: Product) => void;
}

/**
 * The 3-segment product shape, `/product/:category/:ref`, is ambiguous: `ref`
 * can be a product slug, a legacy SKU id, or a type slug.
 *
 * A static route order cannot resolve that. `/product/:slug/:typeSlug` and
 * `/product/:slug/:productId` score identically in the router, so whichever is
 * declared first wins every 3-segment URL — which is why a SKU URL like
 * `/product/bags/6930` used to render the bags grid instead of the product.
 * Declaring the product route first just moves the breakage onto every type
 * listing. So the decision is made here, at runtime, with the catalogue in
 * hand, using the same slug-then-id-then-type order the server uses.
 */
export const ProductOrCategoryPage: React.FC<ProductOrCategoryPageProps> = ({
  products,
  catalogueReady,
  onAddToCart,
  onOpenConsultation,
  onNavigateToProduct,
}) => {
  const { productId } = useParams<{ productId: string }>();
  const resolved = useMemo(() => findProductByRef(products, productId), [products, productId]);

  if (!catalogueReady) {
    // A product URL must not flash a product grid on the way to the PDP, and a
    // type URL must not flash a product skeleton, so nothing is rendered until
    // the catalogue can actually answer the question.
    return (
      <div className="relative min-h-screen bg-[#FAFAF9] text-[#1A1A1A] font-sans antialiased selection:bg-[#1A1A1A] selection:text-white">
        <main className="pt-24">
          <div className="max-w-7xl mx-auto px-6 pb-24">
            <div className="space-y-4">
              <div className="h-8 bg-[#EFEFEF] animate-pulse rounded w-1/2" />
              <div className="h-4 bg-[#EFEFEF] animate-pulse rounded w-1/3" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (resolved) {
    return (
      <ProductPage
        products={products}
        catalogueReady={catalogueReady}
        onAddToCart={onAddToCart}
        onOpenConsultation={onOpenConsultation}
      />
    );
  }

  return (
    <CategoryPage
      products={products}
      catalogueReady={catalogueReady}
      onAddToCart={onAddToCart}
      onOpenConsultation={onOpenConsultation}
      onNavigateToProduct={onNavigateToProduct}
    />
  );
};
